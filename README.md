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

## ✅ Đã hoàn thành

1. **Project Setup** - Vite + React + TypeScript + TailwindCSS ✅
2. **Firebase Configuration** - Auth, Firestore, Storage ✅
3. **Security Rules** - `firestore.rules` & `storage.rules` ✅
4. **Authentication** - Email/Password + Google Sign-in ✅
5. **Public Catalog** - Hiển thị, lọc, tìm kiếm, phân trang nhà cung cấp ✅
6. **Detail Page** - Xem chi tiết đầy đủ thông tin ✅
7. **User Dashboard** - Quản lý bài của user (CRUD) ✅
8. **Provider Form** - Create/Edit với validation & image upload ✅
9. **Master Data** - Admin CRUD (provinces, room types) ✅
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

## 🚀 Deploy lên GitHub Pages (Auto Deploy)

Website sẽ tự động deploy lên GitHub Pages thông qua GitHub Actions workflow khi push code lên branch `main`.

### Setup GitHub Pages

1. **Bật GitHub Pages trong repo settings**:
   - Vào repository → Settings → Pages
   - Source: chọn "GitHub Actions"

2. **Thêm Environment Secrets**:
   - Vào repository → Settings → Secrets and variables → Actions
   - Thêm các secrets sau (dùng cho build):
     - `VITE_FIREBASE_API_KEY`: `AIzaSyDYG4cIO9xQfALP52XTTe8E9NdFRdnVd0A`
     - `VITE_FIREBASE_AUTH_DOMAIN`: `pivotal-pursuit-464813-v1.firebaseapp.com`
     - `VITE_FIREBASE_PROJECT_ID`: `pivotal-pursuit-464813-v1`
     - `VITE_FIREBASE_STORAGE_BUCKET`: `pivotal-pursuit-464813-v1.firebasestorage.app`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `114858153501`
     - `VITE_FIREBASE_APP_ID`: `1:114858153501:web:e8b33b40d607e3b06158f4`
     - `VITE_FIREBASE_MEASUREMENT_ID`: `G-JWKTC5JJYQ`

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
