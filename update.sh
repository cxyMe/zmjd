#!/bin/bash
# ============================================
# 筑梦激斗 快速更新脚本
# 用法: bash update.sh
# ============================================
set -e

PROJECT_DIR="/opt/zmjd"
LOG_FILE="/var/log/zmjd-update.log"

echo "[$(date)] 开始更新筑梦激斗..." | tee -a "$LOG_FILE"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "错误: $PROJECT_DIR 不是 git 仓库" | tee -a "$LOG_FILE"
  echo "请先运行 deploy.sh 完成首次部署" | tee -a "$LOG_FILE"
  exit 1
fi

cd "$PROJECT_DIR"

# 获取远程最新代码
echo "拉取最新代码..." | tee -a "$LOG_FILE"
git fetch origin main >> "$LOG_FILE" 2>&1

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "已是最新版本 (commit: ${LOCAL:0:8})" | tee -a "$LOG_FILE"
else
  echo "发现更新: ${LOCAL:0:8} -> ${REMOTE:0:8}" | tee -a "$LOG_FILE"
  git pull origin main >> "$LOG_FILE" 2>&1
  echo "代码更新完成" | tee -a "$LOG_FILE"

  # 重启游戏服务
  echo "重启游戏服务..." | tee -a "$LOG_FILE"
  if command -v systemctl &> /dev/null; then
    systemctl restart zmjd >> "$LOG_FILE" 2>&1 || true
  else
    # 如果没有 systemd，手动重启 Python HTTP 服务器
    pkill -f "http.server 8080" || true
    sleep 1
    nohup python3 -m http.server 8080 --directory "$PROJECT_DIR" > /dev/null 2>&1 &
  fi
  echo "服务已重启" | tee -a "$LOG_FILE"
fi

echo "[$(date)] 更新完成" | tee -a "$LOG_FILE"
echo ""
echo "查看日志: tail -f $LOG_FILE"
