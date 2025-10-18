const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAdminStatus() {
  const userId = 'tvr3giNjbVfEiafR6TqEfJoyW6k1';
  const email = 'huutu289@gmail.com';

  console.log(`🔍 Checking admin status for: ${email}`);
  console.log(`   UID: ${userId}\n`);

  try {
    // Check if user is in admin_allowlist
    const adminDoc = await db.collection('admin_allowlist').doc(userId).get();

    if (adminDoc.exists) {
      console.log('✅ User IS in admin_allowlist');
      console.log('   Data:', adminDoc.data());
    } else {
      console.log('❌ User is NOT in admin_allowlist');
      console.log('\n📋 All admins in allowlist:');
      const allAdmins = await db.collection('admin_allowlist').get();
      allAdmins.forEach(doc => {
        console.log(`   - ${doc.id}: ${JSON.stringify(doc.data())}`);
      });
    }

    // Check the provider document that was just created
    console.log('\n📦 Recent provider documents:');
    const providers = await db.collection('providers')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    providers.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}:`);
      console.log(`     name: ${data.name}`);
      console.log(`     ownerId: ${data.ownerId}`);
      console.log(`     createdBy: ${data.createdBy?.email || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

checkAdminStatus();
