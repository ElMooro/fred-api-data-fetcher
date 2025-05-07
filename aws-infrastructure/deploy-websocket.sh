#!/bin/bash

# AWS WebSocket API Gateway deployment script
# Prerequisites: AWS CLI configured, jq installed

# Configuration
API_NAME="financial-dashboard-websocket-api"
REGION="${AWS_REGION:-us-east-1}"
STAGE_NAME="production"
LAMBDA_FUNCTION_NAME="financial-dashboard-websocket-handler"
LAMBDA_RUNTIME="nodejs18.x"
LAMBDA_ROLE_NAME="financial-dashboard-websocket-role"

echo "Deploying WebSocket API Gateway for Financial Dashboard..."

# Create IAM role for Lambda
echo "Creating IAM role..."
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
