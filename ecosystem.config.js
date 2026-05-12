module.exports = {
  apps: [
    {
      name: 'jira-insight-api',
      script: './api/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5006,
        NODE_OPTIONS: '--openssl-legacy-provider'
      }
    }
  ]
};
