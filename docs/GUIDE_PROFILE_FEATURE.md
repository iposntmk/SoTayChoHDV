# Guide Profile Feature

## Overview

The Guide Profile feature allows tour guides to manage their professional credentials and certification information. The system includes:

- Personal guide profile management
- Public directory of all guides
- Expiry date tracking and warnings
- Automated notification system for expiring cards

## Features

### 1. My Guide Profile (`/my-guide-profile`)

**Protected Route** - Requires authentication

Allows logged-in users to:
- Create and edit their tour guide profile
- Manage credential information including:
  - Full Name (Họ và tên)
  - Card Number (Số thẻ)
  - Expiry Date (Ngày hết hạn)
  - Issuing Place (Nơi cấp thẻ) - **Uses Combobox with data from master_provinces**
  - Card Type (Loại thẻ): Domestic (Nội địa) or International (Quốc tế)
  - Experience Years (Kinh nghiệm)
- View expiry warnings (when card expires within 30 days)
- Track creation and update history

**UI Features:**
- Visual differentiation between domestic and international cards
- Expiry warning banner when card expires within 30 days
- Edit/View mode toggle
- Form validation
- Searchable province dropdown (Combobox component)

**Location:** `src/pages/GuideProfilePage.tsx`

**Dependencies:**
- `src/hooks/useProvinces.ts` - Fetches province list from master_provinces
- `src/components/Combobox.tsx` - Searchable dropdown component

### 2. Guides Directory (`/guides`)

**Public Route** - No authentication required

Public listing of all tour guides with:
- Search functionality (by name, card number, or issuing place)
- Filter by card type (All, Domestic, International)
- Visual card-based layout
- Color-coded cards:
  - Green gradient: Domestic cards
  - Purple gradient: International cards
- Expiry status indicators:
  - Red badge: Expired
  - Amber badge: Expiring within 30 days
- Experience years display

**Location:** `src/pages/GuidesListPage.tsx`

### 3. Navigation Menu

Added two new menu items:
- **"Guides"** - Public link to guides directory (visible to all users)
- **"Hồ sơ HDV"** - Link to personal profile (visible only to authenticated users)

**Location:** `src/components/Navbar.tsx`

## Data Model

### GuideProfile Type

```typescript
export interface GuideProfile {
  id?: string
  userId: string // Link to auth user
  fullName: string // Họ và tên
  email?: string // Email liên hệ
  cardNumber: string // Số thẻ
  expiryDate: Timestamp // Ngày hết hạn
  issuingPlace: string // Nơi cấp thẻ
  cardType: 'domestic' | 'international' // Loại thẻ
  experienceYears: number // Kinh nghiệm (số năm)
  languages?: string[] | null // Ngoại ngữ sử dụng
  lastExpiryNotificationAt?: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: UserInfo
  updatedBy: UserInfo
}
```

**Location:** `src/types/index.ts`

## Firestore Security Rules

Collection: `guide_profiles`

**Permissions:**
- **Read:** Public (anyone can view all guide profiles)
- **Create:** Authenticated users can create their own profile
- **Update:** Users can only update their own profile
- **Delete:** Users can only delete their own profile

**Rules enforce:**
- User can only create/update their own profile (`userId == request.auth.uid`)
- Proper timestamp handling (`createdAt`, `updatedAt`)
- User info consistency (`createdBy`, `updatedBy`)

**Location:** `firestore.rules` (lines 71-93)

## Notification System

### Expiry Email Cloud Function

**Location:** `functions/index.js`

**Purpose:** Automatically email guides when their card will expire within the next 30 days.

**Behavior:**
- Triggered every time a `guide_profiles/{uid}` document is created or updated.
- Uses SendGrid to email the guide’s registered email address when `expiryDate` is between 0 and 30 days in the future.
- Debounces notifications with `lastExpiryNotificationAt` so the same guide receives at most one reminder every 24 hours.
- Persists `lastExpiryNotificationAt` back to Firestore for UI visibility.

**Configuration:**

```bash
firebase functions:config:set sendgrid.api_key="<YOUR_SENDGRID_API_KEY>" sendgrid.from_email="noreply@example.com"
firebase deploy --only functions
```

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/guides` | Public | Directory of all tour guides |
| `/my-guide-profile` | Protected | Personal guide profile management |

## UI Components

### GuideProfilePage
- Header with gradient background
- Expiry warning banner (30-day threshold)
- Edit/View mode toggle
- Form with validation (name, email, card number, expiry date, issuing place, card type, experience)
- Responsive grid layout for viewing

### GuidesListPage
- Search and filter controls
- Card grid layout (responsive: 1-3 columns)
- Color-coded cards by type
- Expiry status badges
- Avatar initials

## Testing Checklist

- [ ] Create a new guide profile
- [ ] Edit existing guide profile
- [ ] View guide profile (display mode)
- [ ] Search guides by name
- [ ] Search guides by card number
- [ ] Filter by card type (domestic/international)
- [ ] Test with card expiring in 30 days (warning should show)
- [ ] Test with expired card (error badge should show)
- [ ] Run expiry checker script
- [ ] Deploy Firestore rules
- [ ] Test security: user A cannot edit user B's profile
- [ ] Test navigation menu links

## Deployment Steps

1. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy the Application:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. **Setup Notification Cron Job:**
   - Option A: Cloud Scheduler + Cloud Functions
   - Option B: Server cron job
   - Option C: GitHub Actions scheduled workflow

4. **Configure Email Service:**
   - Choose email provider
   - Configure credentials
   - Update notification script
   - Test email delivery

## Future Enhancements

- [ ] Upload guide photo/avatar
- [ ] Add certifications and specializations
- [ ] Language proficiency indicators
- [ ] Rating and review system
- [ ] Availability calendar
- [ ] Booking integration
- [ ] Export guide profile as PDF
- [ ] Admin approval workflow for new guide profiles
- [ ] SMS notifications in addition to email
- [ ] Guide profile analytics (views, contact requests)
