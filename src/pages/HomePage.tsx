import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Provider, ProviderKind } from '@/types'
import { formatDate, formatPrice, getDisplayName } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'

const ITEMS_PER_PAGE = 12

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Filters
  const [selectedKind, setSelectedKind] = useState<ProviderKind | ''>('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load providers
  const loadProviders = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      let q = query(
        collection(db, 'providers'),
        where('isApproved', '==', true),
        orderBy('updatedAt', 'desc')
      )

      // Apply filters
      if (selectedKind) {
        q = query(q, where('kind', '==', selectedKind))
      }
      if (selectedProvince) {
        q = query(q, where('province', '==', selectedProvince))
      }

      q = query(q, limit(ITEMS_PER_PAGE))

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const newProviders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[]

      // Client-side search filter
      let filteredProviders = newProviders
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        filteredProviders = newProviders.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.address?.toLowerCase().includes(searchLower) ||
            p.ownerName?.toLowerCase().includes(searchLower)
        )
      }

      if (loadMore) {
        setProviders((prev) => [...prev, ...filteredProviders])
      } else {
        setProviders(filteredProviders)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setLastDoc(null)
    setHasMore(true)
    loadProviders(false)
  }, [selectedKind, selectedProvince, debouncedSearch])

  const getKindLabel = (kind: ProviderKind) => {
    const labels = {
      lodging: 'Nhà nghỉ',
      fnb: 'F&B',
      souvenir: 'Lưu niệm',
    }
    return labels[kind]
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách nhà cung cấp
          </h1>
          <p className="text-gray-600">
            Tìm kiếm và khám phá các nhà cung cấp dịch vụ du lịch
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Kind filter */}
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value as ProviderKind | '')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="lodging">Nhà nghỉ</option>
              <option value="fnb">F&B</option>
              <option value="souvenir">Lưu niệm</option>
            </select>

            {/* Province filter */}
            <input
              type="text"
              placeholder="Tỉnh/Thành"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results */}
        {providers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy kết quả</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Link
                  key={provider.id}
                  to={`/p/${provider.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Image */}
                  {provider.mainImageUrl ? (
                    <img
                      src={provider.mainImageUrl}
                      alt={provider.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {getKindLabel(provider.kind)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {provider.province}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                      {provider.name}
                    </h3>

                    {provider.address && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {provider.address}
                      </p>
                    )}

                    {/* Kind-specific info */}
                    {provider.kind === 'lodging' && provider.pricePerNight && (
                      <p className="text-sm font-medium text-green-600 mb-2">
                        {formatPrice(provider.pricePerNight)}/đêm
                      </p>
                    )}

                    {(provider.kind === 'fnb' || provider.kind === 'souvenir') &&
                      provider.targetAudiences &&
                      provider.targetAudiences.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          {provider.targetAudiences.join(', ')}
                        </p>
                      )}

                    {/* Meta */}
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                      <div>
                        Tạo bởi: {getDisplayName(provider.createdBy.displayName, provider.createdBy.email)}
                      </div>
                      <div>
                        Cập nhật: {formatDate(provider.updatedAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadProviders(true)}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingMore ? 'Đang tải...' : 'Xem thêm'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
