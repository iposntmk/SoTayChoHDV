# Hướng dẫn Setup và Deploy

## 🚀 Bước 1: Setup GitHub Pages

### 1.1. Bật GitHub Pages
1. Vào repository: https://github.com/iposntmk/SoTayChoHDV
2. Click **Settings** → **Pages**
3. Tại **Source**, chọn: **GitHub Actions**

### 1.2. Thêm Secrets cho GitHub Actions
1. Vào **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** và thêm từng secret sau:

| Secret Name | Value |
|------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDYG4cIO9xQfALP52XTTe8E9NdFRdnVd0A` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pivotal-pursuit-464813-v1.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `pivotal-pursuit-464813-v1` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pivotal-pursuit-464813-v1.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `114858153501` |
| `VITE_FIREBASE_APP_ID` | `1:114858153501:web:e8b33b40d607e3b06158f4` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-JWKTC5JJYQ` |

### 1.3. Trigger Deploy
Push code đã được commit, workflow sẽ tự động chạy. Kiểm tra tại:
- **Actions tab** trong repo
- Sau khi workflow xong, website sẽ live tại: https://iposntmk.github.io/SoTayChoHDV/

---

## 🔥 Bước 2: Deploy Firebase Rules

### 2.1. Cài Firebase CLI
```bash
npm install -g firebase-tools
```

### 2.2. Login Firebase
```bash
firebase login
```

### 2.3. Init Firebase Project
```bash
firebase init
```

Chọn:
- ✅ Firestore
- ✅ Storage
- Chọn existing project: **pivotal-pursuit-464813-v1**
- Firestore rules: `firestore.rules` (đã có sẵn)
- Storage rules: `storage.rules` (đã có sẵn)

### 2.4. Deploy Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 👤 Bước 3: Setup Admin User

### 3.1. Tạo user đầu tiên
1. Truy cập website: https://iposntmk.github.io/SoTayChoHDV/
2. Click **Đăng nhập** → Đăng ký tài khoản mới hoặc dùng Google
3. Copy **UID** của user:
   - Vào [Firebase Console](https://console.firebase.google.com/)
   - Chọn project **pivotal-pursuit-464813-v1**
   - Authentication → Users → Copy UID của user bạn vừa tạo

### 3.2. Thêm vào admin_allowlist
1. Vào [Firestore Console](https://console.firebase.google.com/project/pivotal-pursuit-464813-v1/firestore)
2. Tạo collection mới: `admin_allowlist`
3. Thêm document:
   - Document ID: **UID đã copy ở bước 3.1**
   - Field: `active` (boolean) = `true`
4. Refresh website, bạn sẽ thấy menu "Master Data" xuất hiện

---

## 📝 Bước 4: Tạo Master Data

Sau khi có quyền admin, vào trang **Master Data** và tạo:

### 4.1. Provinces (Tỉnh/Thành)
Ví dụ:
- Thừa Thiên Huế
- Đà Nẵng
- Quảng Nam
- Hội An
- ...

### 4.2. Provider Kinds (đã có sẵn trong code)
- lodging: Nhà nghỉ
- fnb: F&B
- souvenir: Lưu niệm

### 4.3. Room Types (Loại phòng)
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
- [ ] Deploy Firebase Rules (firestore + storage)
- [ ] Tạo user đầu tiên
- [ ] Thêm UID vào `admin_allowlist`
- [ ] Tạo master data (provinces, room types)

---

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:5173/
```

### Build Local
```bash
npm run build
npm run preview
```

---

## 🐛 Troubleshooting

### 1. Workflow build failed
- Kiểm tra đã thêm đủ 7 secrets chưa
- Xem logs trong Actions tab

### 2. Website 404 sau deploy
- Đợi 2-3 phút để GitHub Pages propagate
- Kiểm tra Settings → Pages có base URL đúng không

### 3. Firebase rules permission denied
- Chắc chắn đã deploy rules: `firebase deploy --only firestore:rules,storage:rules`
- Kiểm tra trong Firebase Console → Firestore/Storage → Rules tab

### 4. Không thấy menu Master Data
- Kiểm tra UID đã add vào `admin_allowlist` chưa
- Field `active` phải là `true`
- Refresh lại trang
