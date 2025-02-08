# Deployment Guide for pb-cline Project

This README provides a step-by-step guide for deploying the pb-cline project to a Hostinger VPS (IP: 46.202.177.230) using PM2 along with your custom domain `32cbgg8.com`.

## Prerequisites
- Hostinger VPS with SSH access.
- Node.js installed on VPS.
- Git (if cloning from a repository).
- PM2 (for process management).
- Optional: Nginx for reverse proxy & SSL setup.

## 1. VPS Access and Preparation
1. SSH into your VPS:
   ```bash
   ssh <username>@46.202.177.230
   ```
2. Update packages and install essential tools:
   ```bash
   sudo apt-get update
   sudo apt-get install git curl
   ```

## 2. Node.js Installation
Install Node.js (via system packages or nvm):
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 3. Transferring Your Project
- **Git Clone:**  
  If your project is hosted on a Git repository:
  ```bash
  git clone <your-repository-url>
  cd pb-cline
  ```
- **SFTP/FTP Upload:**  
  Alternatively, upload your project files directly to the VPS.

## 4. Install Dependencies
Navigate to the project directory and run:
```bash
cd pb-cline
npm install
```
Ensure your `.env` file is properly configured for production.

## 5. Deploy with PM2
- **Install PM2 if not already installed:**  
  If the `pm2` command is not found, install it globally using:
  ```bash
  npm install -g pm2
  ```
- Start your application using PM2:
  - Normally, run:
    ```bash
    pm2 start ecosystem.config.js
    ```
  - If you encounter an ERR_REQUIRE_ESM error, rename your configuration file:
    ```bash
    mv ecosystem.config.js ecosystem.config.cjs
    pm2 start ecosystem.config.cjs
    ```
- Verify the process:
  ```bash
  pm2 list
  ```

## 6. Configure PM2 to Auto-Restart on Reboot
```bash
pm2 startup
```
Follow the provided instructions and then save the process list:
```bash
pm2 save
```

## 7. DNS and Domain Setup
- Configure your DNS provider to create/update an A record for `32cbgg8.com` pointing to `46.202.177.230`.
- Wait for DNS propagation and verify by accessing `http://32cbgg8.com`.

## 8. (Optional) Reverse Proxy using Nginx
1. Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```
2. Create an Nginx configuration file (e.g., `/etc/nginx/sites-available/32cbgg8.com`) with the following content:
   ```nginx
   server {
       listen 80;
       server_name 32cbgg8.com www.32cbgg8.com;

       location / {
           proxy_pass http://localhost:3001; # Main application server port
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Enable the configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/32cbgg8.com /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
4. For SSL, consider using Certbot to obtain a free Let's Encrypt certificate.

## 9. Firewall Considerations
Install and configure UFW (Uncomplicated Firewall) to secure your VPS:
1. (Optional) Install UFW if not already installed:
   ```bash
   sudo apt-get install ufw
   ```
2. Allow incoming traffic for SSH (port 22):
   ```bash
   sudo ufw allow 22
   ```
3. Allow HTTP traffic (port 80):
   ```bash
   sudo ufw allow 80
   ```
4. Allow HTTPS traffic (port 443):
   ```bash
   sudo ufw allow 443
   ```
5. Enable the firewall:
   ```bash
   sudo ufw enable
   ```
6. Verify the firewall status:
   ```bash
   sudo ufw status
   ```

## 10. Verification and Monitoring
- Open your browser and check `http://32cbgg8.com` (or HTTPS if configured).
- Monitor logs using:
  ```bash
  pm2 logs
  ```

## Conclusion
Following these steps will deploy the pb-cline project securely using PM2 on your Hostinger VPS with your domain `32cbgg8.com`. Adjust any settings as needed for your specific environment.
