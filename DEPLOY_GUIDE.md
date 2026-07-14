# 筑梦激斗 服务器部署指南

## 服务器信息
- **IP**: 154.194.253.140
- **SSH 端口**: 2398
- **用户名**: administrator
- **域名**: yiquan.cc.cd

## 当前状态
服务器当前不可达（100% 丢包），可能是关机状态或防火墙配置问题。请确保服务器开机并允许 SSH (端口 2398) 和 HTTP (端口 80) 入站流量。

## 一键部署（服务器恢复后执行）

### 方法 1: 上传并执行部署脚本

```bash
# 在本地或服务器上执行
scp -P 2398 deploy.sh administrator@154.194.253.140:/tmp/
ssh -p 2398 administrator@154.194.253.140 "sudo bash /tmp/deploy.sh"
```

### 方法 2: 手动逐步部署

```bash
# 1. SSH 连接服务器
ssh -p 2398 administrator@154.194.253.140

# 2. 安装依赖
sudo apt-get update
sudo apt-get install -y git curl nginx nodejs npm python3

# 3. 克隆仓库
sudo git clone https://github.com/cxyMe/zmjd.git /opt/zmjd

# 4. 配置 Nginx
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
    gzip_types text/plain text/css application/json application/javascript;
}
EOF
sudo ln -sf /etc/nginx/sites-available/zmjd /etc/nginx/sites-enabled/zmjd
sudo systemctl restart nginx

# 5. 启动游戏服务
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

# 6. 配置防火墙
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 2398/tcp
sudo ufw --force enable
```

## 访问地址

部署完成后，可通过以下地址访问游戏：

| 方式 | 地址 |
|------|------|
| 域名 | http://yiquan.cc.cd |
| IP + 端口 | http://154.194.253.140:8080 |

## 自动部署配置

### GitHub Webhook（推荐）

1. 进入 GitHub 仓库 Settings -> Webhooks -> Add webhook
2. 配置：
   - **Payload URL**: `http://154.194.253.140:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: `zmjd-webhook-secret`
   - **事件**: 选择 "Just the push event"

### GitHub Actions（备用）

1. 在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中添加：
   - `SERVER_PASSWORD`: gpJ5q9aEEC3L
2. 推送代码时自动触发部署

### Cron 定时检查（备用）

```bash
# 添加 cron 任务，每 5 分钟检查更新
sudo crontab -e
# 添加以下行：
*/5 * * * * /opt/zmjd-deploy/auto-deploy.sh
```

## 常用命令

```bash
# 查看游戏服务状态
sudo systemctl status zmjd

# 查看游戏日志
sudo journalctl -u zmjd -f

# 手动更新代码
sudo bash /opt/zmjd-deploy/auto-deploy.sh

# 重启游戏服务
sudo systemctl restart zmjd

# 重启 Nginx
sudo systemctl restart nginx

# 查看部署日志
sudo tail -f /var/log/zmjd-deploy.log
```

## 故障排查

### 服务器不可达
- 检查服务器是否开机
- 检查安全组/防火墙是否放行 SSH (2398) 和 HTTP (80)
- 检查域名解析: `nslookup yiquan.cc.cd`

### 游戏无法访问
- 检查服务状态: `sudo systemctl status zmjd`
- 检查端口监听: `sudo ss -tlnp | grep 8080`
- 检查 Nginx 配置: `sudo nginx -t`

### 自动部署不生效
- 检查 webhook 服务: `sudo systemctl status zmjd-webhook`
- 检查部署日志: `sudo tail -f /var/log/zmjd-deploy.log`
- 手动测试: `sudo bash /opt/zmjd-deploy/auto-deploy.sh`
