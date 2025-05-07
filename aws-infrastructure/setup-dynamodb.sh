#!/bin/bash

# Script to create DynamoDB table for WebSocket connections
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "Creating DynamoDB table for WebSocket connections..."

aws dynamodb create-table \
  --table-name financial-dashboard-connections \
  --attribute-definitions AttributeName=connectionId,AttributeType=S \
  --key-schema AttributeName=connectionId,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $AWS_REGION

echo "DynamoDB table created successfully!"
