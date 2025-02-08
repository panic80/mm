module.exports = {
  apps: [
    {
      name: 'main-server',
      script: 'server/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'proxy-server',
      script: 'server/proxy.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ],

  // Deployment Configuration
  deploy: {
    production: {
      user: 'YOUR_SSH_USER',
      host: 'YOUR_HOSTINGER_VPS_IP',
      ref: 'origin/main',
      repo: 'https://github.com/panic80/pb-cline.git',
      path: '/var/www/chatbot',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
