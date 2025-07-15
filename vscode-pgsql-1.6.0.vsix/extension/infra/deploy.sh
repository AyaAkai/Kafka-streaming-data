#!/bin/bash

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default parameter file paths
PARAMETER_FILE="./infra/main.parameters.json"
BICEP_FILE="./infra/main.bicep"

# Function to display script usage
usage() {
  echo -e "${BLUE}Usage:${NC}"
  echo -e "  $0 [options]"
  echo -e ""
  echo -e "${BLUE}Options:${NC}"
  echo -e "  -s, --subscription-id     Override the subscription ID from the parameter file."
  echo -e "  -g, --resource-group      Override the resource group from the parameter file."
  echo -e "  -p, --parameter-file      Path to the parameter file. Default: ./infra/main.parameters.json"
  echo -e "  -b, --bicep-file          Path to the Bicep file. Default: ./infra/main.bicep"
  echo -e "  -h, --help                Display this help message."
  echo -e ""
  echo -e "${BLUE}Example:${NC}"
  echo -e "  $0"
  echo -e "  $0 -s 00000000-0000-0000-0000-000000000000 -g custom-resource-group"
}

# Parse command line arguments
SUBSCRIPTION_ID_OVERRIDE=""
RESOURCE_GROUP_OVERRIDE=""

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -s|--subscription-id)
      SUBSCRIPTION_ID_OVERRIDE="$2"
      shift
      shift
      ;;
    -g|--resource-group)
      RESOURCE_GROUP_OVERRIDE="$2"
      shift
      shift
      ;;
    -p|--parameter-file)
      PARAMETER_FILE="$2"
      shift
      shift
      ;;
    -b|--bicep-file)
      BICEP_FILE="$2"
      shift
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      usage
      exit 1
      ;;
  esac
done

# Check if parameter file exists
if [[ ! -f "$PARAMETER_FILE" ]]; then
  echo -e "${RED}Error: Parameter file $PARAMETER_FILE not found.${NC}"
  exit 1
fi

# Check if bicep file exists
if [[ ! -f "$BICEP_FILE" ]]; then
  echo -e "${RED}Error: Bicep file $BICEP_FILE not found.${NC}"
  exit 1
fi


# Load parameters from parameter file
echo -e "${BLUE}Loading parameters from $PARAMETER_FILE...${NC}"
SUBSCRIPTION_ID=$(jq -r '.parameters.deploymentSubscriptionId.value' "$PARAMETER_FILE")
RESOURCE_GROUP=$(jq -r '.parameters.deploymentResourceGroup.value' "$PARAMETER_FILE")
LOCATION=$(jq -r '.parameters.location.value' "$PARAMETER_FILE")
ENVIRONMENT=$(jq -r '.parameters.environment.value' "$PARAMETER_FILE")
BASE_NAME=$(jq -r '.parameters.baseName.value' "$PARAMETER_FILE")
RETENTION_DAYS=$(jq -r '.parameters.retentionInDays.value' "$PARAMETER_FILE")

# Override with command line arguments if provided
if [[ -n "$SUBSCRIPTION_ID_OVERRIDE" ]]; then
  echo -e "${YELLOW}Overriding subscription ID from command line.${NC}"
  SUBSCRIPTION_ID="$SUBSCRIPTION_ID_OVERRIDE"
fi

if [[ -n "$RESOURCE_GROUP_OVERRIDE" ]]; then
  echo -e "${YELLOW}Overriding resource group from command line.${NC}"
  RESOURCE_GROUP="$RESOURCE_GROUP_OVERRIDE"
fi

# Validate subscription ID
if [[ -z "$SUBSCRIPTION_ID" ]]; then
  echo -e "${RED}Error: Subscription ID is not set in parameters file and not provided as an override.${NC}"
  usage
  exit 1
fi

# Validate resource group
if [[ -z "$RESOURCE_GROUP" ]]; then
  echo -e "${RED}Error: Resource group is not set in parameters file and not provided as an override.${NC}"
  usage
  exit 1
fi

# Check if parameter file exists
if [[ ! -f "$PARAMETER_FILE" ]]; then
  echo -e "${RED}Error: Parameter file $PARAMETER_FILE not found.${NC}"
  exit 1
fi

# Check if bicep file exists
if [[ ! -f "$BICEP_FILE" ]]; then
  echo -e "${RED}Error: Bicep file $BICEP_FILE not found.${NC}"
  exit 1
fi

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
  echo -e "${RED}Error: Azure CLI is not installed. Please install it first.${NC}"
  echo -e "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check if bicep CLI is installed
if ! az bicep version &> /dev/null; then
  echo -e "${YELLOW}Warning: Bicep CLI is not installed. Installing...${NC}"
  az bicep install
fi

# Verify Azure CLI is logged in
echo -e "${BLUE}Verifying Azure CLI authentication...${NC}"
ACCOUNT_INFO=$(az account show 2>/dev/null || echo '{}')
if [[ $(echo $ACCOUNT_INFO | jq -r '.id') == "null" ]]; then
  echo -e "${RED}Error: Not logged in to Azure CLI. Please run 'az login' first.${NC}"
  exit 1
fi
echo -e "${GREEN}Authentication verified.${NC}"

# Set the subscription
echo -e "${BLUE}Setting subscription to $SUBSCRIPTION_ID...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"
echo -e "${GREEN}Subscription set.${NC}"

# Check if resource group exists, create if not
echo -e "${BLUE}Checking if resource group $RESOURCE_GROUP exists...${NC}"
RG_EXISTS=$(az group exists --name "$RESOURCE_GROUP")
if [[ $RG_EXISTS == "false" ]]; then
  echo -e "${YELLOW}Resource group does not exist. Creating...${NC}"
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
  echo -e "${GREEN}Resource group created.${NC}"
else
  echo -e "${GREEN}Resource group exists.${NC}"
fi

# Parameters are now loaded from parameter file, no need to update them
echo -e "${BLUE}Using parameters from file:${NC}"
echo -e "  Subscription: ${GREEN}$SUBSCRIPTION_ID${NC}"
echo -e "  Resource Group: ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "  Location: ${GREEN}$LOCATION${NC}"
echo -e "  Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "  Base Name: ${GREEN}$BASE_NAME${NC}"
echo -e "  Retention: ${GREEN}$RETENTION_DAYS days${NC}"

# Validate the Bicep template
echo -e "${BLUE}Validating Bicep deployment...${NC}"
az deployment group validate \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$BICEP_FILE" \
  --parameters "@$PARAMETER_FILE"

if [[ $? -ne 0 ]]; then
  echo -e "${RED}Error: Bicep validation failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Bicep validation successful.${NC}"

# Preview the changes (what-if)
echo -e "${BLUE}Previewing changes (What-If)...${NC}"
az deployment group what-if \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$BICEP_FILE" \
  --parameters "@$PARAMETER_FILE"

# Prompt for confirmation
read -p "$(echo -e ${YELLOW}Do you want to proceed with the deployment? [y/N]${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Deployment cancelled.${NC}"
  exit 0
fi

# Deploy the Bicep template
echo -e "${BLUE}Deploying resources...${NC}"
DEPLOYMENT_NAME="$BASE_NAME-appinsights-$ENVIRONMENT-$(date +%Y%m%d%H%M%S)"
DEPLOYMENT_OUTPUT=$(az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$BICEP_FILE" \
  --parameters "@$PARAMETER_FILE")

if [[ $? -ne 0 ]]; then
  echo -e "${RED}Error: Deployment failed.${NC}"
  exit 1
fi

# Extract the outputs
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${BLUE}Resource details:${NC}"
APP_INSIGHTS_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.appInsightsName.value')
APP_INSIGHTS_CONNECTION_STRING=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.appInsightsConnectionString.value')
APP_INSIGHTS_INSTRUMENTATION_KEY=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.appInsightsInstrumentationKey.value')
LOG_ANALYTICS_WORKSPACE_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.logAnalyticsWorkspaceName.value')

echo -e "Application Insights Name: ${GREEN}$APP_INSIGHTS_NAME${NC}"
echo -e "Log Analytics Workspace: ${GREEN}$LOG_ANALYTICS_WORKSPACE_NAME${NC}"
echo
echo -e "${BLUE}Connection Information:${NC}"
echo -e "Instrumentation Key: ${GREEN}$APP_INSIGHTS_INSTRUMENTATION_KEY${NC}"
echo
echo -e "${YELLOW}Note:${NC} To change data retention redeploy with updated parameters."
