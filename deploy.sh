#!/bin/bash

# Script deploy tự động cho Jira Insight
# Đường dẫn: /var/www/work/tool-atlassian

PROJECT_ROOT="/var/www/work/tool-atlassian"

echo "🚀 Bắt đầu quá trình Deploy..."

cd $PROJECT_ROOT

# 1. Pull code mới nhất
echo "📥 Đang tải code mới từ Git..."
git pull origin master --no-rebase

# 2. Cài đặt và Build Frontend
echo "⚛️ Đang Build Frontend..."
cd $PROJECT_ROOT/frontend
npm install
npm run build

# 3. Cài đặt và Restart Backend (PM2)
echo "🟢 Đang Restart Backend API..."
cd $PROJECT_ROOT/api
npm install
cd $PROJECT_ROOT
pm2 startOrRestart ecosystem.config.js --env production

echo "✅ Deploy thành công! Truy cập: https://jira.devgia.net"
