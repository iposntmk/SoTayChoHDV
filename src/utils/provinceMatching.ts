import { ProvinceOption } from '@/hooks/useProvinces'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .trim()

const stripPrefixes = (normalizedValue: string) =>
  normalizedValue.replace(/^(tinh|thanh pho)\s+/, '').trim()

export function resolveProvinceName(raw: string, provinces: ProvinceOption[]): string {
  if (!raw) return ''
  if (provinces.length === 0) return raw.trim()

  const normalizedRaw = normalize(raw)
  let candidate = stripPrefixes(normalizedRaw)

  candidate = candidate.split(/[-,()]/)[0].trim()

  const normalizedProvinces = provinces.map((province) => ({
    value: province.value,
    normalized: normalize(province.value),
  }))

  const exactMatch = normalizedProvinces.find((item) => item.normalized === candidate)
  if (exactMatch) return exactMatch.value

  const partialMatch = normalizedProvinces.find(
    (item) => item.normalized.includes(candidate) || candidate.includes(item.normalized)
  )
  if (partialMatch) return partialMatch.value

  const words = candidate.split(/\s+/).filter(Boolean)
  for (let length = Math.min(2, words.length); length >= 1; length -= 1) {
    const slice = words.slice(-length).join(' ')
    const match = normalizedProvinces.find((item) => item.normalized === slice)
    if (match) return match.value
  }

  return raw.trim()
}
