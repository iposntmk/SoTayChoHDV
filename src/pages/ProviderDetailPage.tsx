import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Provider } from '@/types'
import { formatDate, formatPrice, getDisplayName } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import {
  Hotel, UtensilsCrossed, Gift, User, Phone, Home, Globe,
  Map, BedDouble, DollarSign, Users, Percent, FileText,
  Share2, Copy, Check, MapPin, Building2
} from 'lucide-react'
import { useProviderTypes } from '@/hooks/useProviderTypes'

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { providerTypeMap } = useProviderTypes()

  useEffect(() => {
    loadProvider()
  }, [id])

  const loadProvider = async () => {
    if (!id) return

    try {
      const docRef = doc(db, 'providers', id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setProvider({ id: docSnap.id, ...docSnap.data() } as Provider)
      } else {
        setError('Không tìm thấy nhà cung cấp')
      }
    } catch (err) {
      console.error('Error loading provider:', err)
      setError('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const getKindLabel = (kind: string | undefined) => {
    if (!kind) return 'Không xác định'
    return providerTypeMap[kind]?.label || kind
  }

  const getKindIcon = (kind: string | undefined) => {
    if (kind === 'lodging') return Hotel
    if (kind === 'fnb') return UtensilsCrossed
    if (kind === 'souvenir') return Gift
    return Building2
  }

  const getKindColor = (kind: string | undefined) => {
    if (kind === 'lodging') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (kind === 'fnb') return 'bg-orange-100 text-orange-800 border-orange-200'
    if (kind === 'souvenir') return 'bg-purple-100 text-purple-800 border-purple-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getKindAccent = (kind: string | undefined) => {
    if (kind === 'lodging') return '#3b82f6'
    if (kind === 'fnb') return '#f97316'
    if (kind === 'souvenir') return '#a855f7'
    return '#9ca3af'
  }

  const buildShareContent = (currentProvider: Provider) => {
    const shareUrl =
      currentProvider.id && typeof window !== 'undefined'
        ? `${window.location.origin}/share/provider/${currentProvider.id}`
        : window.location.href
    const details: string[] = [
      shareUrl,
      '',
      currentProvider.name,
      `${getKindLabel(currentProvider.kind)} • ${currentProvider.province}`,
    ]

    if (currentProvider.phone) {
      details.push(`Liên hệ: ${currentProvider.phone}`)
    }
    if (currentProvider.address) {
      details.push(`Địa chỉ: ${currentProvider.address}`)
    }
    if (currentProvider.mainImageUrl) {
      details.push(`Ảnh: ${currentProvider.mainImageUrl}`)
    }

    return {
      url: shareUrl,
      message: details.join('\n'),
    }
  }

  const copyShareContent = async (currentProvider: Provider) => {
    const { url, message } = buildShareContent(currentProvider)
    let success = false

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message)
        success = true
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = message
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const copied = document.execCommand('copy')
        document.body.removeChild(textArea)
        success = copied
        if (!copied) {
          throw new Error('execCommand copy failed')
        }
      }
    } catch (error) {
      console.error('Failed to copy share content:', error)
      alert(message)
    }

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return { success, url, message }
  }

  const handleCopyLink = async () => {
    if (!provider) return
    await copyShareContent(provider)
  }

  const handleShareZalo = async () => {
    if (!provider) return
    const { url, message } = buildShareContent(provider)

    if (navigator.share) {
      try {
        await navigator.share({
          title: provider.name,
          text: message,
          url,
        })
        return
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return
        }
        console.warn('navigator.share failed, falling back to Zalo share link', error)
      }
    }

    const { message: copiedMessage } = await copyShareContent(provider)

    const zaloUrl = `https://zalo.me/share/text?message=${encodeURIComponent(copiedMessage)}`

    window.open(zaloUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <Loading />

  if (error || !provider) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Không tìm thấy'}</p>
            <Link to="/" className="text-blue-600 hover:underline">
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const KindIcon = getKindIcon(provider.kind)
  const kindColor = getKindColor(provider.kind)
  const kindAccent = getKindAccent(provider.kind)
  const kindLabel = getKindLabel(provider.kind)
  const isLodging = provider.kind === 'lodging'

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Quay lại
        </Link>

        <div
          className="bg-white rounded-lg shadow-sm overflow-hidden border-l-8"
          style={{ borderLeftColor: kindAccent }}
        >
          {/* Main image */}
          <div className="relative">
            {provider.mainImageUrl ? (
              <img
                src={provider.mainImageUrl}
                alt={provider.name}
                className="w-full h-64 md:h-96 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <KindIcon className="w-24 h-24 text-gray-400" />
              </div>
            )}
            {/* Kind badge on image */}
            <div className={`absolute top-4 left-4 ${kindColor} border rounded-full p-3 shadow-lg`}>
              <KindIcon className="w-8 h-8" />
            </div>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2 ${kindColor} border rounded-full text-sm font-medium`}>
                  <KindIcon className="w-4 h-4" />
                  {kindLabel}
                </span>
                <span className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {provider.province}
                </span>
              </div>

              {/* Share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleShareZalo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Chia sẻ Zalo
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {provider.name}
            </h1>

            {/* Basic info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                {provider.ownerName && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Chủ quán</div>
                      <div className="font-medium text-gray-900">{provider.ownerName}</div>
                    </div>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Số điện thoại</div>
                      <a href={`tel:${provider.phone}`} className="font-medium text-blue-600 hover:underline">{provider.phone}</a>
                    </div>
                  </div>
                )}
                {provider.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Home className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Địa chỉ</div>
                      <div className="font-medium text-gray-900">{provider.address}</div>
                    </div>
                  </div>
                )}
                {provider.websiteUrl && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Website</div>
                      <a
                        href={provider.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline break-all"
                      >
                        {provider.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}
                {provider.googleMapsUrl && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <Map className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Bản đồ</div>
                      <a
                        href={provider.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Xem trên Google Maps →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kind-specific info */}
            {isLodging && (
              <div className="border-t pt-6 mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                  <Hotel className="w-6 h-6 text-blue-600" />
                  Thông tin nhà nghỉ
                </h2>
                <div className="space-y-3">
                  {provider.roomTypes && provider.roomTypes.length > 0 && (
                    <div className="flex items-start gap-3">
                      <BedDouble className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Loại phòng</div>
                        <div className="font-medium text-gray-900">{provider.roomTypes.join(', ')}</div>
                      </div>
                    </div>
                  )}
                  {provider.pricePerNight && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-xs text-gray-500">Giá phòng</div>
                        <div className="text-lg font-semibold text-green-600">{formatPrice(provider.pricePerNight)}/đêm</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLodging && (
              <div className="border-t pt-6 mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                  <KindIcon className="w-6 h-6" style={{ color: kindAccent }} />
                  {`Thông tin ${kindLabel}`}
                </h2>
                <div className="space-y-3">
                  {provider.targetAudiences && provider.targetAudiences.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Nhóm khách phục vụ</div>
                        <div className="font-medium text-gray-900">{provider.targetAudiences.join(', ')}</div>
                      </div>
                    </div>
                  )}
                  {provider.commissionHint && (
                    <div className="flex items-start gap-3">
                      <Percent className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Gợi ý hoa hồng</div>
                        <div className="font-medium text-gray-900">{provider.commissionHint}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {provider.notes && (
              <div className="border-t pt-6 mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
                  <FileText className="w-6 h-6 text-gray-600" />
                  Ghi chú nội bộ
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{provider.notes}</p>
              </div>
            )}

            {/* Google Maps Embed */}
            {provider.googleMapsUrl && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
                <div className="relative w-full h-96 rounded-lg overflow-hidden">
                  <iframe
                    src={provider.googleMapsUrl.includes('embed') 
                      ? provider.googleMapsUrl 
                      : `https://maps.google.com/maps?q=${encodeURIComponent(provider.address || provider.name)}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps"
                  />
                </div>
              </div>
            )}

            {/* Gallery */}
            {provider.images && provider.images.length > 0 && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Ảnh khác</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {provider.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="border-t pt-6 text-sm text-gray-600">
              <div className="mb-2">
                Tạo bởi: {getDisplayName(provider.createdBy.displayName, provider.createdBy.email)}
                {' • '}
                {formatDate(provider.createdAt)}
              </div>
              <div>
                Cập nhật lần cuối: {formatDate(provider.updatedAt)}
                {' bởi '}
                {getDisplayName(provider.updatedBy.displayName, provider.updatedBy.email)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
