import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Sổ Tay HDV
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Trang chủ
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Bài của tôi
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin/master-data"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Master Data
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
