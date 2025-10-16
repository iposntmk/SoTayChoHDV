import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Provider, ProviderKind } from '@/types'
import { resizeImage, generateImageFilename } from '@/utils/imageUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'

export default function ProviderFormPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [kind, setKind] = useState<ProviderKind>('lodging')
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Lodging specific
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const [pricePerNight, setPricePerNight] = useState('')

  // F&B & Souvenir specific
  const [targetAudiences, setTargetAudiences] = useState<string[]>([])
  const [commissionHint, setCommissionHint] = useState('')

  // Images
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [existingMainImage, setExistingMainImage] = useState('')

  useEffect(() => {
    if (isEdit) {
      loadProvider()
    }
  }, [id])

  const loadProvider = async () => {
    if (!id || !user) return

    try {
      const docRef = doc(db, 'providers', id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        setError('Không tìm thấy nhà cung cấp')
        return
      }

      const data = docSnap.data() as Provider

      // Check ownership
      if (data.ownerId !== user.uid) {
        setError('Bạn không có quyền chỉnh sửa bài này')
        return
      }

      // Load data
      setKind(data.kind)
      setName(data.name)
      setOwnerName(data.ownerName || '')
      setPhone(data.phone || '')
      setProvince(data.province)
      setAddress(data.address || '')
      setNotes(data.notes || '')

      if (data.kind === 'lodging') {
        setRoomTypes(data.roomTypes || [])
        setPricePerNight(data.pricePerNight?.toString() || '')
      } else {
        setTargetAudiences(data.targetAudiences || [])
        setCommissionHint(data.commissionHint || '')
      }

      setExistingMainImage(data.mainImageUrl || '')
    } catch (err) {
      console.error('Error loading provider:', err)
      setError('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMainImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File, providerId: string): Promise<string> => {
    const resized = await resizeImage(file, 1200, 1200, 0.85)
    const filename = generateImageFilename(file.name)
    const storageRef = ref(storage, `provider-images/${providerId}/${filename}`)
    await uploadBytes(storageRef, resized)
    return await getDownloadURL(storageRef)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (!name || !province) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (kind === 'lodging' && roomTypes.length === 0) {
      setError('Vui lòng chọn ít nhất một loại phòng')
      return
    }

    setSaving(true)
    setError('')

    try {
      const userData = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
      }

      const baseData: any = {
        kind,
        name,
        ownerName: ownerName || null,
        phone: phone || null,
        province,
        address: address || null,
        notes: notes || null,
        isApproved: true,
        updatedAt: serverTimestamp(),
        updatedBy: userData,
      }

      // Kind-specific data
      if (kind === 'lodging') {
        baseData.roomTypes = roomTypes
        baseData.pricePerNight = pricePerNight ? parseFloat(pricePerNight) : null
        baseData.targetAudiences = null
        baseData.commissionHint = null
      } else {
        baseData.targetAudiences = targetAudiences
        baseData.commissionHint = commissionHint || null
        baseData.roomTypes = null
        baseData.pricePerNight = null
      }

      if (isEdit && id) {
        // Update
        const docRef = doc(db, 'providers', id)

        // Upload new image if provided
        if (mainImageFile) {
          baseData.mainImageUrl = await uploadImage(mainImageFile, id)
        }

        await updateDoc(docRef, baseData)
        navigate('/dashboard')
      } else {
        // Create
        baseData.ownerId = user.uid
        baseData.createdAt = serverTimestamp()
        baseData.createdBy = userData

        const docRef = await addDoc(collection(db, 'providers'), baseData)

        // Upload image after creating doc
        if (mainImageFile) {
          const imageUrl = await uploadImage(mainImageFile, docRef.id)
          await updateDoc(docRef, { mainImageUrl: imageUrl })
        }

        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error saving provider:', err)
      setError('Lỗi khi lưu. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const toggleRoomType = (type: string) => {
    setRoomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleTargetAudience = (audience: string) => {
    setTargetAudiences((prev) =>
      prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]
    )
  }

  if (loading) return <Loading />

  if (error && isEdit) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
              ← Về Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Chỉnh sửa nhà cung cấp' : 'Tạo nhà cung cấp mới'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Kind */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ProviderKind)}
              disabled={isEdit}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="lodging">Nhà nghỉ</option>
              <option value="fnb">F&B</option>
              <option value="souvenir">Lưu niệm</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chủ quán
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              placeholder="Ví dụ: Thừa Thiên Huế"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kind-specific fields */}
          {kind === 'lodging' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {['Đơn', 'Đôi', 'Ghép', 'Suite'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={roomTypes.includes(type)}
                        onChange={() => toggleRoomType(type)}
                        className="mr-2"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá/phòng/đêm (VND)
                </label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  placeholder="300000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhóm khách phục vụ
                </label>
                <div className="space-y-2">
                  {['Khách Ấn Độ', 'Khách châu Á', 'Khách Do Thái', 'Khách Âu Mỹ'].map((aud) => (
                    <label key={aud} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={targetAudiences.includes(aud)}
                        onChange={() => toggleTargetAudience(aud)}
                        className="mr-2"
                      />
                      {aud}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gợi ý hoa hồng
                </label>
                <input
                  type="text"
                  value={commissionHint}
                  onChange={(e) => setCommissionHint(e.target.value)}
                  placeholder="10-15%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện
            </label>
            {(mainImagePreview || existingMainImage) && (
              <img
                src={mainImagePreview || existingMainImage}
                alt="Preview"
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ảnh sẽ được tự động resize. Kích thước tối đa: 5MB
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú nội bộ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
