import { Timestamp } from 'firebase/firestore'

// Provider types
export type ProviderKind = 'lodging' | 'fnb' | 'souvenir'

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

export interface MasterProviderKind {
  id?: string
  key: ProviderKind
  label: string
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
