# Learn Smart - Hệ thống học tập thông minh

Ứng dụng web hỗ trợ quản lý học sinh, thi cử, và trò chơi giáo dục.

**Stack:** React + Vite (frontend) · Express.js (backend) · MongoDB · Nginx · AWS EC2

---

## Cấu trúc dự án

```
nckh_tuyenquang/
├── src/              # React frontend
├── server/           # Express.js backend
│   ├── server.js
│   ├── .env          # Biến môi trường (không commit)
│   ├── config/
│   ├── models/
│   ├── routes/
│   └── uploads/
├── dist/             # React build output (tự sinh)
└── package.json
```

---

## Biến môi trường

### Frontend — `.env` (thư mục gốc)

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend — `server/.env`

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://localhost:27017/nckh_tuyenquang
JWT_SECRET=your_very_secret_key_min_32_chars
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Triển khai lần đầu lên AWS EC2 (Ubuntu)

### 1. Chuẩn bị máy chủ

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Cài PM2 và Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Tạo thư mục
sudo mkdir -p /var/www/nckh_tuyenquang
sudo chown -R ubuntu:ubuntu /var/www/nckh_tuyenquang
```

### 2. Cấu hình AWS Security Group (Inbound rules)

| Type  | Port | Source    |
|-------|------|-----------|
| SSH   | 22   | My IP     |
| HTTP  | 80   | 0.0.0.0/0 |
| HTTPS | 443  | 0.0.0.0/0 |

### 3. Build và upload từ máy Mac

```bash
# Tại thư mục dự án trên Mac
npm run build

rsync -avz --progress \
  -e "ssh -i ~/.ssh/your-key.pem" \
  --exclude='node_modules' \
  --exclude='src' \
  --exclude='.git' \
  --exclude='.env' \
  dist server server.js package.json \
  ubuntu@EC2-IP:/var/www/nckh_tuyenquang/
```

### 4. Tạo file .env trên EC2

```bash
nano /var/www/nckh_tuyenquang/server/.env
# Điền đầy đủ các biến môi trường như mục "Backend" ở trên
```

### 5. Cài dependencies và khởi động

```bash
cd /var/www/nckh_tuyenquang
npm install --omit=dev

pm2 start npm --name "nckh" -- run start
pm2 save
pm2 startup   # chạy lệnh mà pm2 in ra
```

### 6. Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/nckh
```

```nginx
server {
    listen 80;
    server_name harutobui.com www.harutobui.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nckh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx
```

### 7. Cài SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d harutobui.com -d www.harutobui.com
```

SSL tự gia hạn mỗi 90 ngày. Kiểm tra: `sudo certbot renew --dry-run`

### 8. Cấu hình Google OAuth

Vào [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), thêm vào **Authorized JavaScript origins**:

```
https://harutobui.com
https://www.harutobui.com
```

---

## Cập nhật khi có thay đổi code

### Script deploy nhanh — `deploy.sh` (chạy trên Mac)

```bash
#!/bin/bash
EC2_IP="<EC2-IP>"
KEY="~/.ssh/your-key.pem"
REMOTE="/var/www/nckh_tuyenquang"

echo "==> Building..."
npm run build

echo "==> Uploading..."
rsync -avz --progress \
  -e "ssh -i $KEY" \
  --exclude='node_modules' \
  --exclude='src' \
  --exclude='.git' \
  --exclude='.env' \
  dist server server.js package.json \
  ubuntu@$EC2_IP:$REMOTE/

echo "==> Restarting server..."
ssh -i $KEY ubuntu@$EC2_IP "cd $REMOTE && npm install --omit=dev && pm2 restart nckh"

echo "==> Done! https://harutobui.com"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

### Cập nhật thủ công từng bước

```bash
# 1. Build trên Mac
npm run build

# 2. Upload lên EC2
rsync -avz -e "ssh -i key.pem" \
  --exclude='node_modules' --exclude='src' --exclude='.git' --exclude='.env' \
  dist server server.js package.json \
  ubuntu@54.179.194.184:/var/www/nckh_tuyenquang/

# 3. Restart server (gộp 1 lệnh)
ssh -i key.pem ubuntu@54.179.194.184 "cd /var/www/nckh_tuyenquang && npm install --omit=dev && pm2 restart nckh"
```

---

## Lệnh quản lý thường dùng trên EC2

```bash
# Xem trạng thái app
pm2 status

# Xem logs realtime
pm2 logs nckh

# Xem logs 50 dòng gần nhất
pm2 logs nckh --lines 50

# Restart app
pm2 restart nckh

# Kiểm tra Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx

# Kiểm tra MongoDB
sudo systemctl status mongod

# Xem log truy cập Nginx
sudo tail -f /var/log/nginx/access.log

# Xem log lỗi Nginx
sudo tail -f /var/log/nginx/error.log
```
