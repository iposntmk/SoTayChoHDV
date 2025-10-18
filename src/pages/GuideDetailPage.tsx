import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GuideProfile } from '@/types'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import Combobox from '@/components/Combobox'
import { useProvinces } from '@/hooks/useProvinces'
import { resolveProvinceName } from '@/utils/provinceMatching'
import { searchGuideByCardNumber, parseVietnameseDate } from '@/services/guideInfoService'
import {
  BadgeCheck,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Users,
  ArrowLeft,
  Edit2,
  Loader2,
  Search,
  X,
  Save,
} from 'lucide-react'
import { formatDate } from '@/utils/formatUtils'
import { useAuth } from '@/contexts/AuthContext'

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const { provinces, loading: provincesLoading } = useProvinces()
  const [guide, setGuide] = useState<GuideProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [issuingPlace, setIssuingPlace] = useState('')
  const [cardType, setCardType] = useState<'domestic' | 'international'>('domestic')
  const [experienceYears, setExperienceYears] = useState(0)
  const [languages, setLanguages] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    const loadGuide = async () => {
      if (!id) {
        setError('Không tìm thấy hồ sơ')
        setLoading(false)
        return
      }

      try {
        const docSnap = await getDoc(doc(db, 'guide_profiles', id))
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as GuideProfile
          setGuide(data)
          populateForm(data)
        } else {
          setError('Không tìm thấy hồ sơ')
        }
      } catch (err) {
        console.error('Error loading guide:', err)
        setError('Lỗi khi tải hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    loadGuide()
  }, [id])

  useEffect(() => {
    if (!issuingPlace || provinces.length === 0) return
    const resolved = resolveProvinceName(issuingPlace, provinces)
    if (resolved && resolved !== issuingPlace) {
      setIssuingPlace(resolved)
    }
  }, [issuingPlace, provinces])

  const populateForm = (data: GuideProfile) => {
    setFullName(data.fullName)
    setEmail(data.email || '')
    setPhone(data.phone || '')
    setCardNumber(data.cardNumber)
    setExpiryDate(formatDate(data.expiryDate))
    setIssuingPlace(data.issuingPlace)
    setCardType(data.cardType)
    setExperienceYears(data.experienceYears)
    setLanguages(data.languages && data.languages.length > 0 ? data.languages.join(', ') : '')
  }

  const resolveProvinceValue = (raw: string) => resolveProvinceName(raw, provinces)

  if (loading) return <Loading />

  if (error || !guide) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Không tìm thấy hồ sơ'}</p>
            <Link to="/guides" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const canEdit = user && (user.uid === guide.userId || isAdmin)
  const currentCardType = isEditing ? cardType : guide.cardType
  const currentFullName = isEditing ? fullName : guide.fullName
  const currentCardNumber = isEditing ? cardNumber : guide.cardNumber
  const currentExperienceYears = isEditing ? experienceYears : guide.experienceYears

  const handleSearchGuideInfo = async () => {
    if (!cardNumber.trim()) {
      setSearchMessage('Vui lòng nhập số thẻ')
      return
    }

    setSearching(true)
    setSearchMessage('')
    setFormError('')

    try {
      const guideInfo = await searchGuideByCardNumber(cardNumber)

      if (guideInfo) {
        if (guideInfo.fullName) setFullName(guideInfo.fullName)
        if (guideInfo.email) setEmail(guideInfo.email)
        if (guideInfo.issuingPlace) setIssuingPlace(resolveProvinceValue(guideInfo.issuingPlace))
        if (guideInfo.cardType === 'domestic' || guideInfo.cardType === 'international') {
          setCardType(guideInfo.cardType)
        }
        if (guideInfo.experienceYears > 0) {
          setExperienceYears(guideInfo.experienceYears)
        }
        if (guideInfo.languages && guideInfo.languages.length > 0) {
          setLanguages(guideInfo.languages.join(', '))
        }
        if (guideInfo.expiryDate) {
          const parsedDate = parseVietnameseDate(guideInfo.expiryDate)
          if (parsedDate) {
            const day = String(parsedDate.getDate()).padStart(2, '0')
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const year = parsedDate.getFullYear()
            setExpiryDate(`${day}/${month}/${year}`)
          }
        }

        setSearchMessage('✓ Đã tìm thấy và điền thông tin tự động')
      } else {
        setSearchMessage('Không tìm thấy thông tin cho số thẻ này')
      }
    } catch (err) {
      console.error('Error searching guide info:', err)
      setSearchMessage('Lỗi khi tìm kiếm thông tin')
    } finally {
      setSearching(false)
      setTimeout(() => setSearchMessage(''), 5000)
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!guide?.id || !user) return
    if (!canEdit) return

    const parsedExpiry = parseVietnameseDate(expiryDate)
    if (!parsedExpiry) {
      setFormError('Ngày hết hạn không hợp lệ (định dạng dd/mm/yyyy)')
      return
    }

    const normalizedEmail = email.trim()
    const normalizedPhone = phone.trim()
    const normalizedLanguages = languages
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean)

    setSaving(true)
    setFormError('')
    setFormSuccess('')

    try {
      const docRef = doc(db, 'guide_profiles', guide.id)
      const userInfo = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || undefined,
      }

      const payload: GuideProfile = {
        id: guide.id,
        userId: guide.userId,
        fullName,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        cardNumber,
        expiryDate: Timestamp.fromDate(parsedExpiry),
        issuingPlace,
        cardType,
        experienceYears,
        languages: normalizedLanguages.length > 0 ? normalizedLanguages : null,
        createdAt: guide.createdAt,
        createdBy: guide.createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: userInfo,
        lastExpiryNotificationAt: guide.lastExpiryNotificationAt ?? null,
      }

      await setDoc(docRef, payload)
      setGuide(payload)
      setFormSuccess('Đã cập nhật hồ sơ')
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating guide profile:', err)
      setFormError('Lỗi khi lưu hồ sơ. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/guides" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing((prev) => !prev)
                  setFormError('')
                  setFormSuccess('')
                  populateForm(guide)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
              </button>
            </div>
          )}
        </div>

        <div
          className={`rounded-lg shadow-sm overflow-hidden border ${
            currentCardType === 'international'
              ? 'border-purple-200'
              : 'border-green-200'
          }`}
        >
          <div
            className={`p-6 ${
              currentCardType === 'international'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                : 'bg-gradient-to-r from-green-500 to-emerald-600'
            } text-white`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/80 mb-2">
                  {currentCardType === 'domestic' ? 'Thẻ nội địa' : 'Thẻ quốc tế'}
                </p>
                <h1 className="text-3xl font-bold mb-2">{currentFullName}</h1>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                  <BadgeCheck className="w-4 h-4" />
                  {currentCardNumber}
                </div>
              </div>
              {currentExperienceYears > 0 && (
                <div className="text-right">
                  <p className="text-sm text-white/80">Kinh nghiệm</p>
                  <p className="text-2xl font-semibold">{currentExperienceYears} năm</p>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <EditForm
              provinces={provinces}
              provincesLoading={provincesLoading}
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
              issuingPlace={issuingPlace}
              setIssuingPlace={setIssuingPlace}
              cardType={cardType}
              setCardType={setCardType}
              experienceYears={experienceYears}
              setExperienceYears={setExperienceYears}
              languages={languages}
              setLanguages={setLanguages}
              searching={searching}
              searchMessage={searchMessage}
              onSearch={handleSearchGuideInfo}
              saving={saving}
              onSave={handleSave}
              onCancel={() => {
                populateForm(guide)
                setIsEditing(false)
                setFormError('')
                setFormSuccess('')
              }}
              error={formError}
              success={formSuccess}
            />
          ) : (
            <div className="p-6 bg-white space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <InfoItem icon={<Calendar className="w-4 h-4 text-blue-500" />} label="Ngày hết hạn">
                  {formatDate(guide.expiryDate)}
                </InfoItem>

                <InfoItem icon={<MapPin className="w-4 h-4 text-green-500" />} label="Nơi cấp thẻ">
                  {guide.issuingPlace}
                </InfoItem>

                <InfoItem icon={<Phone className="w-4 h-4 text-orange-500" />} label="Số điện thoại">
                  {guide.phone ? (
                    <a href={`tel:${guide.phone}`} className="text-blue-600 hover:underline">
                      {guide.phone}
                    </a>
                  ) : (
                    'Chưa cập nhật'
                  )}
                </InfoItem>

                <InfoItem icon={<Mail className="w-4 h-4 text-indigo-500" />} label="Email liên hệ">
                  {guide.email ? (
                    <a href={`mailto:${guide.email}`} className="text-blue-600 hover:underline">
                      {guide.email}
                    </a>
                  ) : (
                    'Chưa cập nhật'
                  )}
                </InfoItem>

                <InfoItem icon={<Users className="w-4 h-4 text-purple-500" />} label="Ngoại ngữ sử dụng">
                  {guide.languages && guide.languages.length > 0
                    ? guide.languages.join(', ')
                    : 'Chưa cập nhật'}
                </InfoItem>
              </div>

              <div className="border-t pt-4 text-sm text-gray-600 flex flex-wrap gap-4">
                <span>Người cập nhật: {guide.updatedBy?.displayName || guide.updatedBy?.email || 'N/A'}</span>
                <span>
                  Cập nhật lần cuối:{' '}
                  {guide.updatedAt instanceof Timestamp ? formatDate(guide.updatedAt) : String(guide.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

function InfoItem({ icon, label, children }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-base font-medium text-gray-900">{children}</p>
      </div>
    </div>
  )
}

interface EditFormProps {
  provinces: { value: string; label: string }[]
  provincesLoading: boolean
  fullName: string
  setFullName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  cardNumber: string
  setCardNumber: (value: string) => void
  expiryDate: string
  setExpiryDate: (value: string) => void
  issuingPlace: string
  setIssuingPlace: (value: string) => void
  cardType: 'domestic' | 'international'
  setCardType: (value: 'domestic' | 'international') => void
  experienceYears: number
  setExperienceYears: (value: number) => void
  languages: string
  setLanguages: (value: string) => void
  searching: boolean
  searchMessage: string
  onSearch: () => void
  saving: boolean
  onSave: (event: React.FormEvent) => void
  onCancel: () => void
  error: string
  success: string
}

function EditForm({
  provinces,
  provincesLoading,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  cardNumber,
  setCardNumber,
  expiryDate,
  setExpiryDate,
  issuingPlace,
  setIssuingPlace,
  cardType,
  setCardType,
  experienceYears,
  setExperienceYears,
  languages,
  setLanguages,
  searching,
  searchMessage,
  onSearch,
  saving,
  onSave,
  onCancel,
  error,
  success,
}: EditFormProps) {
  return (
    <form onSubmit={onSave} className="p-6 bg-white space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email liên hệ <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số thẻ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={onSearch}
              disabled={searching || !cardNumber.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Tra cứu
            </button>
          </div>
          {searchMessage && <p className="mt-2 text-sm text-blue-600">{searchMessage}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày hết hạn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
            title="Định dạng dd/mm/yyyy"
            placeholder="dd/mm/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nơi cấp thẻ <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={[{ value: '', label: 'Chọn tỉnh/thành...' }, ...provinces]}
            value={issuingPlace}
            onChange={setIssuingPlace}
            placeholder="Chọn tỉnh/thành..."
            required
          />
          {provincesLoading && <p className="text-xs text-gray-500 mt-1">Đang tải danh sách tỉnh/thành...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại thẻ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="domestic" checked={cardType === 'domestic'} onChange={() => setCardType('domestic')} />
              Nội địa
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="international"
                checked={cardType === 'international'}
                onChange={() => setCardType('international')}
              />
              Quốc tế
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kinh nghiệm (số năm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
            min={0}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ngoại ngữ sử dụng</label>
          <input
            type="text"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="VD: English, French"
          />
          <p className="text-xs text-gray-500 mt-1">Ngăn cách nhiều ngoại ngữ bằng dấu phẩy.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={saving}
        >
          <X className="w-4 h-4" />
          Huỷ
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}
