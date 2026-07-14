#!/bin/bash
# ============================================
# 筑梦激斗 一键部署脚本
# 服务器: 154.194.253.140:2398
# 域名: yiquan.cc.cd
# ============================================
set -e

PROJECT_DIR="/opt/zmjd"
REPO_URL="https://github.com/cxyMe/zmjd.git"
DOMAIN="yiquan.cc.cd"
GAME_PORT=8080
NGINX_PORT=80

echo "=========================================="
echo "筑梦激斗 服务器部署脚本"
echo "=========================================="

# 1. 更新系统并安装依赖
echo "[1/8] 安装系统依赖..."
apt-get update -y
apt-get install -y git curl wget nginx ufw nodejs npm python3 certbot python3-certbot-nginx

# 安装 Node.js 20 (如果系统自带版本太低)
if ! node -v | grep -q "v20\|v22"; then
  echo "[1.5/8] 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 2. 克隆仓库
echo "[2/8] 克隆 GitHub 仓库..."
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# 3. 安装项目依赖
echo "[3/8] 安装项目依赖..."
npm install -g http-server

# 4. 配置防火墙
echo "[4/8] 配置防火墙..."
ufw allow $NGINX_PORT/tcp
ufw allow $GAME_PORT/tcp
ufw allow 22/tcp
ufw allow 2398/tcp
ufw --force enable

# 5. 配置 Nginx
echo "[5/8] 配置 Nginx..."
cat > /etc/nginx/sites-available/zmjd << 'EOF'
server {
    listen 80;
    server_name yiquan.cc.cd;

    location / {
        root /opt/zmjd;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
EOF

ln -sf /etc/nginx/sites-available/zmjd /etc/nginx/sites-enabled/zmjd
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# 6. 配置 SSL (可选，需要域名解析生效)
echo "[6/8] 配置 SSL 证书..."
if host "$DOMAIN" >/dev/null 2>&1; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN || true
else
  echo "  警告: 域名解析未生效，跳过 SSL 配置。后续可手动执行: certbot --nginx -d $DOMAIN"
fi

# 7. 创建 systemd 服务
echo "[7/8] 创建游戏服务..."
cat > /etc/systemd/system/zmjd.service << EOF
[Unit]
Description=筑梦激斗游戏服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/python3 -m http.server $GAME_PORT --directory $PROJECT_DIR
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable zmjd
systemctl restart zmjd

# 8. 配置自动部署 webhook
echo "[8/8] 配置自动部署..."
mkdir -p /opt/zmjd-deploy

cat > /opt/zmjd-deploy/auto-deploy.sh << 'EOF'
#!/bin/bash
set -e
LOG_FILE="/var/log/zmjd-deploy.log"
PROJECT_DIR="/opt/zmjd"

echo "[$(date)] 收到部署请求" >> "$LOG_FILE"
cd "$PROJECT_DIR"

# 拉取最新代码
git fetch origin main >> "$LOG_FILE" 2>&1
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "[$(date)] 检测到更新，开始部署..." >> "$LOG_FILE"
  git pull origin main >> "$LOG_FILE" 2>&1
  systemctl restart zmjd >> "$LOG_FILE" 2>&1
  echo "[$(date)] 部署完成" >> "$LOG_FILE"
else
  echo "[$(date)] 无需更新" >> "$LOG_FILE"
fi
EOF

chmod +x /opt/zmjd-deploy/auto-deploy.sh

# 创建 webhook 接收服务
cat > /opt/zmjd-deploy/webhook-server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import subprocess
import hmac
import hashlib
import os

PORT = 9000
SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', 'zmjd-webhook-secret')

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.read(content_length)

        signature = self.headers.get('X-Hub-Signature-256', '')
        expected = 'sha256=' + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(signature, expected):
            self.send_response(403)
            self.end_headers()
            return

        event = self.headers.get('X-GitHub-Event', '')
        if event == 'push':
            subprocess.Popen(['/opt/zmjd-deploy/auto-deploy.sh'])

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(("0.0.0.0", PORT), WebhookHandler) as httpd:
    print(f"Webhook server listening on port {PORT}")
    httpd.serve_forever()
EOF

cat > /etc/systemd/system/zmjd-webhook.service << EOF
[Unit]
Description=筑梦激斗自动部署 Webhook
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/zmjd-deploy
ExecStart=/usr/bin/python3 /opt/zmjd-deploy/webhook-server.py
Restart=always
RestartSec=5
Environment="GITHUB_WEBHOOK_SECRET=zmjd-webhook-secret"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable zmjd-webhook
systemctl start zmjd-webhook

# 开放 webhook 端口
ufw allow 9000/tcp

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "游戏访问地址:"
echo "  HTTP:  http://$DOMAIN"
echo "  IP:    http://154.194.253.140:$GAME_PORT"
echo ""
echo "服务状态检查:"
echo "  systemctl status zmjd"
echo "  systemctl status nginx"
echo "  systemctl status zmjd-webhook"
echo ""
echo "查看日志:"
echo "  journalctl -u zmjd -f"
echo "  tail -f /var/log/zmjd-deploy.log"
echo ""
echo "手动更新:"
echo "  cd $PROJECT_DIR && git pull && systemctl restart zmjd"
echo ""
echo "GitHub Webhook 配置:"
echo "  Payload URL: http://154.194.253.140:9000/webhook"
echo "  Content type: application/json"
echo "  Secret: zmjd-webhook-secret"
echo "=========================================="
