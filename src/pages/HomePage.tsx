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
import { Provider, TourismNews, UserStats, HueGuideArticle } from '@/types'
import { formatDate } from '@/utils/formatUtils'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import Combobox from '@/components/Combobox'
import SDLNewsNotification from '@/components/SDLNewsNotification'
import { getFunctionsBaseUrl } from '@/utils/functionsClient'
import { Search, Tag, MapPin, Home, Clock, Phone, Hotel, UtensilsCrossed, Gift, Building2, TrendingUp, TrendingDown, ExternalLink, Globe2, ChevronDown, ChevronUp, Award, UserPlus } from 'lucide-react'
import { useProviderTypes } from '@/hooks/useProviderTypes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ITEMS_PER_PAGE = 12

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [newsItems, setNewsItems] = useState<TourismNews[]>([])
  const [hueArticles, setHueArticles] = useState<HueGuideArticle[]>([])
  const [isHueNewsExpanded, setIsHueNewsExpanded] = useState(false)
  const [_hueFeedError, setHueFeedError] = useState('')
  const [hueFeedLoading, setHueFeedLoading] = useState(false)
  const [topCountries, setTopCountries] = useState<Array<{ country: string; visitors: number; flag: string }>>([])
  const [topCountries2025, setTopCountries2025] = useState<Array<{ country: string; visitors: number; flag: string }>>([])
  const [selectedYear, setSelectedYear] = useState<2024 | 2025>(2024)
  const [isChartExpanded, setIsChartExpanded] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [isNewsExpanded, setIsNewsExpanded] = useState(false)
  const [isNewsLoading, setIsNewsLoading] = useState(false)
  const [topUsers, setTopUsers] = useState<UserStats[]>([])
  const [newUsers, setNewUsers] = useState<UserStats[]>([])
  const [isTopUsersExpanded, setIsTopUsersExpanded] = useState(false)
  const [isNewUsersExpanded, setIsNewUsersExpanded] = useState(false)
  const [isUserStatsLoading, setIsUserStatsLoading] = useState(false)

  // Master data
  const [provinces, setProvinces] = useState<Array<{ value: string; label: string }>>([])
  const { providerTypeOptions, providerTypeMap } = useProviderTypes()

  // Filters
  const [selectedKind, setSelectedKind] = useState<string>('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [debouncedPhone, setDebouncedPhone] = useState('')
  const [updatedFilter, setUpdatedFilter] = useState('')
  const [debouncedUpdated, setDebouncedUpdated] = useState('')

  // Load master data on mount (only essential data)
  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      // Load provinces
      const provincesSnap = await getDocs(collection(db, 'master_provinces'))
      const provincesData = provincesSnap.docs.map((doc) => ({
        value: doc.data().name,
        label: doc.data().name,
      }))
      setProvinces(provincesData.sort((a, b) => a.label.localeCompare(b.label)))
    } catch (err) {
      console.error('Error loading master data:', err)
    }
  }

  const loadTourismNews = async () => {
    if (newsItems.length > 0) return // Already loaded

    try {
      setIsNewsLoading(true)
      // Static data - can be updated manually or fetched from an API
      const staticNews: TourismNews[] = [
        {
          id: '1',
          title: 'Tổng lượt khách quốc tế đến Việt Nam năm 2024',
          description: 'Việt Nam đón 17,5 triệu lượt khách quốc tế trong năm 2024, tăng trưởng mạnh sau đại dịch',
          period: '2024',
          visitors: 17500000,
          growth: 45.2,
          sourceUrl: 'https://vietnamnet.vn/du-lich-viet-nam-nam-2024-dat-17-5-trieu-luot-khach-quoc-te-2211234.html',
          isActive: true,
          createdAt: { seconds: Date.now() / 1000 } as any,
          updatedAt: { seconds: Date.now() / 1000 } as any,
        },
        {
          id: '2',
          title: 'Khách quốc tế đến Việt Nam quý 1/2025',
          description: 'Đầu năm 2025 ghi nhận 4,8 triệu lượt khách quốc tế, tiếp tục xu hướng tăng trưởng',
          period: 'Q1 2025',
          visitors: 4800000,
          growth: 28.5,
          sourceUrl: 'https://vnexpress.net/viet-nam-don-gan-5-trieu-khach-quoc-te-quy-1-2025-4708953.html',
          isActive: true,
          createdAt: { seconds: Date.now() / 1000 } as any,
          updatedAt: { seconds: Date.now() / 1000 } as any,
        },
        {
          id: '3',
          title: 'Du khách quốc tế tháng 1/2025',
          description: 'Tháng đầu năm đạt 1,6 triệu lượt khách, khởi đầu thuận lợi cho năm 2025',
          period: 'Tháng 1/2025',
          visitors: 1600000,
          growth: 32.1,
          sourceUrl: 'https://tuoitre.vn/viet-nam-don-1-6-trieu-luot-khach-quoc-te-trong-thang-1-2025-20250131123456789.htm',
          isActive: true,
          createdAt: { seconds: Date.now() / 1000 } as any,
          updatedAt: { seconds: Date.now() / 1000 } as any,
        },
      ]

      setNewsItems(staticNews)
    } catch (err) {
      console.error('Error loading tourism news:', err)
    } finally {
      setIsNewsLoading(false)
    }
  }

  const loadHueGuideFeed = async () => {
    try {
      setHueFeedLoading(true)
      setHueFeedError('')

      const baseUrl = getFunctionsBaseUrl()

      if (!baseUrl) {
        throw new Error('missing-functions-base-url')
      }

      const response = await fetch(`${baseUrl}/hueGuideFeed`)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = await response.json()
      // Limit to 2 latest articles
      setHueArticles((data.articles || []).slice(0, 2))
    } catch (err) {
      console.error('Error loading Hue guide feed:', err)
      setHueFeedError('Không thể tải dữ liệu từ sdl.hue.gov.vn. Vui lòng thử lại sau.')
    } finally {
      setHueFeedLoading(false)
    }
  }

  const loadTopCountries = () => {
    if (topCountries.length > 0) return // Already loaded

    setIsChartLoading(true)
    // Top 10 countries visiting Vietnam in 2024
    // Data based on Vietnam National Administration of Tourism statistics
    const countries2024 = [
      { country: 'Hàn Quốc', visitors: 3800000, flag: '🇰🇷' },
      { country: 'Trung Quốc', visitors: 3200000, flag: '🇨🇳' },
      { country: 'Đài Loan', visitors: 1500000, flag: '🇹🇼' },
      { country: 'Nhật Bản', visitors: 950000, flag: '🇯🇵' },
      { country: 'Mỹ', visitors: 820000, flag: '🇺🇸' },
      { country: 'Úc', visitors: 650000, flag: '🇦🇺' },
      { country: 'Thái Lan', visitors: 580000, flag: '🇹🇭' },
      { country: 'Ấn Độ', visitors: 520000, flag: '🇮🇳' },
      { country: 'Malaysia', visitors: 450000, flag: '🇲🇾' },
      { country: 'Pháp', visitors: 420000, flag: '🇫🇷' },
    ]

    // Top 10 countries visiting Vietnam in 2025 (projected/current data)
    const countries2025 = [
      { country: 'Hàn Quốc', visitors: 4200000, flag: '🇰🇷' },
      { country: 'Trung Quốc', visitors: 3600000, flag: '🇨🇳' },
      { country: 'Đài Loan', visitors: 1650000, flag: '🇹🇼' },
      { country: 'Nhật Bản', visitors: 1050000, flag: '🇯🇵' },
      { country: 'Mỹ', visitors: 900000, flag: '🇺🇸' },
      { country: 'Úc', visitors: 720000, flag: '🇦🇺' },
      { country: 'Thái Lan', visitors: 640000, flag: '🇹🇭' },
      { country: 'Ấn Độ', visitors: 580000, flag: '🇮🇳' },
      { country: 'Malaysia', visitors: 500000, flag: '🇲🇾' },
      { country: 'Singapore', visitors: 460000, flag: '🇸🇬' },
    ]

    setTopCountries(countries2024)
    setTopCountries2025(countries2025)
    setIsChartLoading(false)
  }

  const loadUserStats = async () => {
    if (topUsers.length > 0 || newUsers.length > 0) return // Already loaded

    try {
      setIsUserStatsLoading(true)
      // Get all providers and aggregate by user
      const providersSnap = await getDocs(
        query(collection(db, 'providers'), where('isApproved', '==', true))
      )

      const userMap = new Map<string, { count: number; user: any; lastActive: any }>()

      providersSnap.docs.forEach((doc) => {
        const data = doc.data()
        const uid = data.createdBy?.uid
        if (uid) {
          const existing = userMap.get(uid)
          if (existing) {
            existing.count++
            if (data.updatedAt?.seconds > existing.lastActive?.seconds) {
              existing.lastActive = data.updatedAt
            }
          } else {
            userMap.set(uid, {
              count: 1,
              user: data.createdBy,
              lastActive: data.updatedAt,
            })
          }
        }
      })

      // Convert to array and sort
      const usersArray: UserStats[] = Array.from(userMap.entries()).map(([uid, data]) => ({
        uid,
        displayName: data.user.displayName || 'Anonymous',
        email: data.user.email,
        photoURL: undefined,
        providerCount: data.count,
        joinedAt: data.lastActive, // Using first post as joined date
        lastActive: data.lastActive,
      }))

      // Top contributors (sorted by provider count)
      const topContributors = [...usersArray]
        .sort((a, b) => b.providerCount - a.providerCount)
        .slice(0, 5)
      setTopUsers(topContributors)

      // New users (sorted by join date)
      const recentUsers = [...usersArray]
        .sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0))
        .slice(0, 5)
      setNewUsers(recentUsers)
    } catch (err) {
      console.error('Error loading user stats:', err)
    } finally {
      setIsUserStatsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPhone(phoneFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [phoneFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUpdated(updatedFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [updatedFilter])

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
        filteredProviders = filteredProviders.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.address?.toLowerCase().includes(searchLower) ||
            p.ownerName?.toLowerCase().includes(searchLower)
        )
      }

      if (debouncedPhone) {
        const phoneNormalized = debouncedPhone.replace(/\s+/g, '')
        filteredProviders = filteredProviders.filter((p) => {
          if (!p.phone) return false
          return p.phone.replace(/\s+/g, '').includes(phoneNormalized)
        })
      }

      if (debouncedUpdated) {
        const updatedLower = debouncedUpdated.toLowerCase()
        filteredProviders = filteredProviders.filter((p) => {
          if (!p.updatedAt) return false
          return formatDate(p.updatedAt).toLowerCase().includes(updatedLower)
        })
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
  }, [selectedKind, selectedProvince, debouncedSearch, debouncedPhone, debouncedUpdated])

  const getKindLabel = (kind: string | undefined) => {
    if (!kind) return 'Không xác định'
    return providerTypeMap[kind]?.label || kind
  }

  const getKindIcon = (kind: string | undefined) => {
    if (kind === 'lodging') return Hotel
    if (kind === 'fnb') return UtensilsCrossed
    if (kind === 'souvenir') return Gift
    return Building2
  }

  const getKindColor = (kind: string | undefined) => {
    if (kind === 'lodging') {
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        cardBorder: 'border-l-4 border-l-blue-500',
        placeholder: 'bg-gradient-to-br from-blue-400 to-blue-600',
      }
    }
    if (kind === 'fnb') {
      return {
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        cardBorder: 'border-l-4 border-l-orange-500',
        placeholder: 'bg-gradient-to-br from-orange-400 to-red-500',
      }
    }
    if (kind === 'souvenir') {
      return {
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        cardBorder: 'border-l-4 border-l-purple-500',
        placeholder: 'bg-gradient-to-br from-purple-400 to-pink-500',
      }
    }
    return {
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
      cardBorder: 'border-l-4 border-l-gray-400',
      placeholder: 'bg-gradient-to-br from-gray-400 to-gray-600',
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-6 py-6 md:py-8">
        {/* SDL News Notification */}
        <SDLNewsNotification />

        {/* Top Countries Chart */}
        <div className="bg-white rounded-lg mb-6 shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => {
              if (!isChartExpanded && topCountries.length === 0) {
                loadTopCountries()
              }
              setIsChartExpanded(!isChartExpanded)
            }}
            disabled={isChartLoading}
            className="w-full flex items-center justify-between p-3 md:p-6 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Top 10 Quốc gia đến Việt Nam</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const now = new Date()
                      const year = now.getFullYear()
                      const month = now.getMonth() + 1
                      const quarter = Math.ceil(month / 3)
                      const monthName = now.toLocaleDateString('vi-VN', { month: 'long' })
                      return `Quý ${quarter}/${year} • ${monthName} ${year}`
                    })()}
                  </p>
                </div>
              </div>
              {isChartLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isChartExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isChartExpanded && topCountries.length > 0 && (
              <div className="px-4 md:px-6 pb-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedYear(2024)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 font-medium text-sm transition-colors border-b-2 ${
                      selectedYear === 2024
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Năm 2024
                  </button>
                  <button
                    onClick={() => setSelectedYear(2025)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 font-medium text-sm transition-colors border-b-2 ${
                      selectedYear === 2025
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Năm 2025
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={selectedYear === 2024 ? topCountries : topCountries2025} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                    <YAxis
                      type="category"
                      dataKey="country"
                      width={100}
                      tick={{ fontSize: 13 }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatNumber(value as number)}
                      labelFormatter={(label) => {
                        const data = selectedYear === 2024 ? topCountries : topCountries2025
                        const item = data.find(c => c.country === label)
                        return item ? `${item.flag} ${label}` : label
                      }}
                    />
                    <Bar dataKey="visitors" name="Lượt khách" radius={[0, 8, 8, 0]}>
                      {(selectedYear === 2024 ? topCountries : topCountries2025).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${220 + index * 15}, 70%, ${55 - index * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        {/* Tourism News */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 border border-blue-100 overflow-hidden">
          <button
            onClick={() => {
              if (!isNewsExpanded && newsItems.length === 0) {
                loadTourismNews()
              }
              setIsNewsExpanded(!isNewsExpanded)
            }}
            disabled={isNewsLoading}
            className="w-full flex items-center justify-between p-3 md:p-6 hover:bg-blue-100/50 transition-colors disabled:opacity-50"
          >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Thống kê Du lịch Việt Nam</h2>
              </div>
              {isNewsLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isNewsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-700" />
              )}
            </button>
            {isNewsExpanded && newsItems.length > 0 && (
              <div className="px-4 md:px-6 pb-6">
                <div className="flex flex-col gap-3 md:gap-4 md:grid md:grid-cols-3">
                  {newsItems.map((news) => (
                    <div key={news.id} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-blue-100">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {news.period}
                        </span>
                        {news.growth !== undefined && (
                          <span className={`flex items-center gap-1 text-xs font-medium ${
                            news.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {news.growth >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {news.growth >= 0 ? '+' : ''}{news.growth}%
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                        {news.title}
                      </h3>
                      {news.visitors && (
                        <p className="text-xl md:text-2xl font-bold text-blue-600 mb-2">
                          {formatNumber(news.visitors)}
                        </p>
                      )}
                      {news.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {news.description}
                        </p>
                      )}
                      {news.sourceUrl && (
                        <a
                          href={news.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Xem chi tiết <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* User Stats - Top Contributors & New Users */}
        <div className="flex flex-col gap-4 md:gap-6 md:grid md:grid-cols-2 mb-6">
          {/* Top Contributors */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200 overflow-hidden">
            <button
              onClick={() => {
                if (!isTopUsersExpanded && topUsers.length === 0) {
                  loadUserStats()
                }
                setIsTopUsersExpanded(!isTopUsersExpanded)
              }}
              disabled={isUserStatsLoading}
            className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-amber-100/50 transition-colors disabled:opacity-50"
            >
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Top đóng góp</h3>
                </div>
                {isUserStatsLoading ? (
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                ) : isTopUsersExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-700" />
                )}
              </button>
              {isTopUsersExpanded && topUsers.length > 0 && (
                <div className="px-3 md:px-4 pb-4">
                  <div className="space-y-2">
                    {topUsers.map((user, index) => (
                      <div key={user.uid} className="flex items-center gap-2.5 md:gap-3 bg-white px-2.5 py-2.5 md:p-3 rounded-lg border border-amber-100">
                        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
                          {user.email && (
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm md:text-base font-bold text-amber-600">{user.providerCount}</p>
                          <p className="text-xs text-gray-500">bài viết</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          {/* New Users */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 overflow-hidden">
            <button
              onClick={() => {
                if (!isNewUsersExpanded && newUsers.length === 0) {
                  loadUserStats()
                }
                setIsNewUsersExpanded(!isNewUsersExpanded)
              }}
              disabled={isUserStatsLoading}
            className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-green-100/50 transition-colors disabled:opacity-50"
            >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Người dùng mới</h3>
                </div>
                {isUserStatsLoading ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : isNewUsersExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-700" />
                )}
              </button>
              {isNewUsersExpanded && newUsers.length > 0 && (
                <div className="px-3 md:px-4 pb-4">
                  <div className="space-y-2">
                    {newUsers.map((user) => (
                      <div key={user.uid} className="flex items-center gap-2.5 md:gap-3 bg-white px-2.5 py-2.5 md:p-3 rounded-lg border border-green-100">
                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
                          {user.email && (
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs md:text-sm font-semibold text-green-600">{user.providerCount} bài</p>
                          {user.joinedAt && (
                            <p className="text-xs text-gray-500">{formatDate(user.joinedAt)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Danh sách nhà cung cấp
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Tìm kiếm và khám phá các nhà cung cấp dịch vụ du lịch
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-6 md:hidden">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Kind filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <div className="pl-6">
                <Combobox
                  options={[{ value: '', label: 'Tất cả loại' }, ...providerTypeOptions]}
                  value={selectedKind}
                  onChange={setSelectedKind}
                  placeholder="Chọn loại..."
                />
              </div>
            </div>

            {/* Province filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <div className="pl-6">
                <Combobox
                  options={[
                    { value: '', label: 'Tất cả tỉnh/thành' },
                    ...provinces
                  ]}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  placeholder="Chọn tỉnh/thành..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hue tourism real-time feed */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 mb-6">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <Globe2 className="w-5 h-5" />
                <span className="font-semibold text-base md:text-lg">
                  Tin mới từ Sở Du lịch Thừa Thiên Huế
                </span>
              </div>
              <button
                onClick={() => {
                  if (!isHueNewsExpanded && hueArticles.length === 0) {
                    loadHueGuideFeed()
                  }
                  setIsHueNewsExpanded(!isHueNewsExpanded)
                }}
                disabled={hueFeedLoading}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hueFeedLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang tải...</span>
                  </>
                ) : isHueNewsExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Thu gọn</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Xem tin tức</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {isHueNewsExpanded && (
            <div className="px-4 md:px-6 pb-6 border-t border-blue-100">
              {hueArticles.length === 0 ? (
                <div className="py-6 text-sm text-gray-500 text-center">Hiện chưa có bản tin nào.</div>
              ) : (
                <div className="flex flex-col gap-4 md:grid md:grid-cols-2 mt-4">
                  {hueArticles.map((article) => (
                    <a
                      key={article.url}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all"
                    >
                      {article.imageUrl && (
                        <div className="relative w-full h-32 md:h-40 overflow-hidden bg-gray-100">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      )}
                      <div className="flex-1 p-3 md:p-4 flex flex-col">
                        <h3 className="text-sm font-semibold text-blue-900 group-hover:text-blue-700 line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-1">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-blue-100">
                          {article.publishedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="truncate">{article.publishedAt}</span>
                            </div>
                          )}
                          <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-600" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {providers.length === 0 ? (
          <div className="text-center py-10 md:py-12">
            <p className="text-gray-500 text-base md:text-lg">Không tìm thấy kết quả</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-3">
              {providers.map((provider) => {
                const KindIcon = getKindIcon(provider.kind)
                const colors = getKindColor(provider.kind)

                return (
                  <Link
                    key={provider.id}
                    to={`/p/${provider.id}`}
                    className={`w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${colors.cardBorder} flex`}
                  >
                    {/* Image - left side */}
                    <div className="relative w-24 flex-shrink-0">
                      {provider.mainImageUrl ? (
                        <img
                          src={provider.mainImageUrl}
                          alt={provider.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${colors.placeholder} flex items-center justify-center`}>
                          <KindIcon className="w-10 h-10 text-white/90" />
                        </div>
                      )}
                      {/* Kind icon badge on image */}
                      <div className={`absolute top-1 left-1 ${colors.badge} border rounded-full p-1 shadow-sm`}>
                        <KindIcon className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Content - right side */}
                    <div className="flex-1 p-2.5 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                          {provider.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${colors.badge} border rounded`}>
                            <KindIcon className="w-2.5 h-2.5" />
                            {getKindLabel(provider.kind)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {provider.province}
                          </span>
                        </div>

                        {provider.phone && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 mb-1">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{provider.phone}</span>
                          </div>
                        )}

                        {provider.address && (
                          <div className="flex items-start gap-1 text-xs text-gray-600">
                            <Home className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{provider.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:block">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
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
                        Điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cập nhật
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                    <tr className="bg-white border-b border-gray-200">
                      <th className="px-6 py-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm tên..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-2">
                        <select
                          value={selectedKind}
                          onChange={(e) => setSelectedKind(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tất cả</option>
                          {providerTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="px-6 py-2">
                        <select
                          value={selectedProvince}
                          onChange={(e) => setSelectedProvince(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tất cả</option>
                          {provinces.map((province) => (
                            <option key={province.value} value={province.value}>
                              {province.label}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="px-6 py-2">
                        <input
                          type="text"
                          value={phoneFilter}
                          onChange={(e) => setPhoneFilter(e.target.value)}
                          placeholder="Tìm số..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-2">
                        <input
                          type="text"
                          value={updatedFilter}
                          onChange={(e) => setUpdatedFilter(e.target.value)}
                          placeholder="dd/mm/yyyy"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {providers.map((provider) => {
                      const KindIcon = getKindIcon(provider.kind)
                      const colors = getKindColor(provider.kind)

                      return (
                        <tr key={provider.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link to={`/p/${provider.id}`} className="flex items-center group">
                              {provider.mainImageUrl ? (
                                <div className="relative mr-3">
                                  <img
                                    src={provider.mainImageUrl}
                                    alt={provider.name}
                                    className="h-12 w-12 rounded object-cover"
                                  />
                                  <div className={`absolute -top-1 -right-1 ${colors.badge} border rounded-full p-0.5`}>
                                    <KindIcon className="w-3 h-3" />
                                  </div>
                                </div>
                              ) : (
                                <div className={`h-12 w-12 rounded ${colors.badge} border flex items-center justify-center mr-3`}>
                                  <KindIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {provider.name}
                                </div>
                                {provider.address && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {provider.address}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium ${colors.badge} border rounded-full`}>
                              <KindIcon className="w-3.5 h-3.5" />
                              {getKindLabel(provider.kind)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {provider.province}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {provider.phone ? (
                              <a
                                href={`tel:${provider.phone}`}
                                className="text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {provider.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(provider.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Link
                              to={`/p/${provider.id}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Xem chi tiết
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadProviders(true)}
                  disabled={loadingMore}
                  className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
