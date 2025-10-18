import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GuideProfile } from '@/types'
import { formatDate } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import Combobox from '@/components/Combobox'
import { useProvinces, ProvinceOption } from '@/hooks/useProvinces'
import { useAuth } from '@/contexts/AuthContext'
import { searchGuideByCardNumber, parseVietnameseDate } from '@/services/guideInfoService'
import { resolveProvinceName } from '@/utils/provinceMatching'
import {
  BadgeCheck,
  MapPin,
  Award,
  Calendar,
  Search,
  Users,
  Mail,
  Phone,
  FilterX,
  PlusCircle,
  Loader2,
  X,
  Save,
} from 'lucide-react'

export default function GuidesListPage() {
  const navigate = useNavigate()
  const [guides, setGuides] = useState<GuideProfile[]>([])
  const [filteredGuides, setFilteredGuides] = useState<GuideProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCardType, setSelectedCardType] = useState<'domestic' | 'international' | ''>('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [cardNumberQuery, setCardNumberQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { provinces, loading: provincesLoading } = useProvinces()
  const { user } = useAuth()

  const loadGuides = useCallback(async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'guide_profiles'), orderBy('fullName', 'asc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GuideProfile))
      setGuides(data)
      setFilteredGuides(data)
    } catch (err) {
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGuides()
  }, [loadGuides])

  useEffect(() => {
    filterGuides()
  }, [selectedProvince, selectedCardType, selectedLanguage, nameQuery, cardNumberQuery, guides])

  const languageOptions = useMemo(() => {
    const set = new Set<string>()
    guides.forEach((guide) => {
      if (guide.languages && guide.languages.length > 0) {
        guide.languages.forEach((lang) => set.add(lang))
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [guides])

  const filterGuides = () => {
    let result = [...guides]

    if (selectedProvince) {
      const query = selectedProvince.toLowerCase()
      result = result.filter((guide) => guide.issuingPlace.toLowerCase().includes(query))
    }

    if (selectedCardType) {
      result = result.filter((guide) => guide.cardType === selectedCardType)
    }

    if (selectedLanguage) {
      const query = selectedLanguage.toLowerCase()
      result = result.filter((guide) =>
        (guide.languages || []).some((lang) => lang.toLowerCase() === query)
      )
    }

    if (nameQuery) {
      const query = nameQuery.toLowerCase()
      result = result.filter((guide) => guide.fullName.toLowerCase().includes(query))
    }

    if (cardNumberQuery) {
      const query = cardNumberQuery.toLowerCase()
      result = result.filter((guide) => guide.cardNumber.toLowerCase().includes(query))
    }

    setFilteredGuides(result)
  }

  const resetFilters = () => {
    setSelectedProvince('')
    setSelectedCardType('')
    setSelectedLanguage('')
    setNameQuery('')
    setCardNumberQuery('')
  }

  const hasActiveFilters = Boolean(
    selectedProvince || selectedCardType || selectedLanguage || nameQuery || cardNumberQuery
  )

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)
    }
    return name.charAt(0)
  }

  const getDaysUntilExpiry = (expiryDate: any) => {
    const today = new Date()
    const expiry = expiryDate.toDate()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) return <Loading />

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Danh Sách Hướng Dẫn Viên</h1>
              </div>
              <p className="text-gray-600">
                Tổng số: <span className="font-semibold">{filteredGuides.length}</span> hướng dẫn viên
              </p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Thêm mới HDV
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Đăng nhập để thêm
              </Link>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Tra cứu hướng dẫn viên</h2>
          </div>
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh cấp thẻ</label>
              <Combobox
                options={[{ value: '', label: 'Tất cả' }, ...provinces]}
                value={selectedProvince}
                onChange={setSelectedProvince}
                placeholder="Chọn tỉnh/thành..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại thẻ</label>
              <select
                value={selectedCardType}
                onChange={(e) => setSelectedCardType(e.target.value as 'domestic' | 'international' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="domestic">Nội địa</option>
                <option value="international">Quốc tế</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngoại ngữ sử dụng</label>
              <Combobox
                options={[{ value: '', label: 'Tất cả' }, ...languageOptions.map((lang) => ({ value: lang, label: lang }))]}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                placeholder="Chọn ngoại ngữ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên hướng dẫn viên"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số thẻ hướng dẫn viên</label>
              <input
                type="text"
                value={cardNumberQuery}
                onChange={(e) => setCardNumberQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số thẻ"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <FilterX className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {hasActiveFilters ? 'Không tìm thấy hướng dẫn viên nào' : 'Chưa có hướng dẫn viên nào'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Compact horizontal cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredGuides.map((guide) => {
                const daysUntilExpiry = getDaysUntilExpiry(guide.expiryDate)
                const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
                const isExpired = daysUntilExpiry <= 0

                return (
                  <div
                    key={guide.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => guide.id && navigate(`/guides/${guide.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        guide.id && navigate(`/guides/${guide.id}`)
                      }
                    }}
                    className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer flex"
                  >
                    {/* Left side - Avatar & Type Badge */}
                    <div
                      className={`w-24 flex-shrink-0 p-3 flex flex-col items-center justify-center gap-2 ${
                        guide.cardType === 'international'
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      }`}
                    >
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-base">
                          {getInitials(guide.fullName)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3 text-white" />
                        <span className="text-xs text-white font-medium">
                          {guide.cardType === 'domestic' ? 'Nội địa' : 'Quốc tế'}
                        </span>
                      </div>
                    </div>

                    {/* Right side - Content */}
                    <div className="flex-1 p-2.5 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                          {guide.fullName}
                        </h3>

                        <p className="text-xs text-gray-600 mb-1 truncate">{guide.cardNumber}</p>

                        {isExpired && (
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-red-600 flex-shrink-0" />
                            <span className="text-xs text-red-700 font-medium">Thẻ đã hết hạn</span>
                          </div>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span className="text-xs text-amber-700 font-medium">
                              Còn {daysUntilExpiry} ngày
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{guide.issuingPlace}</span>
                        </div>

                        {guide.phone && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{guide.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View - Original grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => {
                const daysUntilExpiry = getDaysUntilExpiry(guide.expiryDate)
                const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
                const isExpired = daysUntilExpiry <= 0

                return (
                  <div
                    key={guide.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => guide.id && navigate(`/guides/${guide.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        guide.id && navigate(`/guides/${guide.id}`)
                      }
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                  >
                  {/* Card Header with Type Badge */}
                  <div
                    className={`p-4 ${
                      guide.cardType === 'international'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-white">
                        <BadgeCheck className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {guide.cardType === 'domestic' ? 'Thẻ Nội địa' : 'Thẻ Quốc tế'}
                        </span>
                      </div>
                      {guide.experienceYears > 0 && (
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Award className="w-4 h-4 text-white" />
                          <span className="text-xs text-white font-medium">{guide.experienceYears} năm</span>
                        </div>
                      )}
                    </div>

                    {/* Avatar and Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {getInitials(guide.fullName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{guide.fullName}</h3>
                        <p className="text-sm text-white/90">{guide.cardNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Expiry Warning */}
                    {isExpired && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-xs text-red-700 font-medium">Thẻ đã hết hạn</span>
                      </div>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs text-amber-700 font-medium">
                          Còn {daysUntilExpiry} ngày
                        </span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="text-gray-500">Hết hạn</div>
                          <div className="font-medium text-gray-900">
                            {formatDate(guide.expiryDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="text-gray-500">Nơi cấp</div>
                          <div className="font-medium text-gray-900">{guide.issuingPlace}</div>
                        </div>
                      </div>

                      {guide.phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="text-gray-500">Điện thoại</div>
                            <a
                              href={`tel:${guide.phone}`}
                              className="font-medium text-blue-600 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              {guide.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {guide.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="text-gray-500">Email</div>
                          <a
                            href={`mailto:${guide.email}`}
                            className="font-medium text-blue-600 hover:underline break-words"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            {guide.email}
                          </a>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>

      {showCreateDialog && (
        <GuideProfileCreateDialog
          provinces={provinces}
          provincesLoading={provincesLoading}
          onClose={() => setShowCreateDialog(false)}
          onCreated={async () => {
            await loadGuides()
          }}
        />
      )}
    </Layout>
  )
}

interface GuideProfileCreateDialogProps {
  provinces: ProvinceOption[]
  provincesLoading: boolean
  onClose: () => void
  onCreated: () => Promise<void> | void
}

function GuideProfileCreateDialog({ provinces, provincesLoading, onClose, onCreated }: GuideProfileCreateDialogProps) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
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
  const [error, setError] = useState('')

  const resolveProvinceValue = (raw: string) => resolveProvinceName(raw, provinces)

  useEffect(() => {
    if (!issuingPlace || provinces.length === 0) return
    const resolved = resolveProvinceValue(issuingPlace)
    if (resolved && resolved !== issuingPlace) {
      setIssuingPlace(resolved)
    }
  }, [issuingPlace, provinces])

  const handleSearchGuideInfo = async () => {
    if (!cardNumber.trim()) {
      setSearchMessage('Vui lòng nhập số thẻ')
      return
    }

    setSearching(true)
    setSearchMessage('')
    setError('')

    try {
      const guideInfo = await searchGuideByCardNumber(cardNumber)

      if (guideInfo) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Bạn cần đăng nhập để tạo hồ sơ')
      return
    }

    const normalizedEmail = email.trim()
    const normalizedPhone = phone.trim()
    const normalizedLanguages = languages
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean)

    const parsedExpiry = parseVietnameseDate(expiryDate)
    if (!parsedExpiry) {
      setError('Ngày hết hạn không hợp lệ (định dạng dd/mm/yyyy)')
      return
    }

    setSaving(true)
    setError('')

    try {
      const userInfo = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || undefined,
      }

      const baseData = {
        userId: user.uid,
        fullName,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        cardNumber,
        expiryDate: Timestamp.fromDate(parsedExpiry),
        issuingPlace,
        cardType,
        experienceYears,
        languages: normalizedLanguages.length > 0 ? normalizedLanguages : null,
        updatedAt: Timestamp.now(),
        updatedBy: userInfo,
      }

      const docRef = doc(db, 'guide_profiles', user.uid)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists() ? (existingSnap.data() as GuideProfile) : null

      const payload = {
        ...baseData,
        createdAt: existingData?.createdAt ?? Timestamp.now(),
        createdBy: existingData?.createdBy ?? userInfo,
        lastExpiryNotificationAt: existingData?.lastExpiryNotificationAt ?? null,
      }

      await setDoc(docRef, payload)

      await onCreated()
      onClose()
    } catch (err) {
      console.error('Error saving guide profile:', err)
      setError('Lỗi khi lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-sm text-blue-600 font-semibold">Thêm mới hồ sơ hướng dẫn viên</p>
            <h2 className="text-2xl font-bold text-gray-900">Thông tin thẻ HDV</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Bạn cần đăng nhập để tạo hồ sơ hướng dẫn viên.</p>
              <Link
                to="/login"
                className="inline-flex mt-4 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={onClose}
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
              )}

              <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
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
                      onClick={handleSearchGuideInfo}
                      disabled={searching || !cardNumber.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Tra cứu
                    </button>
                  </div>
                  {searchMessage && (
                    <p className="mt-2 text-sm text-blue-600">{searchMessage}</p>
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
                  {provincesLoading && (
                    <p className="text-xs text-gray-500 mt-1">Đang tải danh sách tỉnh/thành...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại thẻ <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="domestic"
                        checked={cardType === 'domestic'}
                        onChange={() => setCardType('domestic')}
                      />
                      Nội địa
                    </label>
                    <label className="flex items-center gap-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngoại ngữ sử dụng
                  </label>
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
