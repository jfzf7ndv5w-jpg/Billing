#!/bin/bash
# Rental Property MVP - Simplified Azure Deployment
# Using App Service + PostgreSQL (Flexible Server)

set -e

# Configuration
RESOURCE_GROUP="rental-mvp-rg"
LOCATION="northeurope"
APP_NAME="rental-mvp-api$(date +%s | tail -c 5)"  # Add random suffix
STORAGE_ACCOUNT="rentalmvp$(date +%s | tail -c 7)"
PG_SERVER="rental-mvp-pg-$(date +%s | tail -c 7)"
PG_ADMIN="pgadmin"
PG_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)"Aa1!"
JWT_SECRET=$(openssl rand -hex 32)

echo "========================================="
echo "Rental Property MVP - Azure Deployment"
echo "========================================="
echo ""

# 1. Check if resource group exists, if not create it
echo "📦 Ensuring Resource Group exists..."
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
  az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --tags project=rental-mvp environment=production
  echo "✅ Resource Group created"
else
  echo "✅ Resource Group already exists"
fi

# 2. Create Azure Storage Account (for PDF invoices)
echo "📁 Creating Azure Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false

# Get storage key and connection string
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query '[0].value' -o tsv)

STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

# Create blob container for invoices
az storage container create \
  --name invoices \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

echo "✅ Storage Account created: $STORAGE_ACCOUNT"

# 3. Create PostgreSQL Flexible Server
echo "🗄️  Creating PostgreSQL Flexible Server..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --location $LOCATION \
  --admin-user $PG_ADMIN \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0 \
  --yes

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER \
  --database-name rental_mvp

# Configure firewall to allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo "✅ PostgreSQL created: ${PG_SERVER}.postgres.database.azure.com"

# 4. Create App Service Plan
echo "🏗️  Creating App Service Plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

echo "✅ App Service Plan created"

# 5. Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "NODE:18-lts"

echo "✅ Web App created: https://${APP_NAME}.azurewebsites.net"

# 6. Configure App Settings
echo "⚙️  Configuring App Settings..."

# Build DATABASE_URL for PostgreSQL
DATABASE_URL="postgresql://${PG_ADMIN}:${PG_PASSWORD}@${PG_SERVER}.postgres.database.azure.com:5432/rental_mvp?schema=public&sslmode=require"

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
    AZURE_STORAGE_CONTAINER_NAME="invoices" \
    WEBSITE_NODE_DEFAULT_VERSION="18-lts"

echo "✅ App Settings configured"

# 7. Configure startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "npm run start"

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
echo "  PostgreSQL Server: ${PG_SERVER}.postgres.database.azure.com"
echo "  Database: rental_mvp"
echo "  Username: $PG_ADMIN"
echo "  Password: $PG_PASSWORD"
echo ""
echo "📁 Storage:"
echo "  Account: $STORAGE_ACCOUNT"
echo "  Container: invoices"
echo ""
echo "🔐 Secrets (SAVE THESE SECURELY!):"
echo "  JWT_SECRET: $JWT_SECRET"
echo "  PG_PASSWORD: $PG_PASSWORD"
echo "  DATABASE_URL: $DATABASE_URL"
echo ""
echo "📝 Next Steps:"
echo ""
echo "  1. Update Prisma schema to use PostgreSQL:"
echo "     Edit backend/prisma/schema.prisma"
echo "     provider = \"postgresql\""
echo ""
echo "  2. Get deployment credentials:"
echo "     az webapp deployment list-publishing-profiles \\"
echo "       --name $APP_NAME \\"
echo "       --resource-group $RESOURCE_GROUP \\"
echo "       --xml > publish-profile.xml"
echo ""
echo "  3. Add to GitHub Secrets:"
echo "     AZURE_WEBAPP_PUBLISH_PROFILE = (contents of publish-profile.xml)"
echo ""
echo "  4. Commit and push deployment files:"
echo "     git add ."
echo "     git commit -m 'feat: Azure deployment configuration'"
echo "     git push origin main"
echo ""
echo "  5. Manually deploy first time or wait for GitHub Actions:"
echo "     cd backend"
echo "     npm install"
echo "     npm run build"
echo "     az webapp up --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  6. Run database migrations on Azure:"
echo "     az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "     cd /home/site/wwwroot"
echo "     npm run azure:migrate"
echo "     npm run azure:seed"
echo ""
echo "🔗 Useful Commands:"
echo ""
echo "  # View logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # SSH into container:"
echo "  az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # Restart app:"
echo "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # Get publish profile for GitHub:"
echo "  az webapp deployment list-publishing-profiles \\"
echo "    --name $APP_NAME --resource-group $RESOURCE_GROUP --xml"
echo ""
echo "========================================="

# Save credentials to file
cat > /tmp/azure-credentials.txt <<EOF
===========================================
AZURE DEPLOYMENT CREDENTIALS
===========================================

App Service URL: https://${APP_NAME}.azurewebsites.net
App Service Name: $APP_NAME
Resource Group: $RESOURCE_GROUP

PostgreSQL Connection:
  Host: ${PG_SERVER}.postgres.database.azure.com
  Port: 5432
  Database: rental_mvp
  Username: $PG_ADMIN
  Password: $PG_PASSWORD

DATABASE_URL:
$DATABASE_URL

JWT_SECRET:
$JWT_SECRET

Storage Account: $STORAGE_ACCOUNT
Storage Container: invoices
Storage Connection String:
$STORAGE_CONNECTION

===========================================
SAVE THIS FILE SECURELY!
===========================================
EOF

echo "📄 Credentials saved to: /tmp/azure-credentials.txt"
echo ""
