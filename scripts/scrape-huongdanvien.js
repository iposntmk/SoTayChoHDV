import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeHuongDanVien() {
  console.log('Đang khởi động trình duyệt...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    // URL với tham số tìm kiếm Thừa Thiên Huế
    const url = 'https://huongdanvien.vn/index.php/guide/cat/05?tinh=46%2C+46&loaithe=1&ngoaingu=&name=&sothe=';

    console.log('Đang truy cập trang huongdanvien.vn...');
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });

    // Đợi form tìm kiếm xuất hiện
    console.log('Đang đợi form tìm kiếm...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click vào button tìm kiếm để load dữ liệu
    console.log('Đang click button tìm kiếm...');
    try {
      const searchButton = await page.$('#searchbutton');
      if (searchButton) {
        await searchButton.click();
        console.log('Đã click button tìm kiếm');

        // Đợi dữ liệu load
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('Không tìm thấy button tìm kiếm, dữ liệu có thể đã được load sẵn');
      }
    } catch (err) {
      console.log('Lỗi khi click button:', err.message);
    }

    // Chụp screenshot sau khi click
    await page.screenshot({ path: 'huongdanvien-screenshot.png', fullPage: true });
    console.log('Đã lưu screenshot');

    console.log('Đang lấy dữ liệu hướng dẫn viên...');

    // Lưu HTML để debug
    const htmlContent = await page.content();
    fs.writeFileSync('huongdanvien-page.html', htmlContent, 'utf8');
    console.log('Đã lưu HTML vào huongdanvien-page.html để kiểm tra');

    const evaluationResult = await page.evaluate(() => {
      const results = [];
      const logs = [];

      // Tìm tất cả các entry hướng dẫn viên
      const allColLg12 = document.querySelectorAll('div.col-lg-12');
      logs.push(`Total col-lg-12: ${allColLg12.length}`);

      // Lọc chỉ những div có chứa "Họ và tên:"
      const guideEntries = Array.from(allColLg12).filter(div =>
        div.textContent.includes('Họ và tên:')
      );

      logs.push(`Found ${guideEntries.length} entries with guide data`);

      guideEntries.forEach((entry, idx) => {
        try {
          // Lấy loại thẻ từ header phía trên
          let cardType = 'domestic';
          const prevSibling = entry.previousElementSibling;
          if (prevSibling && prevSibling.textContent) {
            const headerText = prevSibling.textContent.trim();
            if (headerText.includes('Quốc tế')) {
              cardType = 'international';
            }
          }

          // Lấy thông tin từ các table trong entry
          const getFieldValue = (label) => {
            const cells = Array.from(entry.querySelectorAll('td'));
            for (let i = 0; i < cells.length; i++) {
              if (cells[i].textContent.includes(label)) {
                return cells[i + 1]?.textContent?.trim() || '';
              }
            }
            return '';
          };

          const fullName = getFieldValue('Họ và tên:');
          const cardNumber = getFieldValue('Số thẻ:');
          const issuingPlace = getFieldValue('Nơi cấp:') || 'Thừa Thiên Huế';
          const expiryDate = getFieldValue('Ngày hết hạn:');
          const languagesText = getFieldValue('Ngoại ngữ:');
          const phone = getFieldValue('Điện thoại:');
          const email = getFieldValue('Email:');

          // Lấy URL ảnh
          const imgEl = entry.querySelector('img');
          const photoUrl = imgEl ? imgEl.src : null;

          if (fullName && cardNumber) {
            results.push({
              fullName,
              cardNumber,
              issuingPlace,
              cardType,
              expiryDate: expiryDate || null,
              languages: languagesText ? languagesText.split(',').map(l => l.trim()).filter(Boolean) : [],
              phone: phone || null,
              email: email || null,
              photoUrl: photoUrl || null
            });
            logs.push(`Parsed: ${fullName} - ${cardNumber}`);
          } else {
            logs.push(`Skipped entry ${idx}: fullName=${fullName}, cardNumber=${cardNumber}`);
          }
        } catch (err) {
          logs.push(`Error parsing entry ${idx}: ${err.message}`);
        }
      });

      return { results, logs };
    });

    const guides = evaluationResult.results;
    console.log('\n=== BROWSER LOGS ===');
    evaluationResult.logs.forEach(log => console.log(log));
    console.log('\n');

    console.log(`\nĐã tìm thấy ${guides.length} hướng dẫn viên\n`);

    // Lưu dữ liệu
    fs.writeFileSync(
      'huongdanvien-guides.json',
      JSON.stringify(guides, null, 2),
      'utf8'
    );
    console.log('Đã lưu danh sách vào huongdanvien-guides.json');

    // Hiển thị mẫu
    console.log('\n=== MẪU DỮ LIỆU ===');
    guides.slice(0, 3).forEach((g, i) => {
      console.log(`\n${i + 1}. ${g.fullName}`);
      console.log(`   Số thẻ: ${g.cardNumber}`);
      console.log(`   Nơi cấp: ${g.issuingPlace}`);
      console.log(`   Ngoại ngữ: ${g.languages.join(', ') || 'Chưa có'}`);
    });

  } catch (error) {
    console.error('Lỗi khi scrape dữ liệu:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeHuongDanVien()
  .then(() => {
    console.log('\nHoàn thành!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Lỗi:', error);
    process.exit(1);
  });
