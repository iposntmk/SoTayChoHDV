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

async function checkCustomerSegments() {
  console.log('Kiểm tra collection master_customer_segments...\n');

  try {
    const snapshot = await db.collection('master_customer_segments').get();

    console.log(`📊 Tổng số documents: ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('⚠️  Collection rỗng - không có dữ liệu nào!');
    } else {
      console.log('=== DỮ LIỆU ===');
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`  name: ${data.name || '(không có)'}`);
        console.log(`  specialTraits: ${data.specialTraits || '(không có)'}`);
        console.log(`  createdAt: ${data.createdAt ? data.createdAt.toDate() : '(không có)'}`);
      });
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkCustomerSegments()
  .then(() => {
    console.log('\n✅ Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
