import { Timestamp } from 'firebase/firestore'

/**
 * Format Firestore Timestamp to Vietnamese date format
 */
export function formatDate(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format price to Vietnamese currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

/**
 * Get display name from user info
 */
export function getDisplayName(
  displayName?: string,
  email?: string
): string {
  if (displayName) return displayName
  if (email) {
    // Return first part of email
    return email.split('@')[0]
  }
  return 'Người dùng'
}
