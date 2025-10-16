# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all TypeScript sources. Core areas: `components/` for reusable UI, `pages/` for routed views, `contexts/` for auth state, `lib/firebase.ts` for Firebase wiring, and `utils/` for format helpers. Collocate new hooks under `hooks/` and types under `types/`.
- Global styles live in `src/index.css` with Tailwind layers; tweak design tokens in `tailwind.config.js` and `postcss.config.js`.
- Client-only Firebase assets live at the repo root: update security logic in `firestore.rules` and `storage.rules`, and keep deployment metadata in `firebase.json`.

## Build, Test, and Development Commands
- `npm run dev` spins up the Vite dev server on localhost with hot reload.
- `npm run build` runs `tsc` for type-checking and produces the production bundle.
- `npm run preview` serves the built output locally to verify deploy artifacts.
- `npm run lint` executes ESLint across `ts`/`tsx` files; fix or justify all warnings before merging.

## Coding Style & Naming Conventions
- TypeScript + React functional components are the norm; prefer hooks over class lifecycles.
- Use 2-space indentation, single quotes, explicit return types for exported helpers, and keep components PascalCase (e.g., `ProviderFormPage`). Collocate module-specific styles or utilities next to their consumers.
- Import via the `@/` alias when reaching into `src/` (e.g., `@/utils/formatProvider.ts`), and group imports framework → internal modules → styles.

## Testing Guidelines

### Current State
The project does not yet ship automated tests. Testing is currently performed manually.

### Manual Testing Checklist

#### Authentication Flow
- [ ] Đăng ký tài khoản mới với email/password
- [ ] Đăng nhập với email/password
- [ ] Đăng nhập với Google
- [ ] Đăng xuất
- [ ] Refresh token khi expire

#### Public Catalog (Không cần login)
- [ ] Hiển thị danh sách nhà cung cấp
- [ ] Lọc theo loại dịch vụ (Lodging, F&B, Souvenir)
- [ ] Lọc theo tỉnh/thành
- [ ] Tìm kiếm theo tên, địa chỉ, ghi chú
- [ ] Phân trang (Previous/Next)
- [ ] Click vào card để xem chi tiết
- [ ] Hiển thị tác giả và thời gian cập nhật

#### Provider Detail Page
- [ ] Hiển thị đầy đủ thông tin
- [ ] Gallery ảnh với lightbox
- [ ] Thông tin liên hệ, địa chỉ
- [ ] Loại phòng và giá (cho Lodging)
- [ ] Đối tượng khách và hoa hồng (cho F&B/Souvenir)

#### User Dashboard (Cần login)
- [ ] Hiển thị danh sách bài của user
- [ ] Click "Tạo mới" để tạo provider
- [ ] Click vào card để sửa
- [ ] Xóa provider với confirmation
- [ ] Chỉ thấy bài của mình

#### Provider Form
- [ ] Chọn loại dịch vụ
- [ ] Nhập tên, tỉnh, SĐT, địa chỉ
- [ ] Upload ảnh chính
- [ ] Upload nhiều ảnh
- [ ] Preview ảnh
- [ ] Xóa ảnh đã upload
- [ ] Validation: Tên required, SĐT format
- [ ] Submit tạo mới
- [ ] Submit cập nhật

#### Image Upload
- [ ] Upload ảnh < 5MB
- [ ] Reject ảnh > 5MB
- [ ] Chỉ cho phép jpeg, png, webp
- [ ] Tự động resize về 1200px
- [ ] Progress indicator khi upload

#### Master Data (Cần quyền Admin)
- [ ] Tab Tỉnh/Thành: Hiển thị danh sách
- [ ] Thêm tỉnh/thành mới
- [ ] Sửa tên tỉnh/thành
- [ ] Xóa tỉnh/thành (với confirmation)
- [ ] Tab Loại phòng: CRUD tương tự
- [ ] Chỉ admin mới thấy menu

#### Responsive Design
- [ ] Mobile: Menu burger, stack layout
- [ ] Tablet: 2 columns grid
- [ ] Desktop: 3 columns grid
- [ ] Form inputs responsive
- [ ] Image gallery responsive

#### Security
- [ ] Firestore rules: Chỉ owner sửa/xóa bài
- [ ] Storage rules: Validate image type/size
- [ ] Protected routes: Redirect to login nếu chưa auth
- [ ] Admin routes: Chỉ admin access được

### Future: Automated Testing

When adding automated tests, follow these guidelines:

#### Setup Testing Framework
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

#### Test Structure
- Write component and hook tests with [React Testing Library](https://testing-library.com/) and Vitest
- Place specs beside the implementation as `*.test.tsx` or in `__tests__/` folder
- Use `describe` blocks to group related tests
- Follow AAA pattern: Arrange, Act, Assert

#### Firebase Mocking
- Validate Firebase interactions with mocked services
- Avoid hitting live Firestore in unit tests
- Use `vitest.mock()` to mock Firebase modules
- Example:
```typescript
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: mockFirestore,
  storage: mockStorage,
}));
```

#### Test Coverage Goals
- Components: 80%+ coverage
- Utils/Helpers: 90%+ coverage
- Hooks: 80%+ coverage
- Critical paths: 100% coverage

#### Integration Tests
- Test complete user flows (login → create → edit → delete)
- Use Firebase Emulator Suite for integration tests
- Test admin flows separately from user flows

#### E2E Tests (Future)
- Consider Playwright or Cypress for E2E testing
- Test complete workflows across pages
- Test on multiple browsers and devices

## Commit & Pull Request Guidelines
- Follow the existing imperative, sentence-case style (`Add detailed setup guide`). Scope one change per commit, include rationale in the body when behaviour shifts, and reference Jira/GitHub issues as `#123`.
- PRs should describe user impact, outline test evidence (manual or automated), and include screenshots/GIFs for UI updates. Confirm CI lint/build passes before requesting review.

## Security & Configuration Tips
- Treat `.env` values as sensitive; rely on the GitHub Actions secrets listed in `SETUP.md` and never hardcode Firebase keys outside `lib/firebase.ts`.
- After rule updates, run `firebase deploy --only firestore:rules,storage:rules` to propagate changes, and coordinate admin allowlist edits with the operations team.
