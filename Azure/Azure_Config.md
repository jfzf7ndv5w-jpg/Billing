# Azure Production Deployment Configuration

**Project**: BANKS - Bank Performance Dashboard
**Date**: November 16, 2024
**Environment**: Production
**Cloud Provider**: Microsoft Azure

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Azure VM Configuration](#azure-vm-configuration)
3. [Database Setup](#database-setup)
4. [Backend Application](#backend-application)
5. [Frontend Deployment](#frontend-deployment)
6. [Network & Security](#network--security)
7. [Deployment Steps](#deployment-steps)
8. [Maintenance & Monitoring](#maintenance--monitoring)
9. [Cost Optimization](#cost-optimization)
10. [Disaster Recovery](#disaster-recovery)

---

## Infrastructure Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Virtual Machine (Ubuntu 22.04 LTS)                  │   │
│  │  IP: 4.154.168.160                                   │   │
│  │                                                       │   │
│  │  ┌────────────────┐        ┌────────────────┐       │   │
│  │  │  FastAPI       │        │  PostgreSQL    │       │   │
│  │  │  Backend       │◄──────►│  Database      │       │   │
│  │  │  Port: 8000    │        │  Port: 5432    │       │   │
│  │  └────────────────┘        └────────────────┘       │   │
│  │         ▲                          ▲                 │   │
│  │         │                          │                 │   │
│  │  ┌──────┴──────────────────────────┴──────┐         │   │
│  │  │   Gunicorn + Uvicorn Workers           │         │   │
│  │  │   (2 workers, systemd managed)         │         │   │
│  │  └─────────────────────────────────────────┘        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │ HTTPS (Future: Nginx + SSL)
                        │ HTTP (Current: Direct access)
                        │
                ┌───────┴────────┐
                │   iOS App      │
                │  (Capacitor)   │
                └────────────────┘
```

---

## Azure VM Configuration

### VM Specs

| Component | Specification | Notes |
|-----------|--------------|-------|
| **VM SKU** | Standard B1s or B1ms | Burstable, cost-effective |
| **vCPUs** | 1 core | Adequate for current load |
| **RAM** | 848 MB | Minimal but functional |
| **Storage** | 30 GB Premium SSD | 12% utilized (3.3 GB used) |
| **OS** | Ubuntu 22.04 LTS | Long-term support |
| **Region** | East US (or your choice) | Select based on latency needs |
| **Public IP** | 4.154.168.160 | Static IP recommended |

### VM Creation (Azure CLI)

```bash
# Set variables
RESOURCE_GROUP="banks-production-rg"
VM_NAME="banks-vm"
LOCATION="eastus"
ADMIN_USER="azureuser"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --size Standard_B1ms \
  --admin-username $ADMIN_USER \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --storage-sku Premium_LRS \
  --os-disk-size-gb 30

# Open ports
az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 8000 \
  --priority 1001

# Optional: Open port 80 and 443 for Nginx (future)
az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 80 \
  --priority 1002

az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 443 \
  --priority 1003
```

### VM Creation (Azure Portal)

1. **Basics**:
   - Resource group: Create new "banks-production-rg"
   - VM name: "banks-vm"
   - Region: East US (or preferred)
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1ms (1 vCPU, 2 GiB RAM)
   - Authentication: SSH public key
   - Username: azureuser

2. **Disks**:
   - OS disk type: Premium SSD
   - Size: 30 GB

3. **Networking**:
   - Public IP: Create new (make static)
   - NIC network security group: Basic
   - Inbound ports: SSH (22), HTTP (80), HTTPS (443), Custom (8000)

4. **Management**:
   - Enable auto-shutdown: Optional (cost savings)
   - Backup: Optional (recommended for production)

---

## Database Setup

### PostgreSQL Installation

```bash
# SSH into VM
ssh azureuser@4.154.168.160

# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Verify installation
psql --version
# Output: psql (PostgreSQL) 14.19
```

### PostgreSQL Configuration

#### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create user
CREATE USER banksuser WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- Create database
CREATE DATABASE banksdb OWNER banksuser;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE banksdb TO banksuser;

-- Exit
\q
```

#### 2. Configure PostgreSQL (`/etc/postgresql/14/main/postgresql.conf`)

```ini
# Connection Settings
max_connections = 100
shared_buffers = 128MB
effective_cache_size = 4GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

# Performance
shared_preload_libraries = 'pg_stat_statements'
```

#### 3. Configure Client Authentication (`/etc/postgresql/14/main/pg_hba.conf`)

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

#### 4. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### Database Schema

The database includes these main tables:

**Core Tables**:
- `institutions` - Bank master data (4,376 banks)
- `quarterly_financials` - Historical quarterly data
- `metric_definitions` - Metric configurations
- `metric_values` - Normalized metric storage

**Analytics Tables**:
- `calculated_metrics` - Pre-computed analytics
- `industry_metrics` - Industry-wide statistics
- `bank_insights` - Auto-generated insights

**Star Schema (Phase 3)**:
- `dim_institution` - Institution dimension
- `dim_time` - Time dimension
- `fact_financials` - Partitioned fact table (by year)

**FDIC Sync Tables**:
- `fdic_sync_status` - Data pipeline status
- `fdic_sync_audit_log` - Change tracking
- `fdic_sync_conflicts` - Conflict resolution
- `fdic_source_files` - Source file tracking
- `fdic_field_mappings` - Field mappings
- `fdic_data_quality_checks` - Quality checks
- `fdic_data_quality_results` - Check results
- `fdic_data_versions` - Data versioning

**Partitioning**:
- `fact_financials` is partitioned by year (2020-2026)
- Enables efficient historical queries

---

## Backend Application

### Directory Structure

```
/home/azureuser/backend/
├── app/
│   ├── main.py                  # FastAPI application
│   ├── core/
│   │   ├── config.py           # Configuration
│   │   └── database.py         # Database connection
│   ├── api/
│   │   └── v1/
│   │       ├── institutions.py # Institution endpoints
│   │       ├── historical.py   # Historical analytics
│   │       └── metrics.py      # Metric endpoints
│   ├── models/
│   │   ├── institution.py      # SQLAlchemy models
│   │   ├── analytics.py
│   │   └── metrics.py
│   ├── services/
│   │   ├── fdic_client.py      # FDIC API client
│   │   └── analytics_data_service.py
│   └── etl/
│       ├── tasks.py             # ETL pipeline
│       └── fdic_data_quality.py
├── alembic/                     # Database migrations
│   ├── versions/
│   └── env.py
├── logs/                        # Application logs
│   ├── access.log
│   └── error.log
├── venv/                        # Python virtual environment
├── requirements.txt             # Python dependencies
└── .env.production             # Environment variables
```

### Python Dependencies

**Core Framework** (`requirements.txt`):
```txt
# FastAPI and ASGI server
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
psycopg2-pool==1.1
alembic==1.13.1

# Pydantic for validation
pydantic==2.5.3
pydantic-settings==2.1.0

# Redis and Celery
redis==5.0.1
celery==5.3.6

# Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# HTTP clients
httpx==0.26.0
requests==2.31.0
tenacity==8.2.3

# Data processing
pandas==2.0.3
numpy==1.24.4

# CORS
fastapi-cors==0.0.6

# Async support
aiofiles==23.2.1
asyncpg==0.29.0
aiohttp>=3.9.0

# Performance
psutil>=5.9.0
orjson>=3.9.0

# Monitoring
sentry-sdk[fastapi]>=1.40.0
prometheus-client>=0.19.0
python-json-logger==2.0.7

# Export functionality
openpyxl==3.1.2
reportlab==4.0.7

# WebSocket
websockets==12.0
```

### Environment Configuration

**File**: `/home/azureuser/backend/.env.production`

```bash
# Application
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ENVIRONMENT=production
DEBUG=false

# Database
POSTGRES_USER=banksuser
POSTGRES_PASSWORD=<your-secure-password>
POSTGRES_DB=banksdb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=capacitor://localhost,http://localhost,http://localhost:5173

# FDIC API
FDIC_API_BASE_URL=https://banks.data.fdic.gov/api

# Redis (optional, for future caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring (optional)
SENTRY_DSN=
GRAFANA_ROOT_URL=
```

**Generate SECRET_KEY**:
```bash
openssl rand -hex 32
```

### Systemd Service

**File**: `/etc/systemd/system/banks-backend.service`

```ini
[Unit]
Description=BANKS Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=exec
User=azureuser
WorkingDirectory=/home/azureuser/backend
Environment="PATH=/home/azureuser/backend/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/azureuser/backend/venv/bin/gunicorn \
  -w 2 \
  -k uvicorn.workers.UvicornWorker \
  -b 0.0.0.0:8000 \
  --timeout 300 \
  --worker-tmp-dir /dev/shm \
  --access-logfile /home/azureuser/backend/logs/access.log \
  --error-logfile /home/azureuser/backend/logs/error.log \
  --log-level info \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --preload \
  app.main:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Service Management**:
```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable banks-backend
sudo systemctl start banks-backend

# Check status
sudo systemctl status banks-backend

# View logs
sudo journalctl -u banks-backend -f
```

### Backend Deployment Steps

```bash
# 1. Clone repository
cd /home/azureuser
git clone <your-repo-url> backend
cd backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Create .env.production
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 5. Create logs directory
mkdir -p logs
chmod 755 logs

# 6. Run database migrations
source venv/bin/activate
alembic upgrade head

# 7. Load initial data (FDIC institutions)
python -m app.scripts.fetch_fdic_institutions

# 8. Test locally
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 9. Setup systemd service (see above)
sudo cp banks-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable banks-backend
sudo systemctl start banks-backend

# 10. Verify
curl http://localhost:8000/health
curl http://4.154.168.160:8000/api/v1/institutions?limit=10
```

---

## Frontend Deployment

### Frontend Configuration

**File**: `frontend/.env.production`

```bash
# API Configuration
VITE_API_URL=http://4.154.168.160:8000

# Environment
VITE_ENVIRONMENT=production
```

### Build for Web

```bash
cd frontend
npm install
npm run build

# Deploy dist/ folder to:
# - Azure Static Web Apps, OR
# - Azure Blob Storage + CDN, OR
# - Nginx on same VM
```

### Build for iOS

```bash
cd frontend
npm install
npm run build
npx cap sync ios
npx cap open ios

# Build in Xcode:
# - Select target device/simulator
# - Product > Build
# - Product > Archive (for App Store)
```

### Capacitor Configuration

**File**: `frontend/capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.banks.performance',
  appName: 'Bank Performance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // For development, can use:
    // url: 'http://4.154.168.160:8000',
    // cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
```

---

## Network & Security

### Network Security Group (NSG) Rules

| Priority | Name | Port | Protocol | Source | Destination | Action |
|----------|------|------|----------|--------|-------------|--------|
| 1000 | SSH | 22 | TCP | Your IP | Any | Allow |
| 1001 | Backend API | 8000 | TCP | Any | Any | Allow |
| 1002 | HTTP | 80 | TCP | Any | Any | Allow (future) |
| 1003 | HTTPS | 443 | TCP | Any | Any | Allow (future) |
| 65000 | DenyAllInbound | * | * | Any | Any | Deny |

### SSH Access

```bash
# Add your SSH key to VM
ssh-copy-id azureuser@4.154.168.160

# Secure SSH configuration (/etc/ssh/sshd_config)
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow 22/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### SSL/TLS (Future - with domain name)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Deployment Steps (Complete Setup)

### Initial Setup Checklist

- [ ] **Azure Resources**
  - [ ] Create resource group
  - [ ] Create VM (Standard_B1ms, Ubuntu 22.04)
  - [ ] Assign static public IP
  - [ ] Configure NSG rules
  - [ ] Enable SSH access

- [ ] **VM Configuration**
  - [ ] SSH into VM
  - [ ] Update system: `sudo apt update && sudo apt upgrade -y`
  - [ ] Install PostgreSQL 14
  - [ ] Install Python 3.10+
  - [ ] Install git, build-essential, python3-venv

- [ ] **Database Setup**
  - [ ] Create database user and database
  - [ ] Configure postgresql.conf
  - [ ] Configure pg_hba.conf
  - [ ] Restart PostgreSQL
  - [ ] Test connection

- [ ] **Backend Deployment**
  - [ ] Clone repository to /home/azureuser/backend
  - [ ] Create virtual environment
  - [ ] Install Python dependencies
  - [ ] Create .env.production
  - [ ] Run Alembic migrations
  - [ ] Load initial FDIC data
  - [ ] Create systemd service
  - [ ] Start and enable service
  - [ ] Test API endpoints

- [ ] **Frontend Deployment**
  - [ ] Build frontend: `npm run build`
  - [ ] Sync Capacitor: `npx cap sync ios`
  - [ ] Test in Xcode
  - [ ] Deploy web version (optional)

- [ ] **Testing**
  - [ ] Test backend health: `curl http://VM_IP:8000/health`
  - [ ] Test institution endpoint
  - [ ] Test executive-metrics endpoint
  - [ ] Test iOS app connection
  - [ ] Verify data accuracy

- [ ] **Monitoring**
  - [ ] Check systemd logs
  - [ ] Monitor PostgreSQL logs
  - [ ] Set up Azure monitoring (optional)
  - [ ] Configure alerts (optional)

### Quick Deployment Script

```bash
#!/bin/bash
# deploy.sh - Quick deployment script

set -e

# Variables
VM_IP="4.154.168.160"
DB_PASSWORD="your-secure-password"
SECRET_KEY=$(openssl rand -hex 32)

# 1. Prepare VM
ssh azureuser@$VM_IP << 'EOF'
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y postgresql postgresql-contrib python3 python3-venv python3-pip git build-essential
EOF

# 2. Setup database
ssh azureuser@$VM_IP << EOF
  sudo -u postgres psql -c "CREATE USER banksuser WITH PASSWORD '$DB_PASSWORD';"
  sudo -u postgres psql -c "CREATE DATABASE banksdb OWNER banksuser;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE banksdb TO banksuser;"
EOF

# 3. Deploy backend
ssh azureuser@$VM_IP << 'EOF'
  cd /home/azureuser
  git clone <your-repo-url> backend
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  mkdir -p logs
EOF

# 4. Create .env.production
cat > /tmp/.env.production << EOF
SECRET_KEY=$SECRET_KEY
ENVIRONMENT=production
DEBUG=false
POSTGRES_USER=banksuser
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=banksdb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=capacitor://localhost,http://localhost
FDIC_API_BASE_URL=https://banks.data.fdic.gov/api
EOF

scp /tmp/.env.production azureuser@$VM_IP:/home/azureuser/backend/

# 5. Run migrations
ssh azureuser@$VM_IP << 'EOF'
  cd /home/azureuser/backend
  source venv/bin/activate
  alembic upgrade head
EOF

# 6. Setup systemd
scp banks-backend.service azureuser@$VM_IP:/tmp/
ssh azureuser@$VM_IP << 'EOF'
  sudo mv /tmp/banks-backend.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable banks-backend
  sudo systemctl start banks-backend
EOF

echo "Deployment complete! Backend running at http://$VM_IP:8000"
```

---

## Maintenance & Monitoring

### Regular Maintenance Tasks

**Daily**:
```bash
# Check service status
sudo systemctl status banks-backend

# Check recent errors
sudo journalctl -u banks-backend --since "1 hour ago" | grep ERROR
```

**Weekly**:
```bash
# Update FDIC data
cd /home/azureuser/backend
source venv/bin/activate
python -m app.etl.tasks

# Check database size
sudo -u postgres psql -d banksdb -c "SELECT pg_size_pretty(pg_database_size('banksdb'));"

# Check top queries
sudo -u postgres psql -d banksdb -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

**Monthly**:
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Restart services
sudo systemctl restart banks-backend postgresql

# Backup database (see Disaster Recovery)
```

### Log Rotation

**File**: `/etc/logrotate.d/banks-backend`

```
/home/azureuser/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 azureuser azureuser
    sharedscripts
    postrotate
        systemctl reload banks-backend > /dev/null 2>&1 || true
    endscript
}
```

### Monitoring Endpoints

```bash
# Health check
curl http://4.154.168.160:8000/health

# Metrics (if Prometheus enabled)
curl http://4.154.168.160:8000/metrics

# Database status
curl http://4.154.168.160:8000/api/v1/historical/data-status
```

---

## Cost Optimization

### Current Monthly Cost Estimate

| Resource | SKU | Monthly Cost (USD) |
|----------|-----|-------------------|
| VM (B1ms) | 1 vCPU, 2GB RAM | ~$15-20 |
| Storage | 30GB Premium SSD | ~$5 |
| Network | Data transfer | ~$1-5 |
| **Total** | | **~$21-30/month** |

### Cost-Saving Tips

1. **Use Reserved Instances**: Save up to 72% with 1 or 3-year commitment
2. **Auto-shutdown**: Schedule VM shutdown during non-business hours
3. **Right-size VM**: Start with B1s ($7/month) and scale up if needed
4. **Use Spot Instances**: Save up to 90% for non-production environments
5. **Delete unused resources**: Remove old snapshots, disks

### Scaling Options

**Vertical Scaling (Increase VM size)**:
```bash
# Stop VM
az vm deallocate --resource-group banks-production-rg --name banks-vm

# Resize
az vm resize \
  --resource-group banks-production-rg \
  --name banks-vm \
  --size Standard_B2s

# Start VM
az vm start --resource-group banks-production-rg --name banks-vm
```

**Horizontal Scaling (Multiple VMs + Load Balancer)**:
- Add Azure Load Balancer
- Deploy multiple backend VMs
- Use Azure Database for PostgreSQL (managed service)
- Add Redis for session/cache sharing

---

## Disaster Recovery

### Database Backup

**Manual Backup**:
```bash
# Create backup directory
mkdir -p /home/azureuser/backups

# Backup database
sudo -u postgres pg_dump banksdb | gzip > /home/azureuser/backups/banksdb_$(date +%Y%m%d_%H%M%S).sql.gz

# Transfer to Azure Blob Storage (recommended)
az storage blob upload \
  --account-name <storage-account> \
  --container-name backups \
  --name banksdb_$(date +%Y%m%d).sql.gz \
  --file /home/azureuser/backups/banksdb_*.sql.gz
```

**Automated Backup (cron)**:

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/azureuser/scripts/backup_database.sh
```

**Backup Script** (`/home/azureuser/scripts/backup_database.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/home/azureuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="banksdb_$DATE.sql.gz"

# Create backup
sudo -u postgres pg_dump banksdb | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 days
find $BACKUP_DIR -name "banksdb_*.sql.gz" -mtime +7 -delete

# Optional: Upload to Azure Blob Storage
# az storage blob upload...
```

### Database Restore

```bash
# Stop backend service
sudo systemctl stop banks-backend

# Restore from backup
gunzip < /home/azureuser/backups/banksdb_20241116.sql.gz | sudo -u postgres psql banksdb

# Restart services
sudo systemctl start banks-backend
```

### VM Snapshot

```bash
# Create snapshot
az snapshot create \
  --resource-group banks-production-rg \
  --name banks-vm-snapshot-$(date +%Y%m%d) \
  --source banks-vm

# Restore from snapshot
az disk create \
  --resource-group banks-production-rg \
  --name banks-vm-restored-disk \
  --source banks-vm-snapshot-20241116

az vm create \
  --resource-group banks-production-rg \
  --name banks-vm-restored \
  --attach-os-disk banks-vm-restored-disk \
  --os-type Linux
```

---

## Troubleshooting

### Common Issues

**Backend not responding**:
```bash
# Check service status
sudo systemctl status banks-backend

# Check logs
sudo journalctl -u banks-backend -n 100 --no-pager

# Restart service
sudo systemctl restart banks-backend
```

**Database connection errors**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U banksuser -d banksdb

# Check pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**High memory usage**:
```bash
# Check memory
free -h

# Check top processes
top -o %MEM

# Reduce Gunicorn workers (edit systemd service)
# Change -w 2 to -w 1
```

**Disk space full**:
```bash
# Check disk usage
df -h

# Find large files
du -h /home/azureuser | sort -rh | head -20

# Clean logs
sudo journalctl --vacuum-time=7d
rm /home/azureuser/backend/logs/*.log.*.gz
```

---

## Summary Checklist

✅ **Infrastructure**:
- Azure VM: Standard_B1ms, Ubuntu 22.04
- Public IP: 4.154.168.160 (static)
- NSG: Ports 22, 80, 443, 8000 open
- Storage: 30GB Premium SSD

✅ **Database**:
- PostgreSQL 14
- User: banksuser
- Database: banksdb
- 27 tables (partitioned fact tables)
- 4,376 institutions loaded

✅ **Backend**:
- FastAPI 0.109.0
- Gunicorn + Uvicorn workers
- Systemd service: banks-backend
- Logs: /home/azureuser/backend/logs/
- Port: 8000

✅ **Frontend**:
- React + TypeScript + Vite
- Capacitor for iOS
- API URL: http://4.154.168.160:8000

✅ **Security**:
- SSH key authentication
- UFW firewall enabled
- Environment variables in .env.production
- Future: SSL/TLS with Let's Encrypt

✅ **Monitoring**:
- Systemd logs: `journalctl -u banks-backend`
- PostgreSQL logs: `/var/log/postgresql/`
- Application logs: `/home/azureuser/backend/logs/`

---

**Last Updated**: November 16, 2024
**Version**: 1.0
**Contact**: Generated by Claude Code for BANKS project replication
