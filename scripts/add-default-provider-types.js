import admin from 'firebase-admin';
import fs from 'fs';

// Import service account
const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 3 loại nhà cung cấp mặc định
const defaultProviderTypes = [
  {
    id: 'lodging',
    name: 'Nhà nghỉ',
    description: 'Các cơ sở lưu trú như khách sạn, nhà nghỉ, homestay'
  },
  {
    id: 'fnb',
    name: 'F&B',
    description: 'Nhà hàng, quán ăn, café và các dịch vụ ăn uống'
  },
  {
    id: 'souvenir',
    name: 'Lưu niệm',
    description: 'Cửa hàng quà lưu niệm, đặc sản địa phương'
  }
];

async function addDefaultProviderTypes() {
  console.log('Bắt đầu thêm loại nhà cung cấp mặc định vào Firestore...\n');

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const type of defaultProviderTypes) {
    try {
      // Kiểm tra xem đã tồn tại chưa
      const docRef = db.collection('master_provider_types').doc(type.id);
      const doc = await docRef.get();

      if (doc.exists) {
        console.log(`⏭️  Bỏ qua: ${type.name} (${type.id}) - Đã tồn tại`);
        skipped++;
        continue;
      }

      // Thêm mới
      await docRef.set({
        name: type.name,
        description: type.description,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      console.log(`✅ Đã thêm: ${type.name} (${type.id})`);
      added++;

    } catch (error) {
      console.error(`❌ Lỗi khi thêm ${type.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n=== KẾT QUẢ ===');
  console.log(`✅ Đã thêm: ${added}`);
  console.log(`⏭️  Đã bỏ qua: ${skipped}`);
  console.log(`❌ Lỗi: ${errors}`);
  console.log(`📊 Tổng số: ${defaultProviderTypes.length}`);
}

addDefaultProviderTypes()
  .then(() => {
    console.log('\nHoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Lỗi:', error);
    process.exit(1);
  });
