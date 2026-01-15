module.exports = {
  apps: [{
    name: "sgfc-backend",
    script: "./server.js",
    instances: 5,
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "development",
      PORT: 3001
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s"
  }]
};
