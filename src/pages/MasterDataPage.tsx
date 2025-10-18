import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import { Type, Code, Search, NotebookPen, Tags } from 'lucide-react'

type TabType = 'provinces' | 'roomTypes' | 'customerSegments' | 'providerTypes'
type ViewMode = 'table' | 'grid'

interface MasterItem {
  id: string
  name: string
  code?: string
  specialTraits?: string | null
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('provinces')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MasterItem[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', specialTraits: '' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  
  // Filters
  const [nameFilter, setNameFilter] = useState('')
  const [secondaryFilter, setSecondaryFilter] = useState('')

  useEffect(() => {
    loadData()
    setSelectedIds(new Set())
    setNameFilter('')
    setSecondaryFilter('')
    setFormData({ name: '', code: '', specialTraits: '' })
  }, [activeTab])

  const getCollectionName = () => {
    switch (activeTab) {
      case 'provinces':
        return 'master_provinces'
      case 'roomTypes':
        return 'master_room_types'
      case 'customerSegments':
        return 'master_customer_segments'
      case 'providerTypes':
      default:
        return 'master_provider_types'
    }
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

  // Filtered items
  const filteredItems = useMemo(() => {
    const nameKeyword = nameFilter.toLowerCase()
    const secondaryKeyword = secondaryFilter.toLowerCase()

    return items.filter((item) => {
      const matchName = item.name.toLowerCase().includes(nameKeyword)
      if (!secondaryKeyword) return matchName

      if (activeTab === 'provinces') {
        return matchName && (item.code || '').toLowerCase().includes(secondaryKeyword)
      }

      if (activeTab === 'customerSegments') {
        return (
          matchName &&
          (item.specialTraits || '')
            .toLowerCase()
            .includes(secondaryKeyword)
        )
      }

      return matchName
    })
  }, [items, nameFilter, secondaryFilter, activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      const payload: Record<string, string | null> = {
        name: formData.name.trim(),
      }

      if (activeTab === 'provinces') {
        payload.code = formData.code.trim() || null
      } else if (activeTab === 'customerSegments') {
        payload.specialTraits = formData.specialTraits.trim() || null
      }

      if (editId) {
        // Update
        await updateDoc(doc(db, getCollectionName(), editId), payload)
      } else {
        // Create
        await addDoc(collection(db, getCollectionName()), payload)
      }
      setFormData({ name: '', code: '', specialTraits: '' })
      setEditId(null)
      loadData()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Lỗi khi lưu')
    }
  }

  const handleEdit = (item: MasterItem) => {
    setEditId(item.id)
    setFormData({
      name: item.name,
      code: item.code || '',
      specialTraits: item.specialTraits || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    setFormData({ name: '', code: '', specialTraits: '' })
  }

  const handleDuplicate = async (item: MasterItem) => {
    try {
      const payload: Record<string, string | null> = {
        name: `${item.name} (Copy)`,
      }

      if (activeTab === 'provinces') {
        payload.code = item.code ? `${item.code}_copy` : null
      } else if (activeTab === 'customerSegments') {
        payload.specialTraits = item.specialTraits || null
      }

      await addDoc(collection(db, getCollectionName()), payload)
      loadData()
    } catch (error) {
      console.error('Error duplicating:', error)
      alert('Lỗi khi nhân bản')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.size} mục đã chọn?`)) return

    try {
      const batch = writeBatch(db)
      selectedIds.forEach((id) => {
        batch.delete(doc(db, getCollectionName(), id))
      })
      await batch.commit()
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      console.error('Error deleting selected:', error)
      alert('Lỗi khi xóa')
    }
  }

  const handleExportTxt = () => {
    const lines = filteredItems.map((item) => {
      if (activeTab === 'provinces') {
        return item.code ? `${item.name}\t${item.code}` : item.name
      }

      if (activeTab === 'customerSegments') {
        return item.specialTraits ? `${item.name}\t${item.specialTraits}` : item.name
      }

      return item.name
    })

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const prefix =
      activeTab === 'provinces'
        ? 'provinces'
        : activeTab === 'roomTypes'
          ? 'room_types'
          : activeTab === 'customerSegments'
            ? 'customer_segments'
            : 'provider_types'
    a.download = `${prefix}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setImportText(text)
      setShowImportModal(true)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportSubmit = async () => {
    if (!importText.trim()) return

    try {
      const lines = importText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const batch = writeBatch(db)

      let processedCount = 0

      lines.forEach((line) => {
        const parts = line.split('\t')
        const name = parts[0]?.trim()
        const secondary = parts[1]?.trim() || null
        
        if (name) {
          const docRef = doc(collection(db, getCollectionName()))
          const payload: Record<string, string | null> = { name }

          if (activeTab === 'provinces') {
            payload.code = secondary || null
          } else if (activeTab === 'customerSegments') {
            payload.specialTraits = secondary || null
          }

          batch.set(docRef, payload)
          processedCount += 1
        }
      })

      await batch.commit()
      setShowImportModal(false)
      setImportText('')
      loadData()
      alert(`Đã import thành công ${processedCount} mục`)
    } catch (error) {
      console.error('Error importing:', error)
      alert('Lỗi khi import')
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
          <button
            onClick={() => setActiveTab('customerSegments')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'customerSegments'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dòng khách
          </button>
          <button
            onClick={() => setActiveTab('providerTypes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'providerTypes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Loại nhà cung cấp
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editId ? 'Chỉnh sửa' : 'Thêm mới'}
              </h2>
              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    {activeTab === 'providerTypes' ? (
                      <Tags className="w-4 h-4" />
                    ) : (
                      <Type className="w-4 h-4" />
                    )}
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      activeTab === 'provinces'
                        ? 'Ví dụ: Thừa Thiên Huế'
                        : activeTab === 'roomTypes'
                          ? 'Ví dụ: Đơn'
                          : activeTab === 'customerSegments'
                            ? 'Ví dụ: Khách Do Thái'
                            : 'Ví dụ: Resort nghỉ dưỡng'
                    }
                  />
                </div>

                {activeTab === 'provinces' && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Code className="w-4 h-4" />
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

                {activeTab === 'customerSegments' && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <NotebookPen className="w-4 h-4" />
                      Đặc thù (tuỳ chọn)
                    </label>
                    <textarea
                      value={formData.specialTraits}
                      onChange={(e) => setFormData({ ...formData, specialTraits: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Ví dụ: Ưu tiên món kosher, cần hướng dẫn viên tiếng Anh"
                    />
                  </div>
                )}

                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportTxt}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    📥 Export TXT
                  </button>
                  <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer text-sm">
                    📤 Import TXT
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    ✏️ Import Textarea
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      🗑️ Xóa đã chọn ({selectedIds.size})
                    </button>
                  )}
                </div>
                <div className="hidden md:flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔲 Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          <div className="mb-2">Tên</div>
                          <input
                            type="text"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Lọc..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                        {activeTab === 'provinces' && (
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            <div className="mb-2">Mã</div>
                            <input
                              type="text"
                              value={secondaryFilter}
                              onChange={(e) => setSecondaryFilter(e.target.value)}
                              placeholder="Lọc..."
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </th>
                        )}
                        {activeTab === 'customerSegments' && (
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            <div className="mb-2">Đặc thù</div>
                            <input
                              type="text"
                              value={secondaryFilter}
                              onChange={(e) => setSecondaryFilter(e.target.value)}
                              placeholder="Lọc..."
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={activeTab === 'provinces' || activeTab === 'customerSegments' ? 4 : 3}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            {activeTab === 'provinces' && (
                              <td className="px-4 py-3 text-sm text-gray-500">{item.code || '-'}</td>
                            )}
                            {activeTab === 'customerSegments' && (
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {item.specialTraits || '-'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDuplicate(item)}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Nhân bản
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Search className="w-4 h-4" />
                        Lọc theo tên
                      </label>
                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Nhập tên..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {(activeTab === 'provinces' || activeTab === 'customerSegments') && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Search className="w-4 h-4" />
                          {activeTab === 'provinces' ? 'Lọc theo mã' : 'Lọc theo đặc thù'}
                        </label>
                        <input
                          type="text"
                          value={secondaryFilter}
                          onChange={(e) => setSecondaryFilter(e.target.value)}
                          placeholder={activeTab === 'provinces' ? 'Nhập mã...' : 'Nhập đặc thù...'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  
                  {filteredItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {activeTab === 'provinces' && item.code && (
                                <div className="text-sm text-gray-500 mt-1">Mã: {item.code}</div>
                              )}
                              {activeTab === 'customerSegments' && item.specialTraits && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Đặc thù: {item.specialTraits}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 text-sm">
                            <button
                              onClick={() => handleEdit(item)}
                              className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="flex-1 px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                            >
                              Nhân bản
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Search className="w-4 h-4" />
                      Lọc theo tên
                    </label>
                    <input
                      type="text"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      placeholder="Nhập tên..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(activeTab === 'provinces' || activeTab === 'customerSegments') && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Search className="w-4 h-4" />
                        {activeTab === 'provinces' ? 'Lọc theo mã' : 'Lọc theo đặc thù'}
                      </label>
                      <input
                        type="text"
                        value={secondaryFilter}
                        onChange={(e) => setSecondaryFilter(e.target.value)}
                        placeholder={activeTab === 'provinces' ? 'Nhập mã...' : 'Nhập đặc thù...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <button
                    onClick={handleSelectAll}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                  Không có dữ liệu
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-lg">{item.name}</div>
                        {activeTab === 'provinces' && item.code && (
                          <div className="text-sm text-gray-500 mt-1">Mã: {item.code}</div>
                        )}
                        {activeTab === 'customerSegments' && item.specialTraits && (
                          <div className="text-sm text-gray-500 mt-1">
                            Đặc thù: {item.specialTraits}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                      >
                        Nhân bản
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Import từ Textarea</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {activeTab === 'provinces'
                    ? 'Mỗi dòng: Tên tỉnh [TAB] Mã (tuỳ chọn). Ví dụ: Thừa Thiên Huế\tTTH'
                    : activeTab === 'roomTypes'
                      ? 'Mỗi dòng một loại phòng. Ví dụ: Đơn'
                      : activeTab === 'customerSegments'
                        ? 'Mỗi dòng: Tên dòng khách [TAB] Đặc thù (tuỳ chọn). Ví dụ: Khách Do Thái\tYêu cầu bếp kosher'
                        : 'Mỗi dòng một loại nhà cung cấp. Ví dụ: Resort nghỉ dưỡng'}
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder={activeTab === 'provinces'
                    ? 'Thừa Thiên Huế\tTTH\nĐà Nẵng\tDN\nQuảng Nam\tQN'
                    : activeTab === 'roomTypes'
                      ? 'Đơn\nĐôi\nGia đình'
                      : activeTab === 'customerSegments'
                        ? 'Khách Do Thái\tYêu cầu bếp kosher\nKhách Trung Quốc\tThích menu tiếng Trung'
                        : 'Resort nghỉ dưỡng\nGlamping\nDu thuyền cao cấp'}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleImportSubmit}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setImportText('')
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Nên duy trì dữ liệu đồng bộ với các biểu mẫu (ví dụ: vẫn giữ loại "lodging" cho nhà nghỉ).
            Bạn có thể quản lý Tỉnh/Thành, Loại phòng, Dòng khách và Loại nhà cung cấp tại đây.
          </p>
        </div>
      </div>
    </Layout>
  )
}
