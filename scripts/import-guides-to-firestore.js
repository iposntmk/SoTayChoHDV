import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import service account
const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Parse ngày từ format dd/mm/yyyy
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Dữ liệu mẫu từ huongdanvien.vn (15 HDV đầu tiên)
const sampleGuides = [
  {
    fullName: "TRẦN QUANG LINH",
    cardNumber: "146140785",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 11
  },
  {
    fullName: "LÊ VĂN LIỆU",
    cardNumber: "146171101",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 8
  },
  {
    fullName: "LÊ ÍCH BIỂU",
    cardNumber: "146192044",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 6
  },
  {
    fullName: "NGUYỄN SONG HOÀ",
    cardNumber: "146100429",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["French"],
    experienceYears: 15
  },
  {
    fullName: "NGUYỄN VĂN ĐÌNH TUẤN",
    cardNumber: "146202166",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 5
  },
  {
    fullName: "NGUYỄN THÔNG",
    cardNumber: "146100461",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["French"],
    experienceYears: 15
  },
  {
    fullName: "HUỲNH QUỐC THANH",
    cardNumber: "146171177",
    expiryDate: "16/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["Chinese"],
    experienceYears: 8
  },
  {
    fullName: "NGUYỄN THỊ HOÀI PHÚC",
    cardNumber: "146171168",
    expiryDate: "13/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 8
  },
  {
    fullName: "BÙI LÊ NGUYÊN",
    cardNumber: "146171171",
    expiryDate: "13/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 8
  },
  {
    fullName: "HÀ NHẬT PHONG",
    cardNumber: "146100425",
    expiryDate: "13/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 15
  },
  {
    fullName: "NGUYỄN ĐẶNG PHƯỚC TÀI",
    cardNumber: "146171119",
    expiryDate: "13/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 8
  },
  {
    fullName: "NGUYỄN THỊ THỨ",
    cardNumber: "146191891",
    expiryDate: "09/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 6
  },
  {
    fullName: "VÕ TRỌNG HẢI",
    cardNumber: "146140726",
    expiryDate: "09/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["Japanese"],
    experienceYears: 11
  },
  {
    fullName: "HUỲNH HỒNG NGỌC",
    cardNumber: "146252702",
    expiryDate: "09/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["French"],
    experienceYears: 0
  },
  {
    fullName: "NGUYỄN NHẬT VY",
    cardNumber: "146192049",
    expiryDate: "09/10/2030",
    issuingPlace: "Thừa Thiên - Huế",
    cardType: "international",
    languages: ["English"],
    experienceYears: 6
  }
];

async function importGuides() {
  console.log('Bắt đầu import hướng dẫn viên vào Firestore...\n');

  const systemUser = {
    uid: 'system',
    displayName: 'System Import',
    email: 'system@huongdanvien.vn'
  };

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const guide of sampleGuides) {
    try {
      const cardNumber = guide.cardNumber;

      // Kiểm tra xem đã tồn tại chưa
      const existingQuery = await db.collection('guide_profiles')
        .where('cardNumber', '==', cardNumber)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        console.log(`⏭️  Bỏ qua: ${guide.fullName} (${cardNumber}) - Đã tồn tại`);
        skipped++;
        continue;
      }

      const expiryDate = parseDate(guide.expiryDate);
      if (!expiryDate) {
        console.log(`❌ Lỗi: ${guide.fullName} - Ngày hết hạn không hợp lệ`);
        errors++;
        continue;
      }

      // Tạo document ID từ số thẻ
      const docId = `hdv_${cardNumber}`;

      const data = {
        userId: 'system', // Không có user cụ thể
        fullName: guide.fullName,
        cardNumber: cardNumber,
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        issuingPlace: guide.issuingPlace,
        cardType: guide.cardType,
        languages: guide.languages || [],
        experienceYears: guide.experienceYears || 0,
        email: null,
        phone: null,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        createdBy: systemUser,
        updatedBy: systemUser,
        lastExpiryNotificationAt: null
      };

      await db.collection('guide_profiles').doc(docId).set(data);
      console.log(`✅ Đã import: ${guide.fullName} (${cardNumber})`);
      imported++;

    } catch (error) {
      console.error(`❌ Lỗi khi import ${guide.fullName}:`, error.message);
      errors++;
    }
  }

  console.log('\n=== KẾT QUẢ ===');
  console.log(`✅ Đã import: ${imported}`);
  console.log(`⏭️  Đã bỏ qua: ${skipped}`);
  console.log(`❌ Lỗi: ${errors}`);
  console.log(`📊 Tổng số: ${sampleGuides.length}`);
}

importGuides()
  .then(() => {
    console.log('\nHoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Lỗi:', error);
    process.exit(1);
  });
