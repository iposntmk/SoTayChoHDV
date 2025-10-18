import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeSDLNews() {
  console.log('Đang khởi động trình duyệt...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Thiết lập timeout dài hơn cho trang có thể load chậm
    await page.setDefaultNavigationTimeout(60000);

    console.log('Đang truy cập trang sdl.hue.gov.vn...');
    await page.goto('https://sdl.hue.gov.vn/huong-dan-vien.html', {
      waitUntil: 'networkidle2'
    });

    // Đợi một chút để trang load xong
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Đang lấy nội dung trang...');

    // Lấy tất cả các thông báo/tin tức
    const newsItems = await page.evaluate(() => {
      const results = [];

      // Thử nhiều selector khác nhau để tìm tin tức
      const selectors = [
        'article',
        '.news-item',
        '.post',
        '.entry',
        'a[href*="tin-tuc"]',
        'a[href*="thong-bao"]',
        '.item',
        'li a'
      ];

      const allLinks = document.querySelectorAll('a');

      allLinks.forEach(link => {
        const title = link.textContent.trim();
        const href = link.href;

        if (title && href && title.length > 10) {
          results.push({
            title: title,
            link: href,
            text: link.textContent.trim()
          });
        }
      });

      return results;
    });

    console.log(`\nTìm thấy ${newsItems.length} mục tin tức/liên kết\n`);

    // Lọc các thông báo liên quan đến HDV (hướng dẫn viên)
    const hdvRelatedNews = newsItems.filter(item => {
      const titleLower = item.title.toLowerCase();
      const textLower = item.text.toLowerCase();

      return (
        titleLower.includes('hướng dẫn viên') ||
        titleLower.includes('hdv') ||
        titleLower.includes('cập nhật kiến thức') ||
        titleLower.includes('đào tạo') ||
        titleLower.includes('bồi dưỡng') ||
        textLower.includes('hướng dẫn viên') ||
        textLower.includes('hdv')
      );
    });

    console.log(`Tìm thấy ${hdvRelatedNews.length} thông báo liên quan đến HDV:\n`);

    // Lấy 4 thông báo đầu tiên (1 chính + 3 liên quan)
    const topNews = hdvRelatedNews.slice(0, 4);

    topNews.forEach((news, index) => {
      console.log(`${index + 1}. ${news.title}`);
      console.log(`   Link: ${news.link}`);
      console.log('---\n');
    });

    // Lưu tất cả tin tức vào file để kiểm tra
    fs.writeFileSync(
      'sdl-all-news.json',
      JSON.stringify(newsItems, null, 2),
      'utf8'
    );
    console.log('Đã lưu tất cả tin tức vào sdl-all-news.json');

    // Lưu tin tức liên quan đến HDV
    if (topNews.length > 0) {
      fs.writeFileSync(
        'sdl-hdv-news.json',
        JSON.stringify(topNews, null, 2),
        'utf8'
      );
      console.log('Đã lưu tin tức HDV vào sdl-hdv-news.json');
    }

    // Lấy HTML của trang để kiểm tra
    const htmlContent = await page.content();
    fs.writeFileSync('sdl-page.html', htmlContent, 'utf8');
    console.log('Đã lưu HTML của trang vào sdl-page.html');

  } catch (error) {
    console.error('Lỗi khi scrape dữ liệu:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeSDLNews()
  .then(() => {
    console.log('\nHoàn thành!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Lỗi:', error);
    process.exit(1);
  });
