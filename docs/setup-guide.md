# セットアップ完全ガイド

## ステップ1: サーバー準備

### ConoHa VPS 推奨設定

| 項目 | 推奨値 |
|------|--------|
| プラン | 1GB RAM / 1Core |
| OS | Ubuntu 22.04 LTS |
| ディスク | 30GB SSD |
| 月額 | ¥550 |

### 初期セットアップ

```bash
# SSH接続後
sudo apt update && sudo apt upgrade -y

# Docker インストール
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose インストール
sudo apt install -y docker-compose-plugin

# Git インストール
sudo apt install -y git
```

## ステップ2: ドメイン・HTTPS設定

### Let's Encrypt（Certbot）

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d n8n.your-domain.com

# 証明書のパスを確認
sudo ls /etc/letsencrypt/live/n8n.your-domain.com/
```

### Nginx リバースプロキシ（オプション）

```nginx
server {
    listen 80;
    server_name n8n.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/n8n.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ステップ3: 本番運用チェックリスト

- [ ] Basic Auth パスワードを変更
- [ ] Dify API キーを再生成
- [ ] Gmail API の OAuth 認証を完了
- [ ] Slack Incoming Webhook を作成
- [ ] Google Forms のレスポンス先を確認
- [ ] バックアップスクリプトのCron設定
- [ ] ログローテーション設定

```bash
# 自動バックアップ（毎日午前3時）
crontab -e
0 3 * * * cd /path/to/project && ./scripts/backup.sh
```

## よくある失敗と対策

| 失敗パターン | 原因 | 対策 |
|-------------|------|------|
| メモリ不足でコンテナ停止 | RAM 1GBでは厳しい | Swap領域 2GB 設定 |
| Dify 起動に時間がかかる | 初回DBマイグレーション | 5-10分待機 |
| Webhook 到達しない | ファイアウォール | ポート5678開放確認 |
