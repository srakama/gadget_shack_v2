# 🚀 GadgetShack Production Deployment Guide

## 📋 **Prerequisites**

### **System Requirements**
- **Server**: Ubuntu 20.04+ or CentOS 8+ (minimum 4GB RAM, 2 CPU cores)
- **Domain**: Registered domain name (e.g., gadgetshack.co.za)
- **SSL**: Let's Encrypt or commercial SSL certificate
- **Docker**: Docker 20.10+ and Docker Compose 2.0+

### **Third-Party Services**
- **Email**: SendGrid, Mailgun, or SMTP server
- **Payments**: Stripe and/or PayFast accounts
- **Monitoring**: Optional - Grafana Cloud, DataDog, or New Relic
- **Storage**: Optional - AWS S3 for file storage and backups

## 🛠️ **Quick Deployment (5 Steps)**

### **Step 1: Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply docker group
```

### **Step 2: Clone and Configure**
```bash
# Clone repository
git clone https://github.com/your-username/gadgetshack.git
cd gadgetshack

# Copy environment configuration
cp .env.production.example .env.production

# Edit configuration with your values
nano .env.production
```

### **Step 3: Configure Environment**
Edit `.env.production` with your actual values:

```bash
# CRITICAL: Change these values
POSTGRES_PASSWORD=your-super-secure-postgres-password
REDIS_PASSWORD=your-super-secure-redis-password
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-super-secure-session-secret

# Domain configuration
FRONTEND_URL=https://gadgetshack.co.za
BACKEND_URL=https://api.gadgetshack.co.za

# Email configuration (SendGrid recommended)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@gadgetshack.co.za

# Payment configuration
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
PAYFAST_MERCHANT_ID=your-payfast-merchant-id
PAYFAST_MERCHANT_KEY=your-payfast-merchant-key
```

### **Step 4: Deploy**
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### **Step 5: Verify Deployment**
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Check health
curl https://gadgetshack.co.za/health
curl https://api.gadgetshack.co.za/health

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔧 **Detailed Configuration**

### **Environment Variables**

#### **Database Configuration**
```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=gadgetshack
POSTGRES_USER=gadgetshack_user
POSTGRES_PASSWORD=your-secure-password
DATABASE_URL=postgresql://gadgetshack_user:password@postgres:5432/gadgetshack
```

#### **Redis Cache**
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:password@redis:6379
```

#### **Security Settings**
```bash
JWT_SECRET=your-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://gadgetshack.co.za,https://www.gadgetshack.co.za
```

#### **Email Configuration**
```bash
# SendGrid (Recommended)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@gadgetshack.co.za

# Alternative: SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### **Payment Gateways**
```bash
# Stripe (International)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# PayFast (South Africa)
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
PAYFAST_RETURN_URL=https://gadgetshack.co.za/payment/success
PAYFAST_CANCEL_URL=https://gadgetshack.co.za/payment/cancel
PAYFAST_NOTIFY_URL=https://api.gadgetshack.co.za/api/payments/payfast/notify
```

#### **Shipping Providers**
```bash
BUSINESS_ADDRESS=123 Business Street, Johannesburg, Gauteng, South Africa

# PostNet
POSTNET_API_KEY=your-postnet-api-key

# Aramex
ARAMEX_USERNAME=your-aramex-username
ARAMEX_PASSWORD=your-aramex-password
ARAMEX_ACCOUNT_NUMBER=your-account-number
```

### **SSL Certificate Setup**

#### **Let's Encrypt (Free)**
```bash
# The deployment script automatically sets up Let's Encrypt
# Just ensure your domain points to your server IP

# Manual setup if needed:
sudo apt install certbot
sudo certbot certonly --standalone -d gadgetshack.co.za -d www.gadgetshack.co.za
```

#### **Commercial SSL**
```bash
# Place your SSL files in the ssl directory:
ssl/fullchain.pem    # Certificate chain
ssl/privkey.pem      # Private key
```

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```bash
# Application health
curl https://gadgetshack.co.za/health
curl https://api.gadgetshack.co.za/health

# Database health
curl https://api.gadgetshack.co.za/ready

# Performance metrics
curl https://api.gadgetshack.co.za/metrics
```

### **Monitoring Dashboard**
- **Grafana**: http://your-server:3001 (admin/your-grafana-password)
- **Prometheus**: http://your-server:9090
- **Application Logs**: `docker-compose logs -f`

### **Backup Management**
```bash
# Manual backup
./scripts/backup.sh

# Automated backups (runs daily at 2 AM)
# Configured in docker-compose.production.yml

# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore backup_name
```

## 🔄 **Updates & Maintenance**

### **Application Updates**
```bash
# Pull latest code
git pull origin main

# Update deployment
./scripts/deploy.sh update

# Check status
./scripts/deploy.sh health
```

### **Database Maintenance**
```bash
# Database backup
docker-compose exec postgres pg_dump -U gadgetshack_user gadgetshack > backup.sql

# Database restore
docker-compose exec -T postgres psql -U gadgetshack_user gadgetshack < backup.sql

# Database migration (if needed)
cd database && node migrate-to-postgresql.js
```

### **Log Management**
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Log rotation (automatic)
# Configured in docker-compose.production.yml
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Services Won't Start**
```bash
# Check Docker status
sudo systemctl status docker

# Check disk space
df -h

# Check memory usage
free -h

# Restart services
docker-compose restart
```

#### **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Test SSL configuration
curl -I https://gadgetshack.co.za
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U gadgetshack_user -d gadgetshack -c "SELECT 1;"

# Reset database password
docker-compose exec postgres psql -U postgres -c "ALTER USER gadgetshack_user PASSWORD 'new-password';"
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# Check application metrics
curl https://api.gadgetshack.co.za/metrics

# Restart services
docker-compose restart backend frontend
```

## 📞 **Support & Maintenance**

### **Daily Checks**
- [ ] Application health endpoints
- [ ] SSL certificate validity
- [ ] Backup completion
- [ ] Error logs review
- [ ] Performance metrics

### **Weekly Maintenance**
- [ ] Security updates
- [ ] Log cleanup
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Monitoring review

### **Monthly Tasks**
- [ ] Full system backup
- [ ] Security audit
- [ ] Performance analysis
- [ ] Capacity planning
- [ ] Update dependencies

## 🎯 **Production Checklist**

### **Pre-Launch**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Payment gateways tested
- [ ] Email delivery tested
- [ ] Backup system verified
- [ ] Monitoring configured
- [ ] Performance tested
- [ ] Security audit completed

### **Post-Launch**
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Backup schedule verified
- [ ] Performance baseline established
- [ ] Error tracking active
- [ ] Support procedures documented

---

## 🎉 **Congratulations!**

Your GadgetShack e-commerce platform is now live and ready for customers!

**Access Points:**
- 🌐 **Website**: https://gadgetshack.co.za
- 📊 **Admin Dashboard**: https://gadgetshack.co.za/admin
- 📈 **Monitoring**: http://your-server:3001
- 🔍 **Metrics**: http://your-server:9090

**Support:**
- 📧 **Email**: admin@gadgetshack.co.za
- 📱 **Phone**: +27 11 123 4567
- 💬 **Support**: https://gadgetshack.co.za/support
