import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Provider, ProviderKind } from '@/types'
import { resizeImage, generateImageFilename } from '@/utils/imageUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import Combobox from '@/components/Combobox'
import { DEFAULT_PROVIDER_TYPES } from '@/constants/providerTypes'
import {
  Building2,
  User,
  Phone,
  MapPin,
  Home,
  Globe,
  Map,
  BedDouble,
  DollarSign,
  Users,
  Percent,
  FileText,
  Image as ImageIcon,
  Tag
} from 'lucide-react'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export default function ProviderFormPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Master data
  const [provinces, setProvinces] = useState<Array<{ value: string; label: string }>>([])
  const [roomTypeOptions, setRoomTypeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [providerTypeOptions, setProviderTypeOptions] = useState<Array<{ value: string; label: string }>>(
    DEFAULT_PROVIDER_TYPES
  )
  const [customerSegments, setCustomerSegments] = useState<
    Array<{ value: string; label: string; description?: string | null }>
  >([])

  // Form state
  const [kind, setKind] = useState<ProviderKind>('lodging')
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')

  // Lodging specific
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const [pricePerNight, setPricePerNight] = useState('')

  // F&B & Souvenir specific
  const [targetAudiences, setTargetAudiences] = useState<string[]>([])
  const [commissionHint, setCommissionHint] = useState('')

  // Images (up to 3)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMasterData = useCallback(async () => {
    try {
      // Load provinces
      const provincesSnap = await getDocs(collection(db, 'master_provinces'))
      const provincesData = provincesSnap.docs.map((doc) => ({
        value: doc.data().name,
        label: doc.data().name,
      }))
      setProvinces(provincesData.sort((a, b) => a.label.localeCompare(b.label)))

      // Load room types
      const roomTypesSnap = await getDocs(collection(db, 'master_room_types'))
      const roomTypesData = roomTypesSnap.docs.map((doc) => ({
        value: doc.data().name,
        label: doc.data().name,
      }))
      setRoomTypeOptions(roomTypesData.sort((a, b) => a.label.localeCompare(b.label)))

      // Load provider types
      const providerTypesSnap = await getDocs(collection(db, 'master_provider_types'))
      const providerTypesData = providerTypesSnap.docs
        .map((doc) => {
          const data = doc.data()
          const label = (data?.name as string | undefined)?.trim()
          return {
            value: doc.id,
            label: label && label.length > 0 ? label : doc.id,
          }
        })
        .filter((item) => item.label && item.value)
      const mergedProviderTypes = [...providerTypesData]
      DEFAULT_PROVIDER_TYPES.forEach((defaultType) => {
        if (!mergedProviderTypes.some((item) => item.value === defaultType.value)) {
          mergedProviderTypes.push(defaultType)
        }
      })
      mergedProviderTypes.sort((a, b) => a.label.localeCompare(b.label))
      setProviderTypeOptions(mergedProviderTypes)
      if (!isEdit && mergedProviderTypes.length > 0) {
        setKind((prevKind) =>
          mergedProviderTypes.some((opt) => opt.value === prevKind) ? prevKind : mergedProviderTypes[0].value
        )
      }

      // Load customer segments
      const customerSegmentsSnap = await getDocs(collection(db, 'master_customer_segments'))
      const customerSegmentsData = customerSegmentsSnap.docs.map((doc) => ({
        value: doc.data().name,
        label: doc.data().name,
        description: doc.data().specialTraits || null,
      }))
      setCustomerSegments(customerSegmentsData.sort((a, b) => a.label.localeCompare(b.label)))
    } catch (err) {
      console.error('Error loading master data:', err)
    }
  }, [isEdit])

  const loadProvider = useCallback(async () => {
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
      if (data.ownerId !== user.uid && !isAdmin) {
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
      setWebsiteUrl(data.websiteUrl || '')
      setGoogleMapsUrl(data.googleMapsUrl || '')

      if (data.kind === 'lodging') {
        setRoomTypes(data.roomTypes || [])
        setPricePerNight(data.pricePerNight?.toString() || '')
      } else {
        setTargetAudiences(data.targetAudiences || [])
        setCommissionHint(data.commissionHint || '')
      }

      // Load existing images
      const images: string[] = []
      if (data.mainImageUrl) images.push(data.mainImageUrl)
      if (data.images) images.push(...data.images)
      setExistingImages(images)
    } catch (err) {
      console.error('Error loading provider:', err)
      setError('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [id, user, isAdmin])

  useEffect(() => {
    void loadMasterData()
  }, [loadMasterData])

  useEffect(() => {
    if (!isEdit || authLoading) return
    void loadProvider()
  }, [isEdit, authLoading, loadProvider])

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const totalImages = imageFiles.length + imagePreviews.length + existingImages.length
    const availableSlots = 3 - totalImages
    
    if (availableSlots <= 0) {
      alert('Tối đa 3 ảnh. Vui lòng xóa ảnh cũ trước khi thêm mới.')
      return
    }

    const filesToAdd = fileArray.slice(0, availableSlots)
    
    // Validate file types and sizes
    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} không phải là ảnh`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá 5MB`)
        return
      }
    }

    // Create previews
    const newPreviews: string[] = []
    for (const file of filesToAdd) {
      const reader = new FileReader()
      const preview = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      newPreviews.push(preview)
    }

    setImageFiles([...imageFiles, ...filesToAdd])
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      processFiles(files)
    }
  }

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages(existingImages.filter((_, i) => i !== index))
    } else {
      const newIndex = index - existingImages.length
      setImageFiles(imageFiles.filter((_, i) => i !== newIndex))
      setImagePreviews(imagePreviews.filter((_, i) => i !== newIndex))
    }
  }

  const waitForProviderAccess = async (providerId: string, retries = 8) => {
    if (!user) return
    const providerRef = doc(db, 'providers', providerId)

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const providerSnap = await getDoc(providerRef)
        if (providerSnap.exists()) {
          const providerData = providerSnap.data() as Provider
          if (providerData.ownerId === user.uid || isAdmin) {
            return
          }
        }
      } catch (error) {
        console.error('Error verifying provider access:', error)
      }

      const delay = Math.min(400 * Math.pow(2, attempt - 1), 4000)
      await sleep(delay)
    }

    throw new Error('Không thể xác nhận quyền tải ảnh. Vui lòng thử lại sau.')
  }

  const uploadImage = async (file: File, providerId: string, retries = 7): Promise<string> => {
    await waitForProviderAccess(providerId, 3)
    await sleep(300)

    const resized = await resizeImage(file, 1200, 1200, 0.85)
    const contentType = resized.type || file.type || 'image/jpeg'
    const filename = generateImageFilename(file.name)
    const storageRef = ref(storage, `provider-images/${providerId}/${filename}`)
    const processedFile = new File([resized], filename, { type: contentType })
    const metadata = {
      contentType,
    }

    // Retry logic to handle Storage Rules propagation delay
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt === 1) {
          await sleep(400)
        }
        await uploadBytes(storageRef, processedFile, metadata)
        return await getDownloadURL(storageRef)
      } catch (error: any) {
        if (error?.code === 'storage/unauthorized' && attempt < retries) {
          console.warn(`Upload unauthorized on attempt ${attempt} for provider ${providerId}`, error)
          // Re-verify provider ownership/admin access before retrying
          try {
            await waitForProviderAccess(providerId, 3)
          } catch (accessError) {
            console.error('Provider access check failed during upload retry:', accessError)
            throw error
          }

          // Wait with exponential backoff before retrying (max 6s)
          const delay = Math.min(1200 * Math.pow(2, attempt - 1), 6000)
          console.log(`Upload attempt ${attempt} failed, retrying in ${delay}ms...`)
          await sleep(delay)
        } else {
          throw error
        }
      }
    }
    throw new Error('Upload failed after retries')
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
        websiteUrl: websiteUrl || null,
        googleMapsUrl: googleMapsUrl || null,
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

        // Upload new images if provided
        const uploadedUrls: string[] = []
        if (imageFiles.length > 0) {
          await waitForProviderAccess(id)
          await sleep(600)

          for (const file of imageFiles) {
            const url = await uploadImage(file, id)
            uploadedUrls.push(url)
          }
        }

        // Combine existing and new images
        const allImages = [...existingImages, ...uploadedUrls]
        if (allImages.length > 0) {
          baseData.mainImageUrl = allImages[0]
          baseData.images = allImages.slice(1)
        }

        await updateDoc(docRef, baseData)
        navigate('/dashboard')
      } else {
        // Create
        baseData.ownerId = user.uid
        baseData.createdAt = serverTimestamp()
        baseData.createdBy = userData

        const docRef = await addDoc(collection(db, 'providers'), baseData)

        // Upload images after creating doc
        const uploadedUrls: string[] = []
        if (imageFiles.length > 0) {
          await waitForProviderAccess(docRef.id)
          await sleep(800)

          for (const file of imageFiles) {
            const url = await uploadImage(file, docRef.id)
            uploadedUrls.push(url)
          }
        }

        if (uploadedUrls.length > 0) {
          await updateDoc(docRef, {
            mainImageUrl: uploadedUrls[0],
            images: uploadedUrls.slice(1),
          })
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

  // Handle kind change - reset kind-specific fields
  const handleKindChange = (newKind: string) => {
    const oldKind = kind
    setKind(newKind)

    // Reset kind-specific fields when changing kind
    if (oldKind !== newKind) {
      if (newKind === 'lodging') {
        // Switching to lodging - clear F&B/Souvenir fields
        setTargetAudiences([])
        setCommissionHint('')
      } else {
        // Switching from lodging - clear lodging fields
        setRoomTypes([])
        setPricePerNight('')
      }
    }
  }

  const providerTypeExists = providerTypeOptions.some((option) => option.value === kind)
  const missingTargetAudiences = targetAudiences.filter(
    (aud) => !customerSegments.some((segment) => segment.value === aud)
  )

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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              Loại nhà cung cấp <span className="text-red-500">*</span>
            </label>
            {providerTypeOptions.length > 0 ? (
              <>
                <Combobox
                  options={providerTypeOptions}
                  value={kind}
                  onChange={handleKindChange}
                  required
                />
                {!providerTypeExists && kind && (
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠️ Loại nhà cung cấp này không còn trong Master Data. Vui lòng chọn lại.
                  </p>
                )}
                {isEdit && (
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Lưu ý: Thay đổi loại nhà cung cấp sẽ xóa các trường thông tin cũ (loại phòng, giá, nhóm khách, hoa hồng).
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu loại nhà cung cấp. Vui lòng thêm trong Master Data.
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4" />
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Tỉnh/Thành <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={provinces}
              value={province}
              onChange={setProvince}
              placeholder="Chọn tỉnh/thành..."
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4" />
              Địa chỉ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4" />
              Link Website
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Google Maps URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Map className="w-4 h-4" />
              Link Google Maps
            </label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Có thể nhúng Google Maps iframe vào trang chi tiết
            </p>
          </div>

          {/* Kind-specific fields */}
          {kind === 'lodging' ? (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <BedDouble className="w-4 h-4" />
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {roomTypeOptions.length > 0 ? (
                    roomTypeOptions.map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roomTypes.includes(type.value)}
                          onChange={() => toggleRoomType(type.value)}
                          className="mr-2 rounded"
                        />
                        {type.label}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Đang tải loại phòng...</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4" />
                  Nhóm khách phục vụ
                </label>
                <div className="space-y-3">
                  {customerSegments.length > 0 ? (
                    customerSegments.map((segment) => (
                      <label key={segment.value} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={targetAudiences.includes(segment.value)}
                          onChange={() => toggleTargetAudience(segment.value)}
                          className="mt-1 rounded"
                        />
                        <span>
                          <span className="text-sm text-gray-900">{segment.label}</span>
                          {segment.description && (
                            <span className="block text-xs text-gray-500 mt-1">{segment.description}</span>
                          )}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Chưa có dữ liệu dòng khách. Thêm trong mục Master Data &rarr; Dòng khách.
                    </p>
                  )}
                  {missingTargetAudiences.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-2">
                        Nhóm khách đã chọn trước đây (không còn trong Master Data):
                      </p>
                      <div className="space-y-2">
                        {missingTargetAudiences.map((aud) => (
                          <label key={`missing-${aud}`} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={targetAudiences.includes(aud)}
                              onChange={() => toggleTargetAudience(aud)}
                              className="mt-1 rounded"
                            />
                            <span>
                              <span className="text-sm text-amber-800">{aud}</span>
                              <span className="block text-xs text-amber-600 mt-1">
                                Bỏ chọn nếu không còn sử dụng.
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4" />
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

          {/* Images (up to 3) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4" />
              Hình ảnh (tối đa 3 ảnh)
            </label>

            {/* Image previews */}
            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group">
                    <img
                      src={url}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, true)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Ảnh đại diện
                      </div>
                    )}
                  </div>
                ))}
                {imagePreviews.map((preview, idx) => (
                  <div key={`preview-${idx}`} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(existingImages.length + idx, false)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {existingImages.length === 0 && idx === 0 && (
                      <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Ảnh đại diện
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            {(existingImages.length + imagePreviews.length) < 3 && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Kéo thả ảnh vào đây, dán từ clipboard, hoặc
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Chọn file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500">
                    Ảnh đầu tiên sẽ là ảnh đại diện. Tối đa 5MB/ảnh.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
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
