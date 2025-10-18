/**
 * Service to fetch guide information from huongdanvien.vn
 * This service uses a CORS proxy to fetch data from the external website
 */

export interface GuideInfo {
  fullName: string
  email?: string
  cardNumber: string
  expiryDate: string // Format: DD/MM/YYYY
  issuingPlace: string
  cardType: 'domestic' | 'international'
  experienceYears: number
  languages: string[]
}

/**
 * Search for guide information by card number
 * Note: This function requires a CORS proxy or backend service to work
 * For now, it uses allorigins.win as a proxy
 */
export async function searchGuideByCardNumber(cardNumber: string): Promise<GuideInfo | null> {
  try {
    if (!cardNumber || cardNumber.trim().length === 0) {
      return null
    }

    // Clean the card number
    const cleanCardNumber = cardNumber.trim()
    const numericCardNumber = cleanCardNumber.replace(/\D+/g, '')

    // Use a CORS proxy to fetch the data
    const url = new URL('https://huongdanvien.vn/index.php/guide/cat/05')
    url.searchParams.set('tinh', '')
    url.searchParams.set('loaithe', '')
    url.searchParams.set('ngoaingu', '')
    url.searchParams.set('name', '')
    url.searchParams.set('sothe', numericCardNumber || cleanCardNumber)
    const targetUrl = url.toString()
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`

    const response = await fetch(proxyUrl)
    if (!response.ok) {
      console.error('Failed to fetch guide info:', response.statusText)
      return null
    }

    const data = await response.json()
    const html = data.contents

    // Parse the HTML to extract guide information
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Try to find the guide card in the results
    // The exact selectors may need adjustment based on the actual HTML structure
    const guideCards = doc.querySelectorAll('.guide-card, .guide-item, .result-item, [class*="guide"]')

    if (guideCards.length === 0) {
      // Try alternative approach - look for the card number in the page
      const bodyText = doc.body.textContent || ''
      if (!bodyText.includes(cleanCardNumber)) {
        return null // No results found
      }
    }

    // Extract information from the first result
    // Note: These selectors are estimates and may need adjustment
    let fullName = ''
    let expiryDate = ''
    let issuingPlace = ''
    let cardType: 'domestic' | 'international' = 'domestic'
    let experienceYears = 0

    const allText = doc.body.textContent || ''
    const clean = (value: string | null | undefined) =>
      (value || '').replace(/\s+/g, ' ').trim()

    const detailMap = new Map<string, string>()
    const tableRows = Array.from(doc.querySelectorAll('tr'))

    tableRows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td'))
      if (cells.length < 2) return

      const label = clean(cells[0].textContent)
      const value = clean(cells[1].textContent)

      if (!label || !value) return
      if (!label.endsWith(':')) return

      detailMap.set(label.slice(0, -1), value)
    })

    fullName = detailMap.get('Họ và tên') || ''
    const matchedCardNumber = detailMap.get('Số thẻ')?.replace(/\D+/g, '') || ''
    issuingPlace = detailMap.get('Nơi cấp thẻ') || ''
    expiryDate = detailMap.get('Ngày hết hạn') || ''
    const cardTypeLabel = detailMap.get('Loại thẻ') || ''
    const experienceLabel = detailMap.get('Kinh nghiệm đến ngày cấp thẻ') || ''
    const languagesLabel = detailMap.get('Ngoại ngữ') || ''

    if (!cardTypeLabel) {
      if (allText.includes('Nội địa') || allText.includes('nội địa')) {
        cardType = 'domestic'
      } else if (allText.includes('Quốc tế') || allText.includes('quốc tế')) {
        cardType = 'international'
      }
    } else if (/quốc tế/i.test(cardTypeLabel)) {
      cardType = 'international'
    } else {
      cardType = 'domestic'
    }

    const experienceMatch = experienceLabel.match(/(\d+)/)
    if (experienceMatch) {
      experienceYears = parseInt(experienceMatch[1], 10)
    } else {
      const expPattern = /(\d+)\s*năm/i
      const expMatch = allText.match(expPattern)
      if (expMatch) {
        experienceYears = parseInt(expMatch[1], 10)
      }
    }

    const languages = languagesLabel
      ? languagesLabel
          .split(/[,;]+/)
          .map((lang) => lang.trim())
          .filter(Boolean)
      : []

    if (!expiryDate) {
      const datePattern = /(\d{2}\/\d{2}\/\d{4})/
      const dateMatch = allText.match(datePattern)
      if (dateMatch) {
        expiryDate = dateMatch[1]
      }
    }

    if (!issuingPlace) {
      const placePattern = /(Thành phố|Tỉnh)\s+[^\n]+/i
      const placeMatch = allText.match(placePattern)
      if (placeMatch) {
        issuingPlace = clean(placeMatch[0])
      }
    }

    if (!fullName) {
      const nameElements = doc.querySelectorAll('[class*="name"], h3, h4, .title, strong, b')
      for (const el of nameElements) {
        const text = clean(el.textContent)
        if (
          text &&
          text.length > 5 &&
          text === text.toUpperCase() &&
          /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/.test(text)
        ) {
          fullName = text
          break
        }
      }
    }

    if (
      matchedCardNumber &&
      matchedCardNumber.length > 0 &&
      matchedCardNumber !== (numericCardNumber || cleanCardNumber.replace(/\D+/g, ''))
    ) {
      return null
    }

    // If we found at least the name and card type, return the data
    if (fullName) {
      return {
        fullName,
        cardNumber: matchedCardNumber || cleanCardNumber,
        expiryDate,
        issuingPlace,
        cardType,
        experienceYears,
        languages,
      }
    }

    return null
  } catch (error) {
    console.error('Error searching guide info:', error)
    return null
  }
}

/**
 * Parse date string from DD/MM/YYYY to Date object
 */
export function parseVietnameseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  const parts = dateStr.split('/')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  return new Date(year, month, day)
}

/**
 * Convert Date to YYYY-MM-DD format for input[type="date"]
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
