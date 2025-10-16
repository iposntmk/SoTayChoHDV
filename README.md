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

1. **Project Setup** - Vite + React + TypeScript + TailwindCSS
2. **Firebase Configuration** - Auth, Firestore, Storage
3. **Security Rules** - `firestore.rules` & `storage.rules`
4. **Authentication** - Email/Password + Google Sign-in
5. **Public Catalog** - Hiển thị, lọc, tìm kiếm, phân trang nhà cung cấp
6. **Detail Page** - Xem chi tiết đầy đủ thông tin
7. **Responsive UI** - Mobile-first design

## 🚧 Cần hoàn thiện

### 1. Dashboard (User)
**File**: `src/pages/DashboardPage.tsx`

Cần implement:
- Lấy danh sách providers của user hiện tại
- Filter theo loại (lodging/fnb/souvenir)
- Nút "Tạo mới" → `/dashboard/new`
- Nút "Sửa" → `/dashboard/edit/:id`
- Nút "Xóa" với confirmation

```typescript
// Query example:
const q = query(
  collection(db, 'providers'),
  where('ownerId', '==', user.uid),
  orderBy('updatedAt', 'desc')
)
```

### 2. Provider Form (Create/Edit)
**File**: `src/pages/ProviderFormPage.tsx`

Cần implement:
- Form với React Hook Form
- Validation theo loại provider
- Upload ảnh lên Storage với resize (dùng `imageUtils.ts`)
- Create: set `ownerId`, `createdBy`, `updatedBy`, `isApproved = true`
- Update: chỉ update nếu `ownerId === user.uid`

**Flow upload ảnh**:
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { resizeImage, generateImageFilename } from '@/utils/imageUtils'

// 1. Resize ảnh
const resized = await resizeImage(file, 1200, 1200, 0.85)

// 2. Upload
const filename = generateImageFilename(file.name)
const storageRef = ref(storage, `provider-images/${providerId}/${filename}`)
await uploadBytes(storageRef, resized)

// 3. Get URL
const url = await getDownloadURL(storageRef)
```

### 3. Master Data Management (Admin)
**File**: `src/pages/MasterDataPage.tsx`

Cần implement CRUD cho 3 collections:
- `master_provinces` - Tỉnh/Thành
- `master_provider_kinds` - Loại nhà cung cấp (fixed: lodging/fnb/souvenir)
- `master_room_types` - Loại phòng

**Kiểm tra admin**:
```typescript
const { isAdmin } = useAuth() // Đã có sẵn trong AuthContext
```

### 4. Deploy Firebase Rules

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

### 5. Setup Admin User

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

## 🚀 Deploy lên Vercel/Netlify

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Environment Variables** (Vercel/Netlify):
```
VITE_FIREBASE_API_KEY=AIzaSyDYG4cIO9xQfALP52XTTe8E9NdFRdnVd0A
VITE_FIREBASE_AUTH_DOMAIN=pivotal-pursuit-464813-v1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pivotal-pursuit-464813-v1
VITE_FIREBASE_STORAGE_BUCKET=pivotal-pursuit-464813-v1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=114858153501
VITE_FIREBASE_APP_ID=1:114858153501:web:e8b33b40d607e3b06158f4
VITE_FIREBASE_MEASUREMENT_ID=G-JWKTC5JJYQ
```

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

- [x] Public xem/lọc/tìm/phân trang
- [x] Hiển thị tác giả & cập nhật lần cuối
- [x] Xem chi tiết provider
- [x] Login với Email/Google
- [ ] User tạo/sửa/xóa bài của mình
- [ ] Upload ảnh hoạt động
- [ ] Admin quản lý master data
- [ ] Deploy Firebase Rules
- [ ] Deploy app lên Vercel/Netlify

## 📚 Tài liệu tham khảo

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
