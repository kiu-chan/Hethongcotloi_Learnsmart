# Learn Smart - Hệ thống học tập thông minh

Ứng dụng web hỗ trợ quản lý học sinh, thi cử, và trò chơi giáo dục dành cho giáo viên và học sinh.

**Stack:** React 19 + Vite 7 (frontend) · Express.js 5 (backend) · MongoDB + Mongoose · Nginx · AWS EC2

---

## Kiến trúc tổng quan

Dự án theo mô hình **Fullstack Monorepo** — frontend và backend nằm cùng một repository, nhưng tách biệt hoàn toàn về runtime:

```
[Trình duyệt]
     │  HTTPS (port 443)
     ▼
  [Nginx]  ←── Reverse proxy + SSL termination
     │  HTTP (localhost:3000)
     ▼
[Express.js Server]  ←── API + serve file tĩnh (dist/)
     │
     ▼
  [MongoDB]  ←── Lưu trữ dữ liệu
```

- **Vite** build React thành file tĩnh (`dist/`), Express phục vụ luôn folder này.
- Mọi request `/api/*` được Express xử lý; các route còn lại trả về `index.html` để React Router điều hướng phía client.
- **PM2** giữ cho Node.js process chạy liên tục trên server.

---

## Cấu trúc dự án

```
nckh_tuyenquang/
│
├── src/                        # React frontend (SPA)
│   ├── main.jsx                # Entry point — khởi tạo React, gắn AuthProvider
│   ├── App.jsx                 # Root component, bọc Router
│   ├── index.css               # Tailwind base styles
│   │
│   ├── routes/
│   │   └── index.jsx           # Định nghĩa toàn bộ routes của ứng dụng
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx     # Global state cho xác thực (user, token, role)
│   │                           # Dùng React Context + localStorage để duy trì session
│   │
│   ├── components/             # UI components dùng chung
│   │   ├── PrivateRoute.jsx    # Bảo vệ route, kiểm tra token + role
│   │   ├── MathInput.jsx       # Input hỗ trợ LaTeX (dùng KaTeX)
│   │   ├── MathDisplay.jsx     # Render công thức toán học
│   │   ├── AIExamCreator.jsx   # Component tạo đề thi bằng AI
│   │   ├── Layout/
│   │   │   └── DefaultLayout.jsx   # Layout trang công khai (Home, About...)
│   │   ├── adminLayout/
│   │   │   └── AdminLayout.jsx     # Layout với sidebar dành cho Admin
│   │   ├── teacherLayout/
│   │   │   └── TeacherLayout.jsx   # Layout với sidebar dành cho Teacher
│   │   └── studentLayout/
│   │       └── StudentLayout.jsx   # Layout với sidebar dành cho Student
│   │
│   ├── services/
│   │   └── aiService.js        # Gọi Gemini API (Google Generative AI) từ client
│   │
│   └── pages/                  # Các trang theo vai trò
│       ├── Home/               # Trang chủ giới thiệu
│       ├── About/              # Giới thiệu dự án
│       ├── Features/           # Tính năng nổi bật
│       ├── Guide/              # Hướng dẫn sử dụng
│       ├── Contact/            # Liên hệ
│       │
│       ├── account/            # Xác thực người dùng
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   └── ResetPasswordPage.jsx
│       │
│       ├── admin/              # Quản trị viên
│       │   ├── AdminDashboard/ # Tổng quan hệ thống
│       │   ├── Users/          # Quản lý tài khoản giáo viên/học sinh
│       │   ├── Classes/        # Quản lý lớp học
│       │   ├── Exams/          # Xem toàn bộ bài thi
│       │   ├── Reports/        # Báo cáo thống kê
│       │   └── Settings/       # Cấu hình hệ thống
│       │
│       ├── teacher/            # Giáo viên
│       │   ├── Dashboard/      # Tổng quan lớp học của giáo viên
│       │   ├── Students/       # Quản lý học sinh, xem chi tiết, giao bài tập
│       │   ├── Exams/          # Tạo/sửa/chấm bài thi; import từ Excel/Word
│       │   ├── Games/          # Tạo game giáo dục (Quiz, Vòng quay)
│       │   ├── Documents/      # Quản lý tài liệu
│       │   ├── Notebook/       # Ghi chú cá nhân
│       │   ├── Statistics/     # Thống kê kết quả học sinh
│       │   ├── Chat/           # Chat với AI (OpenAI)
│       │   └── Settings/       # Cài đặt tài khoản giáo viên
│       │
│       └── student/            # Học sinh
│           ├── Dashboard/      # Tổng quan bài tập, điểm số
│           ├── Classroom/      # Lớp học, nộp bài tập
│           ├── TakeExam/       # Làm bài thi trực tuyến
│           ├── Games/          # Chơi game học tập (FlipCard, Memory, Sequence)
│           ├── Chat/           # Chat với AI
│           └── Settings/       # Cài đặt tài khoản học sinh
│
├── server/                     # Express.js backend
│   ├── server.js               # Entry point: khởi tạo Express, kết nối DB, đăng ký routes
│   ├── .env                    # Biến môi trường (không commit lên git)
│   │
│   ├── config/
│   │   └── db.js               # Kết nối MongoDB qua Mongoose
│   │
│   ├── middleware/
│   │   ├── auth.js             # Xác thực JWT — gắn user vào req.user
│   │   └── role.js             # Phân quyền theo role (admin/teacher/student)
│   │
│   ├── models/                 # Mongoose schemas (cấu trúc dữ liệu MongoDB)
│   │   ├── User.js             # Tài khoản (role: admin/teacher/student)
│   │   ├── Student.js          # Hồ sơ học sinh (liên kết với User)
│   │   ├── Class.js            # Lớp học
│   │   ├── Exam.js             # Đề thi và câu hỏi
│   │   ├── ExamSubmission.js   # Bài làm của học sinh
│   │   ├── Homework.js         # Bài tập về nhà
│   │   ├── HomeworkSubmission.js # Nộp bài tập
│   │   ├── Game.js             # Game giáo dục
│   │   ├── StudentGame.js      # Kết quả chơi game của học sinh
│   │   ├── Document.js         # Tài liệu giáo viên
│   │   ├── Notebook.js         # Ghi chú giáo viên
│   │   └── TeacherSettings.js  # Cài đặt riêng của từng giáo viên
│   │
│   ├── routes/                 # Express API routes
│   │   ├── auth.js             # POST /api/auth/login, /register, /google...
│   │   ├── admin.js            # GET/POST /api/admin/* (chỉ role=admin)
│   │   ├── students.js         # CRUD học sinh
│   │   ├── exams.js            # CRUD đề thi, chấm điểm, import file
│   │   ├── homework.js         # CRUD bài tập, nộp bài
│   │   ├── games.js            # CRUD game, lưu kết quả
│   │   ├── documents.js        # Upload/quản lý tài liệu
│   │   ├── notebooks.js        # Ghi chú giáo viên
│   │   ├── statistics.js       # Thống kê điểm số, tiến độ
│   │   ├── dashboard.js        # Dữ liệu tổng quan dashboard
│   │   ├── studentPortal.js    # API riêng cho học sinh (lấy bài, nộp bài)
│   │   └── public.js           # Route không cần xác thực
│   │
│   └── uploads/                # File được upload (Excel, Word, ảnh...)
│
├── dist/                       # React build output — tự sinh bởi `npm run build`
├── index.html                  # HTML template của Vite
├── vite.config.js              # Cấu hình Vite (proxy API khi dev)
├── tailwind.config.js          # Cấu hình Tailwind CSS
└── package.json
```

---

## Phân quyền (Role-based Access Control)

Hệ thống có 3 vai trò, mỗi vai trò truy cập vào khu vực riêng:

| Vai trò | Đường dẫn | Quyền hạn |
|---------|-----------|-----------|
| **Admin** | `/admin/*` | Quản lý toàn bộ người dùng, lớp, bài thi, báo cáo |
| **Teacher** | `/teacher/*` | Quản lý học sinh, tạo đề thi, giao bài, tạo game |
| **Student** | `/student/*` | Làm bài thi, nộp bài tập, chơi game học tập |

- Frontend: `PrivateRoute.jsx` kiểm tra token và role trước khi render trang.
- Backend: middleware `auth.js` xác thực JWT, `role.js` kiểm tra quyền truy cập route.

---

## Tích hợp AI

| Dịch vụ | Nơi dùng | Mục đích |
|---------|----------|----------|
| **OpenAI API** | Backend (`server/`) | Chat AI cho giáo viên và học sinh |
| **Google Gemini** | Frontend (`src/services/aiService.js`) | Tạo câu hỏi thi tự động |

---

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
