// Add a resource lock to prevent accidental deletion
resource logAnalyticsLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'logAnalyticsDeleteLock'
  scope: logAnalyticsWorkspace
  properties: {
    level: 'CanNotDelete'
    notes: 'Production - in use by the PostgreSQL extension for VS Code'
  }
}

resource appInsightsLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'appInsightsDeleteLock'
  scope: appInsights
  properties: {
    level: 'CanNotDelete'
    notes: 'Production - in use by the PostgreSQL extension for VS Code'
  }
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Parameters


@description('The Azure subscription ID for deployment context')
param deploymentSubscriptionId string

@description('The resource group name for deployment context')
param deploymentResourceGroup string

@description('The base name for all resources')
param baseName string

@description('The Azure region to deploy to')
param location string = resourceGroup().location

param environment string

@description('The retention period in days for Application Insights data')
@allowed([
  30
  60
  90
  120
  180
  270
  365
  550
  730
])
param retentionInDays int

@description('The daily cap for ingestion in GB. Value of 0 means unlimited')
param dailyQuotaInGB int

@description('Tags for the resources')
param tags object = {
  Environment: environment
  Application: 'PostgreSQL extension for VS Code'
}

// Variables
var appInsightsName = 'appi-${baseName}-${environment}'
var logAnalyticsWorkspaceName = 'laws-${baseName}-${environment}'
var resourceToken = uniqueString(subscription().subscriptionId, baseName, environment)

// Resources
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    // Only include workspaceCapping if dailyQuotaInGB > 0
    ...(dailyQuotaInGB > 0 ? {
      workspaceCapping: {
        dailyQuotaGb: dailyQuotaInGB
      }
    } : {})
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    RetentionInDays: retentionInDays
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    DisableIpMasking: false // Keep IP masking enabled for privacy
    SamplingPercentage: 100 // No sampling by default
  }
}

// Outputs
output appInsightsId string = appInsights.id
output appInsightsName string = appInsights.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output resourceToken string = resourceToken
