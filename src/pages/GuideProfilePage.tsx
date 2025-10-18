import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { GuideProfile } from '@/types'
import { formatDate } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import Combobox from '@/components/Combobox'
import { useProvinces } from '@/hooks/useProvinces'
import { searchGuideByCardNumber, parseVietnameseDate } from '@/services/guideInfoService'
import { resolveProvinceName } from '@/utils/provinceMatching'
import { BadgeCheck, Calendar, MapPin, Award, Save, Edit2, AlertCircle, Search, Loader2, Mail, Users } from 'lucide-react'

export default function GuideProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { provinces, loading: provincesLoading } = useProvinces()
  const [profile, setProfile] = useState<GuideProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')

  // Form fields
  const [fullName, setFullName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [email, setEmail] = useState('')
  const [languages, setLanguages] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [issuingPlace, setIssuingPlace] = useState('')
  const [cardType, setCardType] = useState<'domestic' | 'international'>('domestic')
  const [experienceYears, setExperienceYears] = useState(0)
  const resolveProvinceValue = (raw: string) => resolveProvinceName(raw, provinces)
  useEffect(() => {
    if (!issuingPlace || provinces.length === 0) return
    const resolved = resolveProvinceValue(issuingPlace)
    if (resolved && resolved !== issuingPlace) {
      setIssuingPlace(resolved)
    }
  }, [issuingPlace, provinces])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const docRef = doc(db, 'guide_profiles', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as GuideProfile
        setProfile(data)
        populateForm(data)
      } else {
        setIsEditing(true) // New profile, start in edit mode
        setEmail(user.email || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Lỗi khi tải hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (data: GuideProfile) => {
    setFullName(data.fullName)
    setCardNumber(data.cardNumber)
    setEmail(data.email || '')
    setExpiryDate(formatDate(data.expiryDate))
    setIssuingPlace(data.issuingPlace)
    setCardType(data.cardType)
    setExperienceYears(data.experienceYears)
    setLanguages(data.languages && data.languages.length > 0 ? data.languages.join(', ') : '')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const normalizedEmail = email.trim()
      const normalizedLanguages = languages
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean)

      const userInfo = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || undefined,
      }

      const parsedExpiry = parseVietnameseDate(expiryDate)
      if (!parsedExpiry) {
        throw new Error('INVALID_DATE')
      }

      const docRef = doc(db, 'guide_profiles', user.uid)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists() ? (existingSnap.data() as GuideProfile) : null

      const profileData = {
        userId: user.uid,
        fullName,
        email: normalizedEmail || null,
        cardNumber,
        expiryDate: Timestamp.fromDate(parsedExpiry),
        issuingPlace,
        cardType,
        experienceYears,
        languages: normalizedLanguages.length > 0 ? normalizedLanguages : null,
        updatedAt: Timestamp.now(),
        updatedBy: userInfo,
        createdAt: existingData?.createdAt ?? Timestamp.now(),
        createdBy: existingData?.createdBy ?? userInfo,
        lastExpiryNotificationAt: existingData?.lastExpiryNotificationAt ?? null,
      }

      await setDoc(docRef, profileData)
      setSuccess(existingSnap.exists() ? 'Cập nhật hồ sơ thành công!' : 'Tạo hồ sơ thành công!')

      setIsEditing(false)
      await loadProfile()
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error && err.message === 'INVALID_DATE' ? 'Ngày hết hạn không hợp lệ (định dạng dd/mm/yyyy)' : 'Lỗi khi lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  const handleSearchGuideInfo = async () => {
    if (!cardNumber || cardNumber.trim().length === 0) {
      setSearchMessage('Vui lòng nhập số thẻ')
      return
    }

    setSearching(true)
    setSearchMessage('')
    setError('')

    try {
      const guideInfo = await searchGuideByCardNumber(cardNumber)

      if (guideInfo) {
        // Auto-fill the form with found data
        if (guideInfo.fullName) {
          setFullName(guideInfo.fullName)
        }
        if (guideInfo.issuingPlace) {
          setIssuingPlace(resolveProvinceValue(guideInfo.issuingPlace))
        }
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
            setExpiryDate(formatDate(parsedDate))
          }
        }

        setSearchMessage('✓ Đã tìm thấy và điền thông tin tự động')
        setTimeout(() => setSearchMessage(''), 5000)
      } else {
        setSearchMessage('Không tìm thấy thông tin cho số thẻ này')
        setTimeout(() => setSearchMessage(''), 5000)
      }
    } catch (err) {
      console.error('Error searching guide info:', err)
      setSearchMessage('Lỗi khi tìm kiếm thông tin')
      setTimeout(() => setSearchMessage(''), 5000)
    } finally {
      setSearching(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!profile) return null
    const today = new Date()
    const expiry = profile.expiryDate.toDate()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const showExpiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 30

  if (loading || provincesLoading) return <Loading />

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Bạn cần đăng nhập để quản lý hồ sơ</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-bold">Hồ Sơ Hướng Dẫn Viên</h1>
                  <p className="text-blue-100 text-sm">Quản lý thông tin thẻ HDV của bạn</p>
                </div>
              </div>
              {profile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Expiry Warning */}
          {showExpiryWarning && !isEditing && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 m-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Thẻ sắp hết hạn!</p>
                  <p className="text-sm text-amber-700">
                    Thẻ của bạn sẽ hết hạn trong {daysUntilExpiry} ngày ({formatDate(profile!.expiryDate)})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: HOÀNG THỊ HƯƠNG SEN"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: hdv@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số thẻ <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VD: 201203368"
                    />
                    <button
                      type="button"
                      onClick={handleSearchGuideInfo}
                      disabled={searching || !cardNumber}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Tìm thông tin từ huongdanvien.vn"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Đang tìm...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">Tìm thông tin</span>
                        </>
                      )}
                    </button>
                  </div>
                  {searchMessage && (
                    <p className={`mt-2 text-sm ${searchMessage.includes('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                      {searchMessage}
                    </p>
                  )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nơi cấp thẻ <span className="text-red-500">*</span>
                  </label>
                  <Combobox
                    options={provinces}
                    value={issuingPlace}
                    onChange={setIssuingPlace}
                    placeholder="Chọn tỉnh/thành phố..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại thẻ <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="domestic"
                        checked={cardType === 'domestic'}
                        onChange={() => setCardType('domestic')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Nội địa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="international"
                        checked={cardType === 'international'}
                        onChange={() => setCardType('international')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Quốc tế</span>
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
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngoại ngữ sử dụng
                  </label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: English, French"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ngăn cách nhiều ngoại ngữ bằng dấu phẩy.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </button>
                  {profile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        populateForm(profile)
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            ) : profile ? (
              <div className="space-y-6">
                {/* Display mode */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Họ và tên</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{profile.fullName}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email liên hệ</span>
                    </div>
                    {profile.email ? (
                      <a
                        href={`mailto:${profile.email}`}
                        className="text-lg font-semibold text-blue-600 hover:underline break-words"
                      >
                        {profile.email}
                      </a>
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">Chưa cập nhật</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Số thẻ</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{profile.cardNumber}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Ngày hết hạn</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(profile.expiryDate)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Nơi cấp thẻ</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{profile.issuingPlace}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Loại thẻ</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile.cardType === 'domestic' ? 'Nội địa' : 'Quốc tế'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">Kinh nghiệm</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{profile.experienceYears} năm</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Ngoại ngữ sử dụng</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile.languages && profile.languages.length > 0
                        ? profile.languages.join(', ')
                        : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="border-t pt-4 text-sm text-gray-600">
                  <div>Cập nhật lần cuối: {formatDate(profile.updatedAt)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BadgeCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">Bạn chưa có hồ sơ hướng dẫn viên</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
