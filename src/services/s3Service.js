import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1', // Update with your region
  credentials: new AWS.Credentials({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY || ''
  })
});

const s3 = new AWS.S3();

export const fetchIndicatorsList = async () => {
  try {
    const bucketName = process.env.REACT_APP_S3_BUCKET || 'my-fred-data-12345';
    const prefixPath = process.env.REACT_APP_S3_PREFIX || 'fred_metadata';
    
    const params = {
      Bucket: bucketName,
      Key: `${prefixPath}/series_index.json`
    };
    
    console.log('Fetching indicators from S3:', params);
    const response = await s3.getObject(params).promise();
    const jsonData = JSON.parse(response.Body.toString());
    
    console.log(`Found ${jsonData.series.length} indicators`);
    return jsonData.series.map(series => ({
      id: series.id,
      title: series.title,
      frequency: series.frequency,
      popularity: series.popularity
    }));
  } catch (error) {
    console.error('Error fetching indicators from S3:', error);
    return [];
  }
};

export const fetchIndicatorData = async (seriesId) => {
  try {
    const apiKey = process.env.REACT_APP_FRED_API_KEY || '';
    const originalUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
    
    // Use a CORS proxy for the FRED API (temporary solution)
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
    
    const response = await fetch(corsProxyUrl);
    const data = await response.json();
    
    return data.observations.map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
  } catch (error) {
    console.error(`Error fetching data for indicator ${seriesId}:`, error);
    return [];
  }
};
