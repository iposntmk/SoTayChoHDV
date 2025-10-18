import React, { useState } from 'react';
import { ExternalLink, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  date?: string;
}

const SDLNewsNotification: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadNews = async () => {
    try {
      setLoading(true);

      // Dữ liệu thông báo cập nhật từ sdl.hue.gov.vn
      const latestNews: NewsItem[] = [
        {
          title: "THÔNG BÁO KẾT QUẢ KHÓA 1 LỚP CẬP NHẬT KIẾN THỨC CHO HDV DU LỊCH NỘI ĐỊA VÀ HDV DU LỊCH QUỐC TẾ NĂM 2025 (14/3 – 16/3/2025)",
          link: "https://sdl.hue.gov.vn/thong-bao/thong-bao-ket-qua-khoa-1-lop-cap-nhat-kien-thuc-cho-hdv-du-lich-noi-dia-va-hdv-du-lich-quoc-te-nam-2025-14-3-16-3-2025.html",
          date: "2025-03-17"
        },
        {
          title: "Cập nhật kiến thức cho hướng dẫn viên du lịch nội địa và quốc tế khóa 2 - Năm 2025",
          link: "https://sdl.hue.gov.vn/hoat-dong-lanh-dao/cap-nhat-kien-thuc-cho-huong-dan-vien-du-lich-noi-dia-va-quoc-te-khoa-2-nam-2025.html"
        },
        {
          title: "Cập nhật kiến thức cho hướng dẫn viên du lịch nội địa và quốc tế khóa 1/2025",
          link: "https://sdl.hue.gov.vn/hoat-dong-don-vi/cap-nhat-kien-thuc-cho-huong-dan-vien-du-lich-noi-dia-va-quoc-te-khoa-1-2025.html"
        },
        {
          title: 'THÔNG BÁO về thời gian tổ chức 02 (hai) khóa "Cập nhật kiến thức cho hướng dẫn viên du lịch nội địa và quốc tế" - năm 2025',
          link: "https://sdl.hue.gov.vn/thong-bao/thong-bao-ve-thoi-gian-to-chuc-02-hai-khoa-cap-nhat-kien-thuc-cho-huong-dan-vien-du-lich-noi-dia-va-quoc-te-nam-2025.html"
        }
      ];

      // Limit to 2 latest news
      setNews(latestNews.slice(0, 2));
      setLoading(false);
    } catch (err) {
      setError('Không thể tải thông báo từ Sở Du lịch Huế');
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded && news.length === 0) {
      loadNews();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg shadow-md mb-8 border border-indigo-100 overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">
              Thông Báo Từ Sở Du Lịch Huế
            </h2>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải...</span>
              </>
            ) : isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Xem thông báo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-indigo-100">
          {error ? (
            <div className="py-6 text-sm text-red-600 text-center">{error}</div>
          ) : news.length === 0 ? (
            <div className="py-6 text-sm text-gray-500 text-center">Hiện chưa có thông báo nào.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {news.map((item, index) => (
                  <a
                    key={index}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-white rounded-lg p-4 shadow-sm hover:shadow-lg border border-indigo-100 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                          {item.title}
                        </h3>
                        {item.date && (
                          <p className="text-xs text-gray-500">
                            {new Date(item.date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-100">
                <a
                  href="https://sdl.hue.gov.vn/huong-dan-vien.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center transition-colors"
                >
                  Xem tất cả thông báo
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SDLNewsNotification;
