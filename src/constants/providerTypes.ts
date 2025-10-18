export interface ProviderTypeOption {
  value: string
  label: string
}

export const DEFAULT_PROVIDER_TYPES: ProviderTypeOption[] = [
  { value: 'lodging', label: 'Nhà nghỉ' },
  { value: 'fnb', label: 'F&B' },
  { value: 'souvenir', label: 'Lưu niệm' },
]
