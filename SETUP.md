# Hướng dẫn Setup và Deploy

## 🚀 Bước 1: Setup GitHub Pages

### 1.1. Bật GitHub Pages
1. Vào repository: https://github.com/iposntmk/SoTayChoHDV
2. Click **Settings** → **Pages**
3. Tại **Source**, chọn: **GitHub Actions**

### 1.2. Thêm Secrets cho GitHub Actions
1. Vào **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** và thêm 7 secrets sau:

**Lấy values từ**: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

| Secret Name |
|------------|
| `VITE_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` |

### 1.3. Trigger Deploy
Push code đã được commit, workflow sẽ tự động chạy. Kiểm tra tại:
- **Actions tab** trong repo
- Sau khi workflow xong, website sẽ live tại: https://iposntmk.github.io/SoTayChoHDV/

---

## 🔥 Bước 2: Enable Firebase Authentication

### 2.1. Enable Sign-in Methods
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project **pivotal-pursuit-464813-v1** (hoặc project của bạn)
3. Click **Authentication** → Tab **Sign-in method**

### 2.2. Enable Google Sign-in
1. Tìm **Google** trong danh sách providers
2. Click vào **Google**
3. Toggle **Enable**
4. Chọn **Project support email** (email của bạn)
5. Click **Save**

### 2.3. Enable Email/Password
1. Ở cùng trang **Sign-in method**
2. Tìm **Email/Password**
3. Click vào **Email/Password**
4. Toggle **Enable**
5. Click **Save**

> **Lưu ý**: Nếu không enable các sign-in methods, bạn sẽ gặp lỗi `auth/operation-not-allowed` khi đăng nhập.

---

## 🔥 Bước 3: Deploy Firebase Rules

### 3.1. Cài Firebase CLI
```bash
npm install -g firebase-tools
```

### 3.2. Login Firebase
```bash
firebase login
```

### 3.3. Init Firebase Project
```bash
firebase init
```

Chọn:
- ✅ Firestore
- ✅ Storage
- Chọn existing project: **pivotal-pursuit-464813-v1**
- Firestore rules: `firestore.rules` (đã có sẵn)
- Storage rules: `storage.rules` (đã có sẵn)

### 3.4. Deploy Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 👤 Bước 4: Setup Admin User

### 4.1. Tạo user đầu tiên
1. Truy cập website: https://iposntmk.github.io/SoTayChoHDV/
2. Click **Đăng nhập** → Đăng ký tài khoản mới hoặc dùng Google
3. Copy **UID** của user:
   - Vào [Firebase Console](https://console.firebase.google.com/)
   - Chọn project **pivotal-pursuit-464813-v1**
   - Authentication → Users → Copy UID của user bạn vừa tạo

### 4.2. Thêm vào admin_allowlist
1. Vào [Firestore Console](https://console.firebase.google.com/project/pivotal-pursuit-464813-v1/firestore)
2. Tạo collection mới: `admin_allowlist`
3. Thêm document:
   - Document ID: **UID đã copy ở bước 4.1**
   - Field: `active` (boolean) = `true`
4. Refresh website, bạn sẽ thấy menu "Master Data" xuất hiện

---

## 📝 Bước 5: Tạo Master Data

Sau khi có quyền admin, vào trang **Master Data** và tạo:

### 5.1. Provinces (Tỉnh/Thành)
Ví dụ:
- Thừa Thiên Huế
- Đà Nẵng
- Quảng Nam
- Hội An
- ...

### 5.2. Provider Kinds (đã có sẵn trong code)
- lodging: Nhà nghỉ
- fnb: F&B
- souvenir: Lưu niệm

### 5.3. Room Types (Loại phòng)
Ví dụ:
- Đơn
- Đôi
- Ghép
- Suite
- ...

---

## ✅ Checklist Setup

- [ ] Bật GitHub Pages (Source: GitHub Actions)
- [ ] Thêm 7 secrets vào GitHub Actions
- [ ] Kiểm tra workflow chạy thành công (Actions tab)
- [ ] Truy cập được website: https://iposntmk.github.io/SoTayChoHDV/
- [ ] Enable Firebase Authentication (Email/Password + Google)
- [ ] Deploy Firebase Rules (firestore + storage)
- [ ] Tạo user đầu tiên
- [ ] Thêm UID vào `admin_allowlist`
- [ ] Tạo master data (provinces, room types)

---

## 🔧 Development

### Local Development

#### 1. Clone repository
```bash
git clone https://github.com/iposntmk/SoTayChoHDV.git
cd SoTayChoHDV
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Setup Environment Variables
Tạo file `.env.local` tại root của project với nội dung:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

**Lấy values từ**: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

> **Lưu ý**: File `.env.local` đã được thêm vào `.gitignore`, không commit lên repository

#### 4. Run dev server
```bash
npm run dev
# Open http://localhost:5173/
```

### Build Local
```bash
npm run build
npm run preview
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key cho web app | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domain cho Firebase Authentication | `project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project-123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket URL | `project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID cho FCM | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | `G-XXXXXXXXXX` |

> **Security Note**: Các Firebase config trên là client-side keys, an toàn để public. Security được đảm bảo bằng Firestore Rules và Storage Rules.

---

## 🐛 Troubleshooting

### 1. Workflow build failed
- Kiểm tra đã thêm đủ 7 secrets chưa
- Xem logs trong Actions tab

### 2. Website 404 sau deploy
- Đợi 2-3 phút để GitHub Pages propagate
- Kiểm tra Settings → Pages có base URL đúng không

### 3. Lỗi `auth/operation-not-allowed` khi đăng nhập
- Chắc chắn đã enable Email/Password và Google trong Firebase Authentication
- Vào Firebase Console → Authentication → Sign-in method
- Enable Email/Password và Google provider

### 4. Firebase rules permission denied
- Chắc chắn đã deploy rules: `firebase deploy --only firestore:rules,storage:rules`
- Kiểm tra trong Firebase Console → Firestore/Storage → Rules tab

### 5. Không thấy menu Master Data
- Kiểm tra UID đã add vào `admin_allowlist` chưa
- Field `active` phải là `true`
- Refresh lại trang
