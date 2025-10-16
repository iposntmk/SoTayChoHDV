import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Provider, ProviderKind } from '@/types'
import { formatDate, formatPrice, getDisplayName } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const getKindLabel = (kind: ProviderKind) => {
    const labels = { lodging: 'Nhà nghỉ', fnb: 'F&B', souvenir: 'Lưu niệm' }
    return labels[kind]
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Quay lại
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Main image */}
          {provider.mainImageUrl ? (
            <img
              src={provider.mainImageUrl}
              alt={provider.name}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Chưa có ảnh</span>
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {getKindLabel(provider.kind)}
              </span>
              <span className="text-gray-600">{provider.province}</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {provider.name}
            </h1>

            {/* Basic info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {provider.ownerName && (
                <div>
                  <span className="font-semibold">Chủ quán:</span> {provider.ownerName}
                </div>
              )}
              {provider.phone && (
                <div>
                  <span className="font-semibold">SĐT:</span> {provider.phone}
                </div>
              )}
              {provider.address && (
                <div className="md:col-span-2">
                  <span className="font-semibold">Địa chỉ:</span> {provider.address}
                </div>
              )}
            </div>

            {/* Kind-specific info */}
            {provider.kind === 'lodging' && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Thông tin nhà nghỉ</h2>
                {provider.roomTypes && provider.roomTypes.length > 0 && (
                  <div className="mb-3">
                    <span className="font-semibold">Loại phòng:</span>{' '}
                    {provider.roomTypes.join(', ')}
                  </div>
                )}
                {provider.pricePerNight && (
                  <div className="text-lg font-medium text-green-600">
                    {formatPrice(provider.pricePerNight)}/đêm
                  </div>
                )}
              </div>
            )}

            {(provider.kind === 'fnb' || provider.kind === 'souvenir') && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {provider.kind === 'fnb' ? 'Thông tin F&B' : 'Thông tin lưu niệm'}
                </h2>
                {provider.targetAudiences && provider.targetAudiences.length > 0 && (
                  <div className="mb-3">
                    <span className="font-semibold">Nhóm khách:</span>{' '}
                    {provider.targetAudiences.join(', ')}
                  </div>
                )}
                {provider.commissionHint && (
                  <div>
                    <span className="font-semibold">Hoa hồng:</span> {provider.commissionHint}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {provider.notes && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-2">Ghi chú</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{provider.notes}</p>
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
