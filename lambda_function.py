import json
import os
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import boto3
import requests
from botocore.exceptions import ClientError
# --- Configuration ---
# Set up basic logging
LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)
# FRED API Configuration
FRED_API_ENDPOINT_BASE: str = 'https://api.stlouisfed.org/fred'
FRED_API_SERIES_UPDATES_PATH: str = '/series/updates'
# API request parameters
FRED_API_REQUEST_LIMIT: int = 1000  # Max allowed by FRED API for this endpoint
FRED_API_FILE_TYPE: str = 'json'
# Date for considering a series discontinued (YYYY-MM-DD)
# Series with an observation_end before this date will be skipped.
SERIES_DISCONTINUED_BEFORE_DATE: str = '2023-01-01'
# Frequencies considered as "high" indicating importance
HIGH_UPDATE_FREQUENCIES: List[str] = ['Daily', 'Weekly', 'Monthly']
# S3 Configuration - To be set as environment variables
# S3_BUCKET_NAME: str (e.g., 'my-fred-data-bucket')
# S3_PREFIX: str (e.g., 'fred_metadata/series_updates')
# FRED_API_KEY: str (Your FRED API Key)
# Lambda Execution Control
LAMBDA_TIMEOUT_BUFFER_MS: int = 30 * 1000  # 30 seconds buffer before Lambda timeout
MAX_RUNTIME_SECONDS_BEFORE_CHECKPOINT: int = 13 * 60  # Max runtime ~13 mins to leave buffer for 15 min Lambda
API_CALLS_PER_RATE_LIMIT_PAUSE: int = 10
RATE_LIMIT_PAUSE_SECONDS: int = 5
# --- Helper Functions ---
def get_env_variable(var_name: str) -> str:
    """Fetches an environment variable or raises an error if not found."""
    value = os.environ.get(var_name)
    if not value:
        LOGGER.error(f"Environment variable {var_name} not set.")
        raise ValueError(f"Environment variable {var_name} is required.")
    return value
def is_important_series(series_data: Dict[str, Any]) -> bool:
    """
    Determine if a series is important based on available criteria from /series/updates.
    Args:
        series_data: A dictionary representing a single series from FRED API.
    Returns:
        True if the series is considered important, False otherwise.
    Note on limitations:
    The '/series/updates' endpoint provides limited information for each series.
    - Category filtering: Not directly possible without extra API calls per series
      to fetch full details (e.g., using '/fred/series').
    - Observation count: Not provided by '/series/updates'.
    - Popularity: The 'popularity' field (0-100) is available and could be
      used as an additional filter if a suitable threshold is defined.
    """
    # Skip discontinued series
    observation_end = series_data.get('observation_end')
    if observation_end and observation_end < SERIES_DISCONTINUED_BEFORE_DATE:
        return False
    
    # Check if it's a popular series
    # FRED provides a popularity score (0-100) indicating relative importance
    popularity = series_data.get('popularity', 0)
    if popularity > 50:  # Consider series with popularity > 50 as important
        return True
    
    # Check if it has a high frequency of updates (indicates actively used series)
    frequency = series_data.get('frequency')
    if frequency in HIGH_UPDATE_FREQUENCIES:
        return True
    
    # Check for important series by ID
    # List of widely used indicators in economics and finance
    IMPORTANT_SERIES_IDS = [
        'GDP',      # Gross Domestic Product
        'GDPC1',    # Real Gross Domestic Product
        'UNRATE',   # Unemployment Rate
        'CPIAUCSL', # Consumer Price Index
        'FEDFUNDS', # Federal Funds Effective Rate
        'SP500',    # S&P 500 Index
        'DGS10',    # 10-Year Treasury Constant Maturity Rate
        'PAYEMS',   # All Employees: Total Nonfarm
        'INDPRO',   # Industrial Production Index
        'PCE',      # Personal Consumption Expenditures
        'M2',       # M2 Money Stock
        'HOUST',    # Housing Starts
        'RSAFS',    # Retail Sales
        'USREC',    # NBER Recession Indicators
        'DCOILWTICO', # Crude Oil Prices: WTI
        'GFDEGDQ188S', # Federal Debt: Total Public Debt as % of GDP
        'T10Y2Y',   # 10-Year Treasury Minus 2-Year Treasury
        'USAGDPDEFQISMEI', # GDP Implicit Price Deflator
        'UMCSENT',  # Consumer Sentiment Index
        'EXUSEU',   # U.S. / Euro Foreign Exchange Rate
        'DAAA',     # Moody's Seasoned Aaa Corporate Bond Yield
        'DBAA',     # Moody's Seasoned Baa Corporate Bond Yield
        'PCEPI',    # Personal Consumption Expenditures: Chain-type Price Index
    ]
    
    if series_data.get('id') in IMPORTANT_SERIES_IDS:
        return True
        
    return False

def make_fred_api_request(
    endpoint_path: str, 
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Makes a request to the FRED API.
    
    Args:
        endpoint_path: The API endpoint path (e.g., '/series/updates')
        params: Dictionary of query parameters
        
    Returns:
        Dict containing the API response
        
    Raises:
        requests.exceptions.RequestException: For any request-related errors
    """
    url = f"{FRED_API_ENDPOINT_BASE}{endpoint_path}"
    LOGGER.info(f"Making request to {url} with params: {params}")
    
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise exception for HTTP errors
    
    return response.json()

def store_data_in_s3(
    bucket: str, 
    key: str, 
    data: Dict[str, Any]
) -> None:
    """
    Store JSON data in an S3 bucket.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        data: Data to store (will be converted to JSON)
        
    Raises:
        botocore.exceptions.ClientError: For S3-related errors
    """
    try:
        s3_client = boto3.client('s3')
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(data, indent=2),
            ContentType='application/json'
        )
        LOGGER.info(f"Successfully stored data at s3://{bucket}/{key}")
    except ClientError as e:
        LOGGER.error(f"Error storing data in S3: {str(e)}")
        raise

def create_checkpoint(
    bucket: str,
    prefix: str,
    offset: int,
    total_fetched: int,
    important_count: int,
    batch_number: int,
    execution_complete: bool = False,
    error: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create and store a checkpoint in S3 for resuming execution.
    
    Args:
        bucket: S3 bucket name
        prefix: S3 prefix for storing checkpoint data
        offset: Current API request offset
        total_fetched: Total number of series fetched so far
        important_count: Number of important series found so far
        batch_number: Current batch number
        execution_complete: Whether execution is complete
        error: Optional error message
        
    Returns:
        Checkpoint data dictionary
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    checkpoint = {
        'timestamp': timestamp,
        'offset': offset,
        'total_fetched': total_fetched,
        'important_count': important_count,
        'batch_number': batch_number,
        'execution_complete': execution_complete
    }
    
    if error:
        checkpoint['error'] = error
    
    try:
        store_data_in_s3(
            bucket=bucket,
            key=f"{prefix}/checkpoint.json",
            data=checkpoint
        )
        
        # Also create a timestamped checkpoint for history
        store_data_in_s3(
            bucket=bucket,
            key=f"{prefix}/checkpoints/checkpoint_{timestamp.replace(':', '-')}.json",
            data=checkpoint
        )
        
    except Exception as e:
        LOGGER.error(f"Failed to store checkpoint: {str(e)}")
    
    return checkpoint

def fetch_fred_series_metadata(
    event: Dict[str, Any], 
    context: Any
) -> Dict[str, Any]:
    """
    Main function to fetch and store important FRED series metadata.
    
    Args:
        event: Lambda event data, may contain checkpoint info for resuming
        context: Lambda context
        
    Returns:
        Dictionary with execution results
    """
    # Get configuration from environment variables
    try:
        fred_api_key = get_env_variable('FRED_API_KEY')
        s3_bucket = get_env_variable('S3_BUCKET_NAME')
        s3_prefix = get_env_variable('S3_PREFIX')
    except ValueError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    
    # Initialize tracking variables
    start_time = time.time()
    current_offset = 0
    total_series_fetched = 0
    important_series_count = 0
    batch_number = 0
    api_calls_count = 0
    
    # Check if this is a continuation from a previous execution
    if isinstance(event, dict) and event.get('checkpoint'):
        checkpoint = event.get('checkpoint', {})
        current_offset = checkpoint.get('offset', 0)
        total_series_fetched = checkpoint.get('total_fetched', 0)
        important_series_count = checkpoint.get('important_count', 0)
        batch_number = checkpoint.get('batch_number', 0)
        
        LOGGER.info(f"Resuming execution from checkpoint: offset={current_offset}, "
                    f"batch={batch_number}, total_fetched={total_series_fetched}")
    
    # Main execution loop
    keep_fetching = True
    
    while keep_fetching:
        # Check if we're approaching Lambda timeout
        elapsed_seconds = time.time() - start_time
        lambda_time_remaining = (
            context.get_remaining_time_in_millis() 
            if hasattr(context, 'get_remaining_time_in_millis') 
            else None
        )
        
        # Create checkpoint and exit if we're running out of time
        if (lambda_time_remaining is not None and lambda_time_remaining < LAMBDA_TIMEOUT_BUFFER_MS) or \
           (elapsed_seconds > MAX_RUNTIME_SECONDS_BEFORE_CHECKPOINT):
            LOGGER.info(f"Approaching timeout. Creating checkpoint after {elapsed_seconds:.2f}s")
            
            checkpoint = create_checkpoint(
                bucket=s3_bucket,
                prefix=s3_prefix,
                offset=current_offset,
                total_fetched=total_series_fetched,
                important_count=important_series_count,
                batch_number=batch_number
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Execution paused and checkpointed due to approaching Lambda timeout',
                    'checkpoint': checkpoint
                }),
                'checkpoint': checkpoint
            }
        
        try:
            # Make API request to fetch series batch
            api_calls_count += 1
            api_params = {
                'api_key': fred_api_key,
                'file_type': FRED_API_FILE_TYPE,
                'limit': FRED_API_REQUEST_LIMIT,
                'offset': current_offset
            }
            
            LOGGER.info(f"Fetching batch {batch_number} (offset: {current_offset})")
            response_data = make_fred_api_request(
                endpoint_path=FRED_API_SERIES_UPDATES_PATH,
                params=api_params
            )
            
            # Process the batch of series
            series_batch = response_data.get('seriess', [])
            batch_count = len(series_batch)
            
            if batch_count == 0:
                LOGGER.info("No more series found. Completing execution.")
                keep_fetching = False
            else:
                # Filter for important series
                batch_important_series = []
                for series in series_batch:
                    if is_important_series(series):
                        batch_important_series.append(series)
                
                batch_important_count = len(batch_important_series)
                important_series_count += batch_important_count
                
                LOGGER.info(f"Batch {batch_number}: Found {batch_important_count} "
                           f"important series out of {batch_count}")
                
                # Store the batch of important series
                if batch_important_series:
                    store_data_in_s3(
                        bucket=s3_bucket,
                        key=f"{s3_prefix}/batches/batch_{batch_number}.json",
                        data={
                            'count': batch_important_count,
                            'series': batch_important_series
                        }
                    )
                
                # Update tracking variables
                total_series_fetched += batch_count
                current_offset += FRED_API_REQUEST_LIMIT
                batch_number += 1
                
                # Add delay to respect API rate limits
                if api_calls_count % API_CALLS_PER_RATE_LIMIT_PAUSE == 0:
                    LOGGER.info(f"Pausing for {RATE_LIMIT_PAUSE_SECONDS}s to respect API rate limits")
                    time.sleep(RATE_LIMIT_PAUSE_SECONDS)
                
        except Exception as e:
            error_msg = f"Error in batch {batch_number}: {str(e)}"
            LOGGER.error(error_msg)
            
            # Create error checkpoint
            checkpoint = create_checkpoint(
                bucket=s3_bucket,
                prefix=s3_prefix,
                offset=current_offset,
                total_fetched=total_series_fetched,
                important_count=important_series_count,
                batch_number=batch_number,
                error=error_msg
            )
            
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': error_msg,
                    'checkpoint': checkpoint
                }),
                'checkpoint': checkpoint
            }
    
    # Execution completed successfully
    execution_time = time.time() - start_time
    
    # Create final checkpoint and metadata summary
    checkpoint = create_checkpoint(
        bucket=s3_bucket,
        prefix=s3_prefix,
        offset=current_offset,
        total_fetched=total_series_fetched,
        important_count=important_series_count,
        batch_number=batch_number,
        execution_complete=True
    )
    
    # Create index of important series for easier access
    try:
        create_series_index(s3_bucket, s3_prefix, batch_number)
    except Exception as e:
        LOGGER.error(f"Failed to create series index: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Successfully completed FRED series metadata collection',
            'total_series_processed': total_series_fetched,
            'important_series_saved': important_series_count,
            'execution_time_seconds': execution_time,
            'checkpoint': checkpoint
        }),
        'checkpoint': checkpoint
    }

def create_series_index(
    bucket: str,
    prefix: str,
    total_batches: int
) -> None:
    """
    Create a consolidated index of all important series.
    
    Args:
        bucket: S3 bucket name
        prefix: S3 prefix for stored data
        total_batches: Total number of batches to process
    """
    LOGGER.info(f"Creating consolidated index from {total_batches} batches")
    
    s3_client = boto3.client('s3')
    all_series = []
    
    # Read all batches
    for batch_num in range(total_batches):
        try:
            response = s3_client.get_object(
                Bucket=bucket,
                Key=f"{prefix}/batches/batch_{batch_num}.json"
            )
            
            batch_data = json.loads(response['Body'].read().decode('utf-8'))
            all_series.extend(batch_data.get('series', []))
        except Exception as e:
            LOGGER.warning(f"Could not read batch {batch_num}: {str(e)}")
    
    # Create simplified index
    series_index = []
    for series in all_series:
        series_index.append({
            'id': series.get('id', ''),
            'title': series.get('title', ''),
            'frequency': series.get('frequency', ''),
            'units': series.get('units', ''),
            'observation_start': series.get('observation_start', ''),
            'observation_end': series.get('observation_end', ''),
            'last_updated': series.get('last_updated', ''),
            'popularity': series.get('popularity', 0)
        })
    
    # Sort by popularity (descending)
    series_index.sort(key=lambda x: x.get('popularity', 0), reverse=True)
    
    # Store the index
    store_data_in_s3(
        bucket=bucket,
        key=f"{prefix}/series_index.json",
        data={
            'count': len(series_index),
            'last_updated': datetime.now(timezone.utc).isoformat(),
            'series': series_index
        }
    )
    
    LOGGER.info(f"Created index with {len(series_index)} important series")

def lambda_handler(event, context):
    """
    AWS Lambda handler function.
    
    Args:
        event: Lambda event object
        context: Lambda context object
        
    Returns:
        Lambda response object
    """
    LOGGER.info(f"Starting Lambda execution with event: {json.dumps(event)}")
    
    result = fetch_fred_series_metadata(event, context)
    
    LOGGER.info("Lambda execution completed")
    return result

if __name__ == '__main__':
    """
    Local execution entry point for testing.
    """
    # Configure logging for local execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Mock Lambda context
    class MockContext:
        def get_remaining_time_in_millis(self):
            return 900000  # 15 minutes
    
    # Prompt for environment variables if not set
    if not os.environ.get('FRED_API_KEY'):
        os.environ['FRED_API_KEY'] = input("Enter your FRED API key: ")
    
    if not os.environ.get('S3_BUCKET_NAME'):
        os.environ['S3_BUCKET_NAME'] = input("Enter your S3 bucket name: ")
    
    if not os.environ.get('S3_PREFIX'):
        os.environ['S3_PREFIX'] = input("Enter S3 prefix (default: fred_metadata): ") or "fred_metadata"
    
    # Check if resuming from checkpoint
    resume = input("Resume from checkpoint? (y/n): ").lower().strip() == 'y'
    
    event = {}
    if resume:
        try:
            s3_client = boto3.client('s3')
            checkpoint_key = f"{os.environ.get('S3_PREFIX')}/checkpoint.json"
            
            LOGGER.info(f"Attempting to load checkpoint from "
                        f"s3://{os.environ.get('S3_BUCKET_NAME')}/{checkpoint_key}")
            
            response = s3_client.get_object(
                Bucket=os.environ.get('S3_BUCKET_NAME'),
                Key=checkpoint_key
            )
            
            checkpoint = json.loads(response['Body'].read().decode('utf-8'))
            event = {'checkpoint': checkpoint}
            
            LOGGER.info(f"Loaded checkpoint: {json.dumps(checkpoint, indent=2)}")
        except Exception as e:
            LOGGER.error(f"Failed to load checkpoint: {str(e)}")
            if input("Continue with a new execution? (y/n): ").lower().strip() != 'y':
                LOGGER.info("Exiting")
                exit(0)
    
    # Run the Lambda handler
    result = lambda_handler(event, MockContext())
    
    # Pretty print the result
    LOGGER.info(f"Execution result: {json.dumps(result, indent=2)}")
