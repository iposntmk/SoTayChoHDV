# Sổ Tay Cho Hướng Dẫn Viên

Ứng dụng quản lý nhà cung cấp dịch vụ du lịch (Nhà nghỉ, F&B, Lưu niệm) - Firebase client-only, deploy trên Vercel/Netlify.

## 🚀 Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **State**: Context API

## 📁 Cấu trúc Project

```
src/
├── components/       # Reusable components (Navbar, Layout, Loading, ProtectedRoute)
├── pages/           # Page components
│   ├── HomePage.tsx              # ✅ Public catalog với filters/search
│   ├── ProviderDetailPage.tsx   # ✅ Chi tiết nhà cung cấp
│   ├── LoginPage.tsx             # ✅ Đăng nhập (Email/Google)
│   ├── DashboardPage.tsx         # 🚧 Dashboard user (TODO)
│   ├── ProviderFormPage.tsx      # 🚧 Create/Edit provider (TODO)
│   └── MasterDataPage.tsx        # 🚧 Admin master data (TODO)
├── contexts/        # Auth context
├── hooks/           # Custom hooks (TODO)
├── lib/            # Firebase config
├── types/          # TypeScript types
└── utils/          # Utilities (formatUtils, imageUtils)
```

## ✨ Tính năng chính

### 🌐 Public Features (Không cần đăng nhập)
- **Catalog Page**: Xem danh sách nhà cung cấp với phân trang
- **Advanced Filters**: Lọc theo loại dịch vụ (Nhà nghỉ, F&B, Lưu niệm), tỉnh/thành
- **Search**: Tìm kiếm theo tên, địa chỉ, ghi chú
- **Detail View**: Xem chi tiết đầy đủ thông tin, gallery ảnh
- **Author Info**: Hiển thị người tạo và cập nhật lần cuối

### 🔐 User Features (Yêu cầu đăng nhập)
- **Authentication**: Đăng nhập bằng Email/Password hoặc Google
- **My Dashboard**: Quản lý danh sách bài đăng của mình
- **Create Provider**: Tạo nhà cung cấp mới với upload ảnh (resize tự động)
- **Edit/Delete**: Sửa/xóa bài đăng của mình
- **Form Validation**: Validate dữ liệu với React Hook Form

### 👑 Admin Features
- **Master Data Management**: Quản lý danh mục tỉnh/thành, loại phòng, loại nhà cung cấp, dòng khách
- **Admin Allowlist**: Phân quyền admin qua Firestore collection

### 🎨 UI/UX
- **Responsive Design**: Mobile-first, tương thích tất cả thiết bị
- **Modern UI**: TailwindCSS với Lucide Icons
- **Loading States**: Skeleton loading, spinners
- **Error Handling**: Toast notifications, validation errors

### 🔒 Security
- **Firestore Rules**: Chỉ owner mới sửa/xóa bài của mình
- **Storage Rules**: Validate image type (jpeg, png, webp) & size < 5MB
- **Protected Routes**: Guard admin và user routes

## ✅ Đã hoàn thành

1. **Project Setup** - Vite + React + TypeScript + TailwindCSS ✅
2. **Firebase Configuration** - Auth, Firestore, Storage ✅
3. **Security Rules** - `firestore.rules` & `storage.rules` ✅
4. **Authentication** - Email/Password + Google Sign-in ✅
5. **Public Catalog** - Hiển thị, lọc, tìm kiếm, phân trang nhà cung cấp ✅
6. **Detail Page** - Xem chi tiết đầy đủ thông tin ✅
7. **User Dashboard** - Quản lý bài của user (CRUD) ✅
8. **Provider Form** - Create/Edit với validation & image upload ✅
9. **Master Data** - Admin CRUD (provinces, room types, provider types, customer segments) ✅
10. **GitHub Actions** - Auto deploy workflow ✅
11. **Responsive UI** - Mobile-first design ✅

## 🚧 Cần làm để deploy

### 1. Deploy Firebase Rules

Cần deploy 2 files rules:

```bash
# Cài Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init project
firebase init

# Chọn:
# - Firestore
# - Storage
# - Chọn existing project: pivotal-pursuit-464813-v1

# Deploy
firebase deploy --only firestore:rules,storage:rules
```

### 2. Setup GitHub Secrets & Deploy

Làm theo file **SETUP.md** để:
- Bật GitHub Pages
- Thêm 7 secrets cho GitHub Actions
- Trigger workflow deploy

### 3. Setup Admin User

Sau khi có user đầu tiên, cần thêm vào `admin_allowlist`:

```javascript
// Trong Firebase Console > Firestore
// Tạo collection: admin_allowlist
// Tạo document với ID = uid của admin
// Field: active = true
```

## 📸 Screenshots & Demo

### Demo URL
🔗 **Live Demo**: https://iposntmk.github.io/SoTayChoHDV/

### Screenshots

#### Trang chủ - Public Catalog
- Danh sách nhà cung cấp với filters và search
- Phân trang, hiển thị thông tin tóm tắt
- Responsive layout cho mobile và desktop

#### Chi tiết nhà cung cấp
- Gallery ảnh với lightbox
- Thông tin đầy đủ: Liên hệ, địa chỉ, loại phòng, giá...
- Hiển thị người tạo và cập nhật lần cuối

#### My Dashboard
- Danh sách bài đăng của user
- Nút tạo mới, sửa, xóa
- Trạng thái duyệt (isApproved)

#### Provider Form
- Form tạo/sửa với validation
- Upload nhiều ảnh với preview
- Tự động resize ảnh trước khi upload

#### Master Data (Admin)
- Tab quản lý Tỉnh/Thành
- Tab quản lý Loại phòng
- Tab quản lý Loại nhà cung cấp (tên hiển thị)
- Tab quản lý Dòng khách (tên, đặc thù)
- CRUD operations với confirmation

> **Lưu ý**: Screenshots chi tiết có thể được thêm vào thư mục `/docs/screenshots/` sau khi deploy

## 📖 Hướng dẫn sử dụng

### Cho người dùng thông thường

#### 1. Xem danh sách nhà cung cấp
- Truy cập trang chủ để xem tất cả nhà cung cấp
- Sử dụng bộ lọc (Loại dịch vụ, Tỉnh/Thành) để thu hẹp kết quả
- Dùng ô tìm kiếm để tìm theo tên, địa chỉ, ghi chú
- Click vào thẻ nhà cung cấp để xem chi tiết

#### 2. Đăng ký và đăng nhập
- Click "Đăng nhập" ở góc trên phải
- Chọn "Đăng ký" để tạo tài khoản mới
- Hoặc đăng nhập nhanh bằng Google

#### 3. Quản lý nhà cung cấp của bạn
- Sau khi đăng nhập, vào "My Dashboard"
- Click "Tạo mới" để thêm nhà cung cấp
- Điền thông tin: Loại dịch vụ, Tên, Tỉnh/Thành, SĐT, Địa chỉ...
- Upload ảnh (tự động resize về 1200px, < 5MB)
- Click vào các card để sửa hoặc xóa

### Cho Admin

#### 1. Được cấp quyền Admin
- Yêu cầu admin hiện tại thêm UID của bạn vào collection `admin_allowlist`
- Refresh trang để thấy menu "Master Data"

#### 2. Quản lý Master Data
- Vào "Master Data" từ menu
- Tab "Tỉnh/Thành": Thêm/Sửa/Xóa các tỉnh thành
- Tab "Loại phòng": Quản lý các loại phòng (Đơn, Đôi, Suite...)
- Tab "Loại nhà cung cấp": Tùy chỉnh tên hiển thị cho từng loại hình dịch vụ
- Tab "Dòng khách": Ghi nhận nhóm khách (ví dụ: Khách Do Thái) và đặc thù phục vụ

## 🔧 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 🔔 Email nhắc nhở thẻ HDV

Cloud Function `notifyExpiringGuide` sẽ tự động gửi email khi thẻ HDV còn ≤30 ngày hết hạn.

1. Tạo tài khoản SendGrid (hoặc dịch vụ SMTP tương đương) và lấy API Key.
2. Cấu hình biến môi trường cho Firebase Functions:

   ```bash
   firebase functions:config:set sendgrid.api_key="<SENDGRID_API_KEY>" sendgrid.from_email="noreply@example.com"
   ```

3. Deploy functions:

   ```bash
   firebase deploy --only functions
   ```

## 🚀 Deploy lên GitHub Pages (Auto Deploy)

Website sẽ tự động deploy lên GitHub Pages thông qua GitHub Actions workflow khi push code lên branch `main`.

### Setup GitHub Pages

1. **Bật GitHub Pages trong repo settings**:
   - Vào repository → Settings → Pages
   - Source: chọn "GitHub Actions"

2. **Thêm Environment Secrets**:
   - Vào repository → Settings → Secrets and variables → Actions
   - Thêm 7 secrets sau (lấy từ Firebase Console → Project Settings):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`

3. **Workflow đã được cấu hình** tại `.github/workflows/deploy.yml`

4. **Trigger Deploy**:
   ```bash
   git push origin main
   ```

Website sẽ tự động build và deploy. Sau khi deploy xong, truy cập tại:
```
https://iposntmk.github.io/SoTayChoHDV/
```

### Cấu hình Vite cho GitHub Pages

File `vite.config.ts` đã được cấu hình với `base: '/SoTayChoHDV/'` để tương thích với GitHub Pages subdirectory.

## 📝 Firestore Data Model

### Collection: `providers`
```typescript
{
  ownerId: string              // uid của người tạo
  kind: 'lodging' | 'fnb' | 'souvenir'
  name: string
  ownerName?: string
  phone?: string
  province: string
  address?: string
  mainImageUrl?: string
  images?: string[]
  notes?: string

  // Lodging specific
  roomTypes?: string[]
  pricePerNight?: number

  // F&B & Souvenir specific
  targetAudiences?: string[]
  commissionHint?: string

  // Metadata
  createdBy: { uid, displayName, email? }
  updatedBy: { uid, displayName, email? }
  createdAt: Timestamp
  updatedAt: Timestamp
  isApproved: boolean
}
```

## 🔒 Security

- **Firestore Rules**: Chỉ owner mới sửa/xóa bài của mình
- **Storage Rules**: Validate image type & size < 5MB
- **Admin**: Dùng collection `admin_allowlist` để phân quyền

## 🎯 Checklist Acceptance

### Code Implementation
- [x] Public xem/lọc/tìm/phân trang
- [x] Hiển thị tác giả & cập nhật lần cuối
- [x] Xem chi tiết provider
- [x] Login với Email/Google
- [x] User tạo/sửa/xóa bài của mình
- [x] Upload ảnh với resize
- [x] Admin quản lý master data
- [x] GitHub Actions workflow

### Deployment (Làm theo SETUP.md)
- [ ] Deploy Firebase Rules
- [ ] Setup GitHub Secrets
- [ ] Deploy app lên GitHub Pages
- [ ] Tạo admin user đầu tiên
- [ ] Tạo master data

## 📚 Tài liệu tham khảo

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
