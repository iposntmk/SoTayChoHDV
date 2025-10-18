import { Timestamp } from 'firebase/firestore'

// Provider types
export type ProviderKind = string

export interface UserInfo {
  uid: string
  displayName: string
  email?: string
}

export interface Provider {
  id?: string
  ownerId: string
  kind: ProviderKind
  name: string
  ownerName?: string
  phone?: string
  province: string
  address?: string
  mainImageUrl?: string
  images?: string[]
  notes?: string
  websiteUrl?: string
  googleMapsUrl?: string

  // Lodging specific
  roomTypes?: string[]
  pricePerNight?: number

  // F&B and Souvenir specific
  targetAudiences?: string[]
  commissionHint?: string

  // Metadata
  createdBy: UserInfo
  updatedBy: UserInfo
  createdAt: Timestamp
  updatedAt: Timestamp
  isApproved: boolean
}

// Master data types
export interface MasterProvince {
  id?: string
  name: string
  code?: string
}

export interface MasterProviderType {
  id?: string
  name: string
  description?: string | null
}

export interface MasterRoomType {
  id?: string
  key: string
  label: string
}

// Filter types
export interface ProviderFilters {
  kind?: ProviderKind
  province?: string
  priceRange?: 'low' | 'medium' | 'high'
  targetAudience?: string
  searchQuery?: string
}

// Tourism News/Stats
export interface TourismNews {
  id?: string
  title: string
  description?: string
  period: string // e.g., "2024", "Q1 2025", "Jan 2025"
  visitors?: number // số lượng khách
  growth?: number // tăng trưởng % (có thể âm)
  sourceUrl?: string
  imageUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
}

// User Stats
export interface UserStats {
  uid: string
  displayName: string
  email?: string
  photoURL?: string
  providerCount: number
  joinedAt: Timestamp
  lastActive?: Timestamp
}

// Guide Profile
export interface GuideProfile {
  id?: string
  userId: string // Link to auth user
  fullName: string // Họ và tên
  email?: string | null // Email liên hệ
  phone?: string | null // Số điện thoại
  cardNumber: string // Số thẻ
  expiryDate: Timestamp // Ngày hết hạn
  issuingPlace: string // Nơi cấp thẻ
  cardType: 'domestic' | 'international' // Loại thẻ: Nội địa/Quốc tế
  languages?: string[] | null // Ngoại ngữ sử dụng
  lastExpiryNotificationAt?: Timestamp | null
  experienceYears: number // Kinh nghiệm (số năm)
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: UserInfo
  updatedBy: UserInfo
}

export interface HueGuideArticle {
  title: string
  url: string
  summary?: string
  publishedAt?: string
  imageUrl?: string | null
}
