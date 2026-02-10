#!/bin/bash

# デプロイスクリプト
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENV=${1:-production}
echo "🚀 Starting deployment for $ENV environment..."

# 環境チェック
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Docker イメージ更新
echo "📦 Pulling latest images..."
docker-compose pull

# バックアップ
echo "💾 Creating backup..."
mkdir -p backups/$(date +%Y%m%d)
cp -r ~/.n8n backups/$(date +%Y%m%d)/ 2>/dev/null || true

# 再起動
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

# ヘルスチェック
echo "🏥 Health check..."
sleep 10

N8N_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/health || echo "000")
if [ "$N8N_STATUS" = "200" ]; then
    echo "✅ n8n is healthy!"
else
    echo "⚠️ n8n health check failed (status: $N8N_STATUS)"
fi

echo "🎉 Deployment completed!"
echo ""
echo "Access URLs:"
echo "  n8n:      http://localhost:5678"
echo "  Dify API: http://localhost:5001"
