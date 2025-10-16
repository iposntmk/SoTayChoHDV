import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'

type TabType = 'provinces' | 'roomTypes'

interface MasterItem {
  id: string
  name: string
  code?: string
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('provinces')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MasterItem[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '' })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const getCollectionName = () => {
    return activeTab === 'provinces' ? 'master_provinces' : 'master_room_types'
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const snapshot = await getDocs(collection(db, getCollectionName()))
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MasterItem[]
      setItems(data.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editId) {
        // Update
        await updateDoc(doc(db, getCollectionName(), editId), {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
        })
      } else {
        // Create
        await addDoc(collection(db, getCollectionName()), {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
        })
      }
      setFormData({ name: '', code: '' })
      setEditId(null)
      loadData()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Lỗi khi lưu')
    }
  }

  const handleEdit = (item: MasterItem) => {
    setEditId(item.id)
    setFormData({ name: item.name, code: item.code || '' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return

    try {
      await deleteDoc(doc(db, getCollectionName(), id))
      loadData()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Lỗi khi xóa')
    }
  }

  const handleCancel = () => {
    setEditId(null)
    setFormData({ name: '', code: '' })
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Master Data (Admin)</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('provinces')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'provinces'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tỉnh/Thành
          </button>
          <button
            onClick={() => setActiveTab('roomTypes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'roomTypes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Loại phòng
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editId ? 'Chỉnh sửa' : 'Thêm mới'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={activeTab === 'provinces' ? 'Ví dụ: Thừa Thiên Huế' : 'Ví dụ: Đơn'}
                  />
                </div>

                {activeTab === 'provinces' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã (tuỳ chọn)
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="TTH"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Danh sách ({items.length})
              </h2>
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.code && (
                          <div className="text-sm text-gray-500">Mã: {item.code}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Loại nhà cung cấp (Nhà nghỉ, F&B, Lưu niệm) được cố định trong code.
            Bạn chỉ cần quản lý Tỉnh/Thành và Loại phòng tại đây.
          </p>
        </div>
      </div>
    </Layout>
  )
}
