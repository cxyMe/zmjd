#!/bin/bash
# ============================================
# 筑梦激斗 自动部署脚本（由 webhook 触发或 cron 定时执行）
# ============================================
set -e

PROJECT_DIR="/opt/zmjd"
LOG_FILE="/var/log/zmjd-deploy.log"
LOCK_FILE="/tmp/zmjd-deploy.lock"

# 防止并发执行
if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "[$(date)] 部署已在进行中 (PID: $PID)，跳过" >> "$LOG_FILE"
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

echo "[$(date)] ====== 开始自动部署检查 ======" >> "$LOG_FILE"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "[$(date)] 错误: $PROJECT_DIR 不是 git 仓库" >> "$LOG_FILE"
  exit 1
fi

cd "$PROJECT_DIR"

# 获取远程最新状态
git fetch origin main >> "$LOG_FILE" 2>&1

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[$(date)] 本地已是最新 (commit: ${LOCAL:0:8})，无需更新" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date)] 检测到更新: ${LOCAL:0:8} -> ${REMOTE:0:8}" >> "$LOG_FILE"

# 拉取最新代码
if git pull origin main >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] 代码拉取成功" >> "$LOG_FILE"
else
  echo "[$(date)] 错误: 代码拉取失败" >> "$LOG_FILE"
  exit 1
fi

# 重启游戏服务
if systemctl restart zmjd >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] 游戏服务已重启" >> "$LOG_FILE"
else
  echo "[$(date)] 错误: 游戏服务重启失败" >> "$LOG_FILE"
  exit 1
fi

# 可选：重启 Nginx（如果静态文件有更新）
if systemctl reload nginx >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] Nginx 已重载" >> "$LOG_FILE"
fi

echo "[$(date)] ====== 自动部署完成 ======" >> "$LOG_FILE"
