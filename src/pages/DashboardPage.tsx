import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Provider, ProviderKind } from '@/types'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKind, setFilterKind] = useState<ProviderKind | ''>('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadProviders()
  }, [user, filterKind])

  const loadProviders = async () => {
    if (!user) return

    try {
      setLoading(true)
      let q = query(
        collection(db, 'providers'),
        where('ownerId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      )

      if (filterKind) {
        q = query(q, where('kind', '==', filterKind))
      }

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[]

      setProviders(data)
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'providers', id))
      setProviders((prev) => prev.filter((p) => p.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Lỗi khi xóa. Vui lòng thử lại.')
    }
  }

  const getKindLabel = (kind: ProviderKind) => {
    const labels = { lodging: 'Nhà nghỉ', fnb: 'F&B', souvenir: 'Lưu niệm' }
    return labels[kind]
  }

  if (loading) return <Loading />

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài của tôi</h1>
            <p className="text-gray-600">Quản lý nhà cung cấp của bạn</p>
          </div>
          <Link
            to="/dashboard/new"
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Tạo mới
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lọc theo loại:
          </label>
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as ProviderKind | '')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="lodging">Nhà nghỉ</option>
            <option value="fnb">F&B</option>
            <option value="souvenir">Lưu niệm</option>
          </select>
        </div>

        {/* List */}
        {providers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">Bạn chưa có nhà cung cấp nào</p>
            <Link
              to="/dashboard/new"
              className="text-blue-600 hover:underline"
            >
              Tạo bài đầu tiên →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tỉnh/Thành
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cập nhật
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {provider.mainImageUrl && (
                            <img
                              src={provider.mainImageUrl}
                              alt={provider.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {provider.name}
                            </div>
                            {provider.address && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {provider.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {getKindLabel(provider.kind)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {provider.province}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(provider.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/p/${provider.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Xem
                        </Link>
                        <Link
                          to={`/dashboard/edit/${provider.id}`}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(provider.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
