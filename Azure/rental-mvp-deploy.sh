#!/bin/bash
# Rental Property MVP - Azure Deployment Script
# Node.js + Express + Prisma + Azure SQL

set -e

# Configuration
RESOURCE_GROUP="rental-mvp-rg"
LOCATION="northeurope"
APP_NAME="rental-mvp-api"
SQL_SERVER="rental-mvp-sql"
SQL_DB="rental-mvp-db"
STORAGE_ACCOUNT="rentalmvpstorage"
ADMIN_USER="sqladmin"
SQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)"Aa1!"

echo "========================================="
echo "Rental Property MVP - Azure Deployment"
echo "========================================="
echo ""

# 1. Create Resource Group
echo "📦 Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags project=rental-mvp environment=production

# 2. Create Azure SQL Server
echo "🗄️  Creating Azure SQL Server..."
az sql server create \
  --name $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password "$SQL_PASSWORD"

# 3. Configure SQL Server Firewall (Allow Azure services)
echo "🔥 Configuring SQL Server firewall..."
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your current IP
CURRENT_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name AllowMyIP \
  --start-ip-address $CURRENT_IP \
  --end-ip-address $CURRENT_IP

# 4. Create Azure SQL Database
echo "💾 Creating Azure SQL Database..."
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name $SQL_DB \
  --service-objective Basic \
  --backup-storage-redundancy Local

# 5. Create Azure Storage Account (for PDF invoices)
echo "📁 Creating Azure Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container for invoices
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query '[0].value' -o tsv)

az storage container create \
  --name invoices \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

# 6. Create App Service Plan
echo "🏗️  Creating App Service Plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

# 7. Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "NODE:18-lts"

# 8. Configure App Settings
echo "⚙️  Configuring App Settings..."

# Build DATABASE_URL
DATABASE_URL="sqlserver://$SQL_SERVER.database.windows.net:1433;database=$SQL_DB;user=$ADMIN_USER;password=$SQL_PASSWORD;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30"

# Generate JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

# Get Storage Connection String
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV=production \
    PORT=8080 \
    CORS_ORIGIN="*" \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
    AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT" \
    AZURE_STORAGE_CONTAINER_NAME="invoices"

# 9. Configure deployment from GitHub
echo "📡 Configuring GitHub deployment..."
echo ""
echo "To enable GitHub Actions deployment:"
echo "1. Go to Azure Portal > App Service > Deployment Center"
echo "2. Select 'GitHub' as source"
echo "3. Authorize GitHub and select repository: jfzf7ndv5w-jpg/Billing"
echo "4. Select branch: main"
echo "5. Azure will auto-generate .github/workflows/azure-webapps-node.yml"
echo ""

# 10. Get deployment credentials
echo "🔑 Getting deployment credentials..."
PUBLISH_PROFILE=$(az webapp deployment list-publishing-profiles \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --xml)

# Save to file
echo "$PUBLISH_PROFILE" > /tmp/publish-profile.xml

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "📋 Configuration Details:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Service: $APP_NAME"
echo "  URL: https://${APP_NAME}.azurewebsites.net"
echo ""
echo "🗄️  Database:"
echo "  SQL Server: ${SQL_SERVER}.database.windows.net"
echo "  Database: $SQL_DB"
echo "  Username: $ADMIN_USER"
echo "  Password: $SQL_PASSWORD"
echo ""
echo "📁 Storage:"
echo "  Account: $STORAGE_ACCOUNT"
echo "  Container: invoices"
echo ""
echo "🔐 Secrets (save these securely!):"
echo "  JWT_SECRET: $JWT_SECRET"
echo "  SQL_PASSWORD: $SQL_PASSWORD"
echo ""
echo "📝 Next Steps:"
echo "  1. Run Prisma migrations:"
echo "     npx prisma migrate deploy"
echo "  2. Seed database:"
echo "     npx prisma db seed"
echo "  3. Configure GitHub Actions (see instructions above)"
echo "  4. Push code to trigger deployment"
echo ""
echo "🔗 Useful Commands:"
echo "  # View logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # SSH into container:"
echo "  az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # Restart app:"
echo "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "📄 Publish profile saved to: /tmp/publish-profile.xml"
echo "========================================="
