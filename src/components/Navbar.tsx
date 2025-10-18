import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex flex-wrap justify-between items-center gap-3 py-3 md:py-0 md:h-16">
          <Link to="/" className="text-lg md:text-xl font-bold text-blue-600">
            Sổ Tay HDV
          </Link>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>

            <Link to="/guides" className="text-gray-700 hover:text-blue-600 transition-colors">
              Guides
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Bài của tôi
                </Link>

                <Link
                  to="/my-guide-profile"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Hồ sơ HDV
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin/master-data"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Master Data
                  </Link>
                )}

                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-gray-600">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
