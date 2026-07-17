# 服务器更新指南

## 快速更新（推荐）

在你的服务器上执行以下命令：

```bash
# 方式1: 下载并执行更新脚本
curl -fsSL https://raw.githubusercontent.com/cxyMe/zmjd/main/update.sh -o /tmp/update.sh && sudo bash /tmp/update.sh

# 方式2: 直接进入目录更新
cd /opt/zmjd && sudo git pull origin main && sudo systemctl restart zmjd

# 方式3: 如果以上都不行，重新克隆
sudo rm -rf /opt/zmjd && sudo git clone https://github.com/cxyMe/zmjd.git /opt/zmjd && sudo systemctl restart zmjd
```

## 首次部署（如果服务器上还没有项目）

```bash
# 安装依赖
sudo apt-get update && sudo apt-get install -y git curl nginx

# 克隆仓库
sudo git clone https://github.com/cxyMe/zmjd.git /opt/zmjd

# 配置 Nginx
sudo tee /etc/nginx/sites-available/zmjd << 'EOF'
server {
    listen 80;
    server_name yiquan.cc.cd;
    root /opt/zmjd;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    gzip on;
}
EOF
sudo ln -sf /etc/nginx/sites-available/zmjd /etc/nginx/sites-enabled/zmjd
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 启动游戏服务
sudo tee /etc/systemd/system/zmjd.service << 'EOF'
[Unit]
Description=ZMJD Game Server
After=network.target
[Service]
Type=simple
ExecStart=/usr/bin/python3 -m http.server 8080 --directory /opt/zmjd
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now zmjd

# 开放防火墙
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable
```

## 配置自动更新

```bash
# 方式1: cron 定时检查（每5分钟）
(sudo crontab -l 2>/dev/null; echo "*/5 * * * * bash /opt/zmjd/update.sh") | sudo crontab -

# 方式2: GitHub Webhook（需要服务器有公网IP）
# 在 GitHub 仓库 Settings -> Webhooks -> Add webhook
# Payload URL: http://154.194.253.140:9000/webhook
# Secret: zmjd-webhook-secret
```

## 检查服务状态

```bash
# 查看游戏服务状态
sudo systemctl status zmjd

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看更新日志
sudo tail -f /var/log/zmjd-update.log

# 查看当前版本
cd /opt/zmjd && git log -1 --oneline
```
