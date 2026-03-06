# Learn Smart - Hệ thống học tập thông minh

Ứng dụng web hỗ trợ quản lý học sinh, thi cử, và trò chơi giáo dục dành cho giáo viên và học sinh.

**Stack:** React 19 + Vite 7 (frontend) · Express.js 5 (backend) · MongoDB + Mongoose · Nginx · AWS EC2

---

## Kiến trúc tổng quan

Dự án theo mô hình **Fullstack Monorepo** — frontend và backend nằm cùng một repository, nhưng tách biệt hoàn toàn về runtime. Có hai chế độ vận hành:

### Môi trường Production (trên AWS EC2)

```
[Trình duyệt]
     │  HTTPS (port 443)
     ▼
  [Nginx]  ←── Reverse proxy + SSL termination (Let's Encrypt)
     │  HTTP (localhost:3000)
     ▼
[Express.js Server (PM2)]  ←── Nhận mọi request
     ├── /api/*   →  Xử lý logic API, trả về JSON
     ├── /uploads →  Trả file tĩnh (ảnh, tài liệu đã upload)
     └── /*       →  Trả file dist/index.html (React SPA)
          │
          ▼
       [MongoDB]  ←── Lưu trữ dữ liệu (chạy local trên EC2)
```

**Luồng hoạt động:**
1. Nginx nhận request HTTPS, terminate SSL và forward sang Express trên cổng 3000.
2. Express phân luồng: route `/api/*` xử lý business logic và query MongoDB; mọi route còn lại trả về `dist/index.html`.
3. Trình duyệt nhận `index.html` → tải React bundle → React Router xử lý điều hướng phía client.
4. React gọi `/api/*` — Nginx forward về Express, Express xác thực JWT rồi trả JSON.

### Môi trường Development (máy local)

```
[Trình duyệt]
     │  HTTP (localhost:5173)
     ▼
[Vite Dev Server]  ←── Serve React với HMR (Hot Module Replacement)
     │  Proxy /api/* và /uploads/*
     ▼
[Express.js Server]  ←── Chạy song song trên port 3000
     │
     ▼
  [MongoDB]  ←── Local hoặc MongoDB Atlas
```

**Vite proxy:** `vite.config.js` cấu hình proxy chuyển tiếp mọi request `/api/*` và `/uploads/*` từ port 5173 sang port 3000, giúp frontend và backend chạy độc lập mà không cần CORS phức tạp.

```js
// vite.config.js
server: {
  proxy: {
    '/api':     { target: 'http://localhost:3000', changeOrigin: true },
    '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
  }
}
```

### Xác thực & Phân quyền

```
[Client]                          [Server]
  │                                   │
  ├─ POST /api/auth/login ──────────► │
  │                                   ├─ Kiểm tra email/password (bcryptjs)
  │                                   ├─ Ký JWT (jsonwebtoken + JWT_SECRET)
  │ ◄── { token, user } ─────────────┤
  │                                   │
  ├─ Lưu token vào localStorage       │
  │                                   │
  ├─ GET /api/exams                   │
  │   Authorization: Bearer <token> ► │
  │                                   ├─ middleware auth.js: giải mã JWT
  │                                   ├─   → gắn req.user = User document
  │                                   ├─ middleware role.js: kiểm tra role
  │                                   └─ Route handler xử lý và trả data
  │ ◄── { success, data } ────────────┤
```

- Khi ứng dụng khởi động, `AuthContext` gọi `GET /api/auth/me` để xác minh token còn hợp lệ không. Nếu hết hạn, token bị xóa khỏi `localStorage` và người dùng bị đăng xuất.
- `PrivateRoute` (frontend) so sánh `currentUser.role` với `allowedRoles` của route — redirect về `/login` nếu không khớp.

---

## Cấu trúc dự án

Toàn bộ source code nằm trong một repository duy nhất, chia thành hai phần rõ ràng: `src/` cho frontend và `server/` cho backend.

```
nckh_tuyenquang/
│
├── src/                              # React frontend (SPA)
│   │
│   ├── main.jsx                      # Entry point của React
│   │                                 # → Bọc <App> trong <React.StrictMode>
│   │
│   ├── App.jsx                       # Root component
│   │                                 # → Bọc toàn bộ app trong <AuthProvider> + <Router>
│   │                                 # → Duyệt publicRoutes và privateRoutes để tạo <Route>
│   │                                 # → privateRoutes được bọc trong <PrivateRoute>
│   │
│   ├── index.css                     # Tailwind directives (@tailwind base/components/utilities)
│   │
│   ├── routes/
│   │   └── index.jsx                 # Xuất publicRoutes và privateRoutes
│   │                                 # Mỗi route: { path, component, layout, allowedRoles }
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx           # Global auth state dùng React Context API
│   │                                 # Khi app khởi động: gọi GET /api/auth/me để verify token
│   │                                 # Cung cấp: currentUser, login(), register(),
│   │                                 #           googleLogin(), logout(), updateProfile()
│   │                                 # Chặn render app cho đến khi verify xong (loading guard)
│   │
│   ├── components/
│   │   ├── PrivateRoute.jsx          # Wrapper bảo vệ route
│   │   │                             # Đọc currentUser.role từ AuthContext
│   │   │                             # → Không đăng nhập: redirect /login
│   │   │                             # → Sai role: redirect về trang chủ role đó
│   │   │
│   │   ├── MathInput.jsx             # Textarea soạn công thức LaTeX
│   │   │                             # Preview realtime bằng KaTeX
│   │   │
│   │   ├── MathDisplay.jsx           # Render chuỗi LaTeX thành HTML bằng KaTeX
│   │   │                             # Dùng trong đề thi, câu hỏi có công thức toán
│   │   │
│   │   ├── AIExamCreator.jsx         # Modal tạo đề thi bằng AI
│   │   │                             # Gọi POST /api/exams/ai-generate
│   │   │                             # Nhận chủ đề, số câu, mức độ → trả câu hỏi JSON
│   │   │
│   │   ├── Layout/
│   │   │   └── DefaultLayout.jsx     # Header + Footer cho trang công khai
│   │   │
│   │   ├── adminLayout/
│   │   │   └── AdminLayout.jsx       # Sidebar điều hướng + main content cho Admin
│   │   │
│   │   ├── teacherLayout/
│   │   │   └── TeacherLayout.jsx     # Sidebar + header cho Giáo viên
│   │   │
│   │   └── studentLayout/
│   │       └── StudentLayout.jsx     # Sidebar + header cho Học sinh
│   │
│   ├── services/
│   │   └── aiService.js              # Gọi OpenAI API hỗ trợ tính năng AI
│   │
│   └── pages/                        # Các trang, tổ chức theo vai trò
│       ├── Home/ · About/ · Features/ · Guide/ · Contact/   # Trang công khai
│       │
│       ├── account/                  # Xác thực
│       │   ├── LoginPage.jsx         # Form login + nút Google OAuth
│       │   ├── RegisterPage.jsx      # Form đăng ký
│       │   ├── ForgotPasswordPage.jsx
│       │   └── ResetPasswordPage.jsx
│       │
│       ├── admin/                    # Khu vực Admin (route /admin/*)
│       │   ├── AdminDashboard/       # Thống kê toàn hệ thống
│       │   ├── Users/                # CRUD tài khoản
│       │   ├── Classes/              # Quản lý lớp học
│       │   ├── Exams/                # Xem đề thi toàn hệ thống
│       │   ├── Reports/              # Báo cáo thống kê
│       │   └── Settings/
│       │
│       ├── teacher/                  # Khu vực Giáo viên (route /teacher/*)
│       │   ├── Dashboard/            # Dashboard + thao tác nhanh + lịch thi
│       │   ├── Students/             # Danh sách học sinh, bài tập (2 tab)
│       │   ├── Exams/                # Tạo/import/chấm đề thi (nhiều modal)
│       │   ├── Games/                # Quiz và Vòng quay (2 tab)
│       │   ├── Documents/            # Upload tài liệu
│       │   ├── Notebook/             # Ghi chú + AI tóm tắt
│       │   ├── Statistics/           # Biểu đồ kết quả học sinh
│       │   ├── Chat/                 # Chat với AI (OpenAI)
│       │   └── Settings/
│       │
│       └── student/                  # Khu vực Học sinh (route /student/*)
│           ├── Dashboard/            # Tổng quan điểm số + đề thi chờ
│           ├── Classroom/            # Lớp học + bài kiểm tra + bài tập (2 tab)
│           ├── TakeExam/             # Làm bài thi (đếm giờ, lưu tạm)
│           ├── Games/                # FlipCard, Memory, Sequence
│           ├── Chat/                 # Chat với AI (OpenAI)
│           └── Settings/
│
├── server/                           # Express.js backend
│   │
│   ├── server.js                     # Entry point của server
│   │                                 # → Khởi tạo Express app
│   │                                 # → Đăng ký tất cả middleware và routes
│   │                                 # → Ở production: serve dist/ và fallback index.html
│   │                                 # → Seed demo users nếu DB còn trống
│   │                                 # → Gọi connectDB() rồi app.listen(PORT)
│   │
│   ├── .env                          # Biến môi trường (KHÔNG commit lên git)
│   │
│   ├── config/
│   │   └── db.js                     # mongoose.connect(MONGO_URI)
│   │                                 # → Process.exit(1) nếu kết nối thất bại
│   │
│   ├── middleware/
│   │   ├── auth.js                   # Middleware xác thực JWT
│   │   │                             # → Đọc header Authorization: Bearer <token>
│   │   │                             # → jwt.verify() giải mã token
│   │   │                             # → User.findById() lấy document đầy đủ
│   │   │                             # → Gắn vào req.user cho route handler dùng
│   │   │
│   │   └── role.js                   # Middleware kiểm tra quyền
│   │                                 # → Nhận danh sách roles được phép
│   │                                 # → So sánh với req.user.role
│   │                                 # → 403 nếu không có quyền
│   │
│   ├── models/                       # Mongoose Schemas — định nghĩa cấu trúc dữ liệu MongoDB
│   │   ├── User.js                   # { name, email, password (hashed), role, googleId }
│   │   ├── Student.js                # { name, email, className[], userId (→User), teacherId }
│   │   ├── Class.js                  # { name, teacherId (→User), studentIds[] }
│   │   ├── Exam.js                   # { title, subject, questions[], duration, status, ... }
│   │   ├── ExamSubmission.js         # { examId, studentId, answers[], score, status }
│   │   ├── Homework.js               # { title, teacherId, className, deadline, ... }
│   │   ├── HomeworkSubmission.js     # { homeworkId, studentId, fileUrl, status }
│   │   ├── Game.js                   # { type (quiz|wheel), questions/items[], teacherId }
│   │   ├── StudentGame.js            # { gameId, studentId, score, playedAt }
│   │   ├── Document.js               # { filename, originalName, teacherId, uploadedAt }
│   │   ├── Notebook.js               # { title, content, teacherId, updatedAt }
│   │   └── TeacherSettings.js        # { teacherId, semesterStartDate, ... }
│   │
│   ├── routes/                       # Express Router — định nghĩa endpoints API
│   │   ├── auth.js                   # POST /login, /register, /google
│   │   │                             # GET  /me (verify token hiện tại)
│   │   │                             # POST /forgot-password, /reset-password
│   │   │
│   │   ├── admin.js                  # Yêu cầu role=admin
│   │   │                             # GET /dashboard, /users, /exams, /reports
│   │   │                             # POST/DELETE /users/:id
│   │   │
│   │   ├── students.js               # CRUD học sinh của giáo viên
│   │   │                             # GET  /class-view, /export (xuất Excel)
│   │   │                             # GET/PUT /settings (ngày đầu học kỳ)
│   │   │
│   │   ├── exams.js                  # CRUD đề thi
│   │   │                             # POST /ai-generate (tạo câu hỏi AI)
│   │   │                             # POST /:id/import (import Excel/Word)
│   │   │                             # POST /:id/assign (phân công thi)
│   │   │                             # PATCH /:id/status, /:id/settings
│   │   │                             # POST /:id/duplicate
│   │   │
│   │   ├── homework.js               # CRUD bài tập, nộp/chấm bài tập
│   │   ├── games.js                  # CRUD game, POST /:id/play (ghi điểm)
│   │   ├── documents.js              # Upload (Multer) + CRUD tài liệu
│   │   ├── notebooks.js              # CRUD ghi chú giáo viên
│   │   ├── statistics.js             # Thống kê điểm số, tỷ lệ hoàn thành
│   │   ├── dashboard.js              # GET /stats, /recent-activities, /upcoming
│   │   ├── studentPortal.js          # API cho học sinh: /dashboard, /classroom,
│   │   │                             # /exams, /exams/:id/submit, /exams/:id/save
│   │   └── public.js                 # Routes không cần xác thực
│   │
│   └── uploads/                      # Thư mục lưu file upload (Multer)
│                                     # Được serve tĩnh qua /uploads/*
│
├── dist/                             # Output của `npm run build` — không commit
├── index.html                        # HTML template gốc của Vite
├── vite.config.js                    # Cấu hình Vite: plugin React + proxy dev
├── tailwind.config.js                # Cấu hình Tailwind CSS
└── package.json                      # Dependencies chung cho cả frontend lẫn backend
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

### Model đang sử dụng: GPT-4o (OpenAI)

**GPT-4o** (GPT-4 Omni) là model đa phương thức của OpenAI — hỗ trợ cả văn bản lẫn hình ảnh đầu vào:

| Đặc điểm | GPT-4o |
|----------|--------|
| Loại input | Văn bản + hình ảnh (multimodal) |
| Context window | 128.000 tokens |
| Hỗ trợ tiếng Việt | Tốt — hiểu ngữ cảnh giáo dục Việt Nam |
| API | `openai.chat.completions.create()` |
| Huấn luyện thêm | Không — thuần Prompt Engineering |

Dự án **không** fine-tune hay huấn luyện lại model. Toàn bộ hành vi AI được kiểm soát bằng **Prompt Engineering** — thiết kế câu lệnh hệ thống (system prompt) và câu lệnh người dùng (user prompt) một cách có cấu trúc.

---

### Kiến trúc tích hợp

OpenAI SDK được gọi **trực tiếp từ trình duyệt** (client-side), không qua server:

```
[Trình duyệt]
     │
     ├─ new OpenAI({ apiKey: VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
     │
     ▼
openai.chat.completions.create({ model: 'gpt-4o', messages: [...] })
     │  HTTPS trực tiếp → api.openai.com
     ▼
[GPT-4o trả về JSON / text]
     │
     ▼
[React cập nhật UI]
```

API key lưu trong biến môi trường Vite `VITE_OPENAI_API_KEY` (file `.env` thư mục gốc). Vì gọi từ client nên key xuất hiện trong browser bundle — cần giới hạn bằng **Usage Limit** và **Rate Limit** trên OpenAI dashboard.

---

### Các tính năng AI

#### 1. Tạo câu hỏi trắc nghiệm — `generateMultipleChoiceQuestions()`

```
Giáo viên nhập:
  ├─ Nội dung tài liệu (paste text hoặc upload TXT / PDF / DOCX)
  ├─ Số câu, môn học, chủ đề, độ khó
  └─ Hướng dẫn bổ sung (tùy chọn)
        ↓
Hệ thống xây dựng prompt có cấu trúc → gửi GPT-4o
        ↓
GPT-4o trả về mảng JSON thuần túy
        ↓
sanitizeJSONText() làm sạch ký tự điều khiển, bỏ markdown wrapper
        ↓
JSON.parse() → câu hỏi sẵn sàng thêm vào đề thi
```

Cấu trúc JSON mỗi câu trắc nghiệm:
```json
{
  "question": "Tìm nghiệm của $x^{2} - 5x + 6 = 0$?",
  "options": [
    { "label": "A", "text": "$x = 1$ hoặc $x = 6$" },
    { "label": "B", "text": "$x = 2$ hoặc $x = 3$" },
    { "label": "C", "text": "$x = -2$ hoặc $x = -3$" },
    { "label": "D", "text": "$x = 0$ hoặc $x = 5$" }
  ],
  "correctAnswer": "B",
  "explanation": "Phân tích: $(x-2)(x-3) = 0$ → $x = 2$ hoặc $x = 3$",
  "points": 1,
  "difficulty": "medium",
  "topic": "Phương trình bậc 2"
}
```

Prompt yêu cầu AI dùng cú pháp LaTeX (`$...$` inline, `$$...$$` block) cho công thức. Frontend dùng **KaTeX** để render.

#### 2. Tạo câu hỏi tự luận — `generateEssayQuestions()`

Trả về JSON với `sampleAnswer` (đáp án mẫu) và `rubric` (tiêu chí chấm từng phần):
```json
{
  "question": "Phân tích ý nghĩa chiến thắng Điện Biên Phủ 1954.",
  "sampleAnswer": "Chiến thắng Điện Biên Phủ...",
  "rubric": [
    "Nêu bối cảnh lịch sử (1 điểm)",
    "Phân tích diễn biến (2 điểm)",
    "Đánh giá ý nghĩa (2 điểm)"
  ],
  "points": 5,
  "difficulty": "hard",
  "topic": "Kháng chiến chống Pháp"
}
```

#### 3. Tạo đề hỗn hợp — `generateMixedExam()`

Gọi tuần tự hai hàm trên để tránh rate-limit. Có **retry tự động**: nếu một phần thất bại, hệ thống thử lại lần nữa trước khi báo lỗi.

#### 4. Tóm tắt tài liệu — `summarizeDocument()`

Giáo viên paste hoặc upload file, chọn kiểu tóm tắt:

| Kiểu | Định dạng trả về | Mục đích |
|------|-----------------|----------|
| **Danh sách** | HTML `<ol>/<ul>` phân cấp | Liệt kê ý chính có thứ tự |
| **Bảng** | HTML `<table>` | So sánh, tổng hợp dạng bảng |
| **Gạch đầu dòng** | HTML `<ul>/<li>` | Ghi chú nhanh |
| **Khung sườn giáo án** | HTML đầy đủ I–IV | Mục tiêu, chuẩn bị, tiến trình 45 phút, về nhà |

Kết quả HTML được **DOMPurify** sanitize trước khi render để tránh XSS.

#### 5. Chat AI — Giáo viên (`/teacher/chat`)

Hội thoại đa lượt — toàn bộ lịch sử tin nhắn gửi kèm mỗi request:

```js
[
  { role: 'system',    content: SYSTEM_INSTRUCTION }, // định hướng nhân cách AI
  { role: 'user',      content: 'câu hỏi 1' },        // lịch sử trước đó
  { role: 'assistant', content: 'trả lời 1' },
  { role: 'user',      content: lastContent },         // câu hỏi hiện tại
]
```

**System prompt định hướng AI là cộng sự chuyên môn của giáo viên:**
> *"Bạn là trợ lý AI thông minh dành cho giáo viên phổ thông Việt Nam... Hỗ trợ soạn bài, giải thích khái niệm, tạo câu hỏi, gợi ý phương pháp dạy học tích cực... Luôn trả lời bằng tiếng Việt, chuyên nghiệp và chi tiết."*

**Hỗ trợ đính kèm file:** Hệ thống tự trích xuất nội dung file trước khi gửi cho AI:

| Loại file | Cách xử lý |
|-----------|------------|
| Ảnh (JPG, PNG, WEBP...) | Encode base64 → gửi qua `image_url` (GPT-4o Vision) |
| PDF | `pdfjs-dist` đọc từng trang, trích text |
| DOCX | `mammoth` convert sang plain text |
| XLSX | `xlsx` convert từng sheet sang CSV |
| TXT, MD, code | `FileReader.readAsText()` |

**Xuất PDF:** Giáo viên tải từng câu trả lời hoặc toàn bộ cuộc hội thoại dưới dạng PDF (dùng `html2pdf.js`).

#### 6. Chat AI — Học sinh (`/student/chat`)

Tương tự chat giáo viên nhưng **system prompt khác hoàn toàn** — hướng tới bảo vệ quá trình tự học:

> *"TUYỆT ĐỐI KHÔNG giải bài tập hay làm bài hộ học sinh. Khi học sinh gửi bài tập: phân tích đề, gợi ý phương pháp, đặt câu hỏi gợi mở — KHÔNG đưa đáp án cuối cùng. Khuyến khích và động viên học sinh..."*

Sự khác biệt thể hiện triết lý thiết kế: **AI giáo viên = cộng sự chuyên môn**, **AI học sinh = gia sư Socratic**.

---

### Kỹ thuật Prompt Engineering

| Kỹ thuật | Áp dụng |
|---------|---------|
| **Role assignment** | Mở đầu prompt gán vai trò: *"Bạn là giáo viên chuyên nghiệp..."* để định hướng giọng văn |
| **Structured input** | Thông tin chia khối rõ bằng tiêu đề viết hoa: `THÔNG TIN:`, `NỘI DUNG:`, `YÊU CẦU:` |
| **Output format enforcement** | Chỉ định chính xác: *"Chỉ trả về JSON thuần túy, KHÔNG có markdown"* |
| **LaTeX instruction** | Hướng dẫn chi tiết cú pháp LaTeX trong JSON kèm ví dụ từng môn (Toán, Lý, Hóa) |
| **Negative constraints** | Student chat: liệt kê rõ điều AI không được làm để tránh trả lời bài hộ |
| **Fallback sanitize** | `sanitizeJSONText()` xử lý ký tự điều khiển AI sinh ra, tránh `JSON.parse()` lỗi |
| **Retry logic** | `generateMixedExam()` tự retry phần thất bại, tăng độ tin cậy khi API rate-limit |

---

## Công nghệ sử dụng

### Frontend

#### React 19
Thư viện UI chính để xây dựng giao diện dạng component. Ứng dụng là một **SPA (Single Page Application)** — toàn bộ HTML được render phía client, không reload trang khi điều hướng. Dùng **Function Components** + **Hooks** (`useState`, `useEffect`, `useCallback`, `useContext`) trong toàn bộ codebase, không dùng Class Components.

#### Vite 7
Build tool thay thế Create React App. Trong development, Vite dùng native ES Modules để serve file trực tiếp (không bundle) nên khởi động gần như tức thì. **HMR (Hot Module Replacement)** cập nhật component ngay lập tức khi lưu file mà không mất state. Khi build production, Vite dùng Rollup để bundle và tối ưu.

#### React Router DOM 7
Xử lý điều hướng hoàn toàn phía client — URL thay đổi nhưng trang không reload. Routes được khai báo tập trung trong `src/routes/index.jsx` theo cấu trúc `{ path, component, layout, allowedRoles }`, sau đó `App.jsx` render thành cây `<Routes>/<Route>`.

#### Tailwind CSS 3
Utility-first CSS framework — style trực tiếp bằng class HTML (`bg-blue-500`, `rounded-xl`, `flex items-center`...) thay vì viết file CSS riêng. Không có file CSS component nào trong dự án ngoài `index.css`. Vite tích hợp sẵn PostCSS để xử lý Tailwind khi build.

#### KaTeX
Thư viện render công thức toán học từ cú pháp LaTeX sang HTML/SVG, chạy hoàn toàn phía client. Dùng trong hai component: `MathInput` (soạn thảo với preview realtime) và `MathDisplay` (hiển thị trong đề thi, câu hỏi). Không cần kết nối mạng để render.

#### xlsx + mammoth
- **xlsx**: đọc file Excel `.xlsx` phía client để parse câu hỏi import và xuất danh sách học sinh.
- **mammoth**: convert file Word `.docx` sang HTML phía client để parse nội dung đề thi import.

#### html2pdf.js + pdfjs-dist
- **html2pdf.js**: chụp DOM thành canvas rồi xuất PDF — dùng để export đề thi, báo cáo.
- **pdfjs-dist**: đọc và hiển thị file PDF trong trình duyệt — dùng trong phần tài liệu giáo viên.

#### DOMPurify
Sanitize HTML trước khi render vào DOM để ngăn tấn công XSS. Áp dụng cho nội dung động từ user input hoặc từ AI.

---

### Backend

#### Node.js 20 + Express 5
Node.js là runtime chạy JavaScript phía server. Express là web framework tối giản — mỗi route được định nghĩa qua `app.use('/api/...', router)`. Dự án dùng **ES Modules** (`import/export`) thay vì CommonJS (`require`), khai báo trong `package.json` với `"type": "module"`.

**Cách Express xử lý request:**
```
Request đến
  → cors() middleware (cho phép cross-origin)
  → express.json() (parse body JSON)
  → Route matching (/api/auth, /api/exams, ...)
     → protect middleware (xác thực JWT)
     → role middleware (kiểm tra quyền)
     → Route handler (query MongoDB, trả JSON)
```

#### MongoDB 7 + Mongoose 9
MongoDB lưu dữ liệu dạng **document JSON** (BSON) thay vì bảng quan hệ — phù hợp với cấu trúc linh hoạt của đề thi (mỗi câu hỏi có cấu trúc khác nhau). Mongoose là ODM (Object Document Mapper) cung cấp:
- **Schema**: định nghĩa cấu trúc và kiểu dữ liệu cho mỗi collection.
- **Model**: interface để query (`find`, `findById`, `create`, `updateOne`...).
- **Populate**: join documents giữa các collection (tương tự JOIN trong SQL).

**Ví dụ quan hệ dữ liệu:**
```
User (1) ──────────────────► Student (nhiều)
Class (1) ──── teacherId ──► Teacher (User)
Class (1) ──── studentIds ► Student[]
Exam (1) ──── teacherId ───► Teacher
ExamSubmission ── examId + studentId
```

#### JSON Web Token (JWT)
Cơ chế xác thực **stateless** — server không lưu session, toàn bộ thông tin người dùng nằm trong token được ký bằng `JWT_SECRET`. Flow:
1. Client gửi email/password → Server kiểm tra, ký JWT với `{ id, role }`, trả về token.
2. Client lưu token vào `localStorage`, gửi kèm mọi request sau trong header `Authorization: Bearer <token>`.
3. `auth.js` middleware giải mã token, tìm user trong DB, gắn vào `req.user`.

#### bcryptjs
Hash mật khẩu một chiều trước khi lưu vào DB. Khi đăng nhập, `bcrypt.compare()` so sánh mật khẩu nhập vào với hash đã lưu mà không cần giải mã. Salt factor mặc định là 10 rounds.

#### Multer 2
Middleware xử lý `multipart/form-data` — cần thiết để nhận file upload. File được lưu vào `server/uploads/` với tên được đặt lại theo timestamp để tránh trùng. Được dùng trong routes `documents.js` (upload tài liệu) và `exams.js` (import đề thi).

#### OpenAI SDK 6
Gọi OpenAI API từ phía server (không expose API key ra client). Dùng trong:
- Route tạo câu hỏi AI cho đề thi (`POST /api/exams/ai-generate`)
- Chat AI cho giáo viên và học sinh (`/api/chat`)

#### Google Auth Library
Xác minh Google ID token khi người dùng đăng nhập bằng Google OAuth. Client gửi credential token từ Google Sign-In SDK → server dùng `google-auth-library` verify tính hợp lệ → tạo hoặc tìm User trong DB → trả JWT của hệ thống.

#### docx
Tạo file Word `.docx` phía server để xuất đề thi — dùng khi giáo viên download đề.

---

### Hạ tầng & Triển khai

#### AWS EC2 (Ubuntu)
Máy chủ ảo chạy toàn bộ ứng dụng: Node.js server, MongoDB, Nginx. Dùng Security Group để chỉ mở port 22 (SSH), 80 (HTTP), 443 (HTTPS).

#### Nginx
Đứng trước Express làm **reverse proxy**:
- Nhận request HTTPS (port 443), terminate SSL.
- Forward sang Express trên `localhost:3000`.
- Cấu hình `client_max_body_size 50M` để cho phép upload file lớn.
- Tự động redirect HTTP → HTTPS sau khi cài Certbot.

#### PM2
Process manager cho Node.js:
- Giữ Express server chạy liên tục, **tự restart** khi crash hoặc khi server reboot.
- `pm2 save` + `pm2 startup` để đảm bảo process tự khởi động cùng hệ thống.
- `pm2 logs` để xem log realtime không cần SSH phức tạp.

#### Let's Encrypt + Certbot
Cung cấp chứng chỉ SSL miễn phí, tự gia hạn mỗi 90 ngày. Certbot tự chỉnh sửa config Nginx để thêm HTTPS và redirect HTTP → HTTPS.

---

## Các trang của ứng dụng

---

### Trang công khai (không cần đăng nhập)

Các trang này hiển thị với layout mặc định (header + footer), ai cũng có thể truy cập.

| Trang | Đường dẫn |
|-------|-----------|
| Trang chủ | `/` |
| Tính năng | `/features` |
| Hướng dẫn | `/guide` |
| Giới thiệu | `/about` |
| Liên hệ | `/contact` |

---

### Trang xác thực

#### Đăng nhập — `/login`

- Đăng nhập bằng **email + mật khẩu** hoặc nút **"Đăng nhập với Google"** (Google OAuth).
- Sau khi đăng nhập thành công, hệ thống đọc `role` trong token JWT và tự động chuyển hướng:
  - `admin` → `/admin`
  - `teacher` → `/teacher/dashboard`
  - `student` → `/student/dashboard`
- Token được lưu vào `localStorage` để duy trì phiên đăng nhập.

#### Đăng ký — `/register`

- Nhập tên, email, mật khẩu và chọn vai trò (giáo viên / học sinh).
- Sau khi đăng ký, tài khoản học sinh cần được giáo viên thêm vào lớp trước khi sử dụng đầy đủ tính năng.

#### Quên mật khẩu — `/forgot-password`

- Nhập email để nhận link đặt lại mật khẩu.

#### Đặt lại mật khẩu — `/reset-password`

- Nhập mật khẩu mới sau khi truy cập qua link email.

---

### Khu vực Admin (`/admin/*`)

> Chỉ tài khoản có role `admin` mới truy cập được. Giao diện dùng `AdminLayout` với sidebar điều hướng.

#### Tổng quan — `/admin`

Màn hình dashboard tổng quan toàn hệ thống:

- **Thẻ thống kê (6 thẻ):** Tổng người dùng, số giáo viên, số học sinh, số tài liệu, số đề thi, số trò chơi.
- **Hoạt động gần đây:** Feed theo dõi các hành động mới nhất của giáo viên (tạo đề thi, upload tài liệu, tạo game...), hiển thị avatar chữ cái, tên người dùng, hành động và thời gian tương đối.
- **Cảnh báo hệ thống:** Thông báo các vấn đề cần chú ý (bài chưa chấm điểm, trạng thái tài nguyên, số người dùng hoạt động).
- **Truy cập nhanh:** Shortcut đến Quản lý người dùng, Xem bài kiểm tra, Báo cáo thống kê.
- Nút **Làm mới** để tải lại dữ liệu realtime.

#### Người dùng — `/admin/users`

- Xem danh sách toàn bộ tài khoản trong hệ thống.
- Tìm kiếm theo tên, email; lọc theo role.
- Thêm tài khoản mới, chỉnh sửa thông tin, vô hiệu hóa hoặc xóa tài khoản.

#### Lớp học — `/admin/classes`

- Xem danh sách tất cả lớp học trong hệ thống.
- Tạo lớp mới, chỉnh sửa, xóa lớp.
- Phân công giáo viên phụ trách lớp — đây là bước bắt buộc để giáo viên có thể thấy học sinh trong lớp đó.

#### Bài thi — `/admin/exams`

- Xem toàn bộ đề thi của tất cả giáo viên (chỉ đọc).
- Tìm kiếm và lọc theo trạng thái, môn học.

#### Báo cáo — `/admin/reports`

- Thống kê kết quả học tập tổng hợp: biểu đồ điểm số, tỷ lệ hoàn thành bài thi, tiến độ theo lớp.

#### Cài đặt — `/admin/settings`

- Cấu hình thông tin hệ thống.

---

### Khu vực Giáo viên (`/teacher/*`)

> Chỉ tài khoản có role `teacher` mới truy cập được. Giao diện dùng `TeacherLayout` với sidebar điều hướng.

#### Tổng quan — `/teacher/dashboard`

Dashboard cá nhân của giáo viên:

- **Banner chào mừng** hiển thị tên giáo viên.
- **Thẻ thống kê (4 thẻ):** Tổng học sinh, số tài liệu, số đề thi, số trò chơi.
- **Thao tác nhanh (6 ô):** Shortcut đến các tính năng chính — Tóm tắt tài liệu AI, Tạo câu hỏi, Tạo đề thi, Thiết kế trò chơi, Quản lý học sinh, Quản lý tài liệu.
- **Hoạt động gần đây:** Các thao tác gần nhất của giáo viên (tạo đề, upload tài liệu, tạo game...) với thời gian tương đối.
- **Lịch thi sắp tới:** Danh sách đề thi sắp đến hạn, có phân biệt trạng thái hôm nay (đỏ) / đã xuất bản (vàng) / nháp (xám).

#### Học sinh — `/teacher/students`

Quản lý toàn bộ học sinh trong các lớp được phân công:

- **Tab "Học sinh":**
  - Thẻ thống kê: Tổng học sinh, số xuất sắc, điểm trung bình chung, tỷ lệ đi học.
  - Cài đặt **ngày đầu học kỳ** (dùng để tính tỷ lệ đi học chính xác).
  - Thanh lọc: tìm kiếm theo tên/email, lọc theo trạng thái (đang học / nghỉ học), lọc theo lớp.
  - Chế độ xem **Grid** (thẻ card) hoặc **List** (bảng).
  - Nhấn vào học sinh mở **Modal chi tiết**: xem hồ sơ, điểm số, lịch sử làm bài, bài tập.
  - Xuất danh sách học sinh ra file **Excel** theo lớp.
- **Tab "Bài tập":** Quản lý bài tập đã giao — xem danh sách, theo dõi tiến độ nộp bài.

#### Đề thi — `/teacher/exams`

Trung tâm quản lý đề thi với đầy đủ vòng đời:

- **Tạo đề thi mới** (nút "+ Tạo đề thi mới"):
  - Nhập thông tin: tiêu đề, môn học, thời gian làm bài, mức độ khó, thời hạn nộp.
  - Thêm câu hỏi **trắc nghiệm** hoặc **tự luận** thủ công.
  - Hỗ trợ công thức toán học dạng LaTeX (KaTeX).
  - Sử dụng **AI tạo câu hỏi** tự động theo chủ đề và mức độ nhận thức.
- **Import đề từ file** (nút "Tải đề lên"):
  - Hỗ trợ file **Excel (.xlsx)** theo template mẫu.
  - Hỗ trợ file **Word (.docx)** — hệ thống tự parse nội dung.
  - Tải file mẫu để điền đúng định dạng.
- **Thống kê nhanh:** Tổng đề, số đã xuất bản, số hoàn thành, số nháp.
- **Bộ lọc:** Lọc theo trạng thái (tất cả / nháp / xuất bản / hoàn thành), môn học, tìm kiếm theo tên.
- **Hành động trên mỗi đề thi:**
  - Xem chi tiết nội dung đề.
  - Chỉnh sửa đề (khi còn ở trạng thái nháp).
  - Nhân bản đề thi.
  - Thay đổi trạng thái: Nháp → Xuất bản → Hoàn thành.
  - **Phân công thi**: giao đề cho cả lớp hoặc từng học sinh, đặt thời hạn nộp.
  - **Chấm điểm**: xem từng bài nộp, chấm điểm câu tự luận, nhập điểm.
  - Bật/tắt hiển thị đáp án sau khi nộp bài.
  - Xuất đề ra file **Excel**.

#### Trò chơi — `/teacher/games`

Tạo và chơi game học tập tương tác:

- **Tab Quiz (Câu hỏi trắc nghiệm):**
  - Tạo bộ câu hỏi quiz với đáp án đúng/sai.
  - Chơi trực tiếp trên màn hình chiếu: hiển thị từng câu hỏi có đếm thời gian, học sinh trả lời, hệ thống tính điểm.
  - Xem lịch sử điểm và số lượt chơi.
- **Tab Vòng quay:**
  - Tạo vòng quay may mắn với các lựa chọn tùy chỉnh (tên học sinh, chủ đề, câu hỏi...).
  - Quay vòng quay ngẫu nhiên khi tương tác trên lớp.
- Thống kê: Tổng trò chơi, tổng lượt chơi, điểm trung bình, số quiz.
- Tạo / chỉnh sửa / xóa game qua modal.

#### Tài liệu — `/teacher/documents`

- Upload tài liệu giảng dạy (PDF, Word, ảnh, các định dạng khác) qua Multer.
- Xem danh sách tài liệu đã upload với tên file, ngày tạo.
- Tải xuống hoặc xóa tài liệu.

#### Ghi chú — `/teacher/notebook`

- Viết và lưu ghi chú cá nhân (Markdown-friendly).
- Tích hợp AI (OpenAI): dán nội dung tài liệu vào, AI tóm tắt theo dạng danh sách hoặc bảng.
- Tìm kiếm, chỉnh sửa, xóa ghi chú.

#### Thống kê — `/teacher/statistics`

- Biểu đồ kết quả học tập tổng hợp của học sinh trong lớp.
- Bảng điểm chi tiết từng học sinh theo từng đề thi.
- Thống kê tỷ lệ hoàn thành, điểm trung bình, phân phối điểm.

#### Chat AI — `/teacher/chat`

- Giao diện chat với trợ lý AI (OpenAI GPT).
- Hỗ trợ giáo viên soạn bài, giải thích khái niệm, tạo ý tưởng câu hỏi, trả lời thắc mắc chuyên môn.
- Lịch sử hội thoại trong phiên làm việc.

#### Cài đặt — `/teacher/settings`

- Xem và cập nhật thông tin cá nhân (tên, email).
- Đổi mật khẩu.

---

### Khu vực Học sinh (`/student/*`)

> Chỉ tài khoản có role `student` mới truy cập được. Giao diện dùng `StudentLayout` với sidebar điều hướng.

#### Tổng quan — `/student/dashboard`

Dashboard cá nhân của học sinh:

- **Banner chào mừng** hiển thị tên học sinh, tên lớp, tên giáo viên.
- **Thẻ thống kê (4 thẻ):** Tổng đề thi được giao, số chưa làm, số đã hoàn thành, điểm trung bình (thang 10).
- **Đề thi chưa làm:** Danh sách các bài thi cần làm, có thẻ độ khó (Dễ / Trung bình / Khó), thời gian làm bài, hạn nộp.
- **Bài đã nộp gần đây:** Hiển thị điểm từng bài (màu xanh ≥8, vàng ≥5, đỏ <5) hoặc badge "Chờ chấm" nếu giáo viên chưa chấm.
- **Truy cập nhanh:** Lớp học, Hỏi AI, Làm bài thi.
- Thông báo đặc biệt cho tài khoản mới chưa được thêm vào lớp.

#### Lớp học — `/student/classroom`

Không gian học tập chính của học sinh:

- **Thông tin lớp:** Tên lớp, số học sinh, thông tin giáo viên (tên, email).
- **Bạn cùng lớp:** Danh sách avatar chữ cái của các học sinh trong lớp.
- Nếu học sinh thuộc nhiều lớp, có thể chuyển lớp bằng tab selector.
- **Tab "Bài kiểm tra":**
  - Danh sách đề thi được giao với trạng thái: Chưa làm / Đang làm / Đã nộp / Đã chấm / Quá hạn.
  - Hiển thị môn học, thời lượng, số câu, tổng điểm, hạn nộp, đếm ngược thời gian còn lại (hiển thị đỏ khi cấp bách).
  - Điểm chi tiết sau khi chấm: điểm trắc nghiệm, điểm tự luận, tổng điểm.
  - Nút **Làm bài** / **Tiếp tục** chuyển sang trang làm thi.
- **Tab "Bài tập":** Danh sách bài tập về nhà, nộp file bài làm, xem trạng thái.

#### Làm bài thi — `/student/exam/:id`

- Giao diện làm bài thi toàn màn hình.
- **Đồng hồ đếm ngược** thời gian làm bài.
- Hiển thị danh sách câu hỏi: trắc nghiệm (chọn 1 đáp án A/B/C/D) và tự luận (nhập văn bản).
- Hỗ trợ render công thức toán học trong đề bài.
- Tự động lưu bài tạm thời (trạng thái `in_progress`), có thể thoát ra rồi tiếp tục sau.
- Nút **Nộp bài** — xác nhận trước khi nộp; sau khi nộp không thể sửa.

#### Trò chơi — `/student/games`

- Xem danh sách game do giáo viên tạo.
- **FlipCard (Lật thẻ):** Lật các cặp thẻ để ghép khái niệm với định nghĩa.
- **Memory (Ghi nhớ):** Lật và tìm các cặp thẻ giống nhau, rèn trí nhớ.
- **Sequence (Sắp xếp):** Sắp xếp các phần tử theo đúng thứ tự.
- Điểm và kết quả được ghi lại sau mỗi lượt chơi.

#### Chat AI — `/student/chat`

- Giao diện chat với trợ lý AI (OpenAI GPT).
- Học sinh có thể hỏi bài, nhờ giải thích kiến thức, luyện tập với AI.
- Lịch sử hội thoại trong phiên làm việc.

#### Cài đặt — `/student/settings`

- Xem và cập nhật thông tin cá nhân.
- Đổi mật khẩu.

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
