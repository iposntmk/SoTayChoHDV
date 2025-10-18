const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testStorageRules() {
  const userId = 'tvr3giNjbVfEiafR6TqEfJoyW6k1';
  const providerId = 'RZOjjtoHgHvh5paXXlNl';

  console.log('🧪 Testing Storage Rules Logic\n');

  try {
    // Check 1: Provider document exists?
    const providerDoc = await db.collection('providers').doc(providerId).get();
    const providerExists = providerDoc.exists;
    console.log(`1️⃣ Provider document exists: ${providerExists ? '✅ YES' : '❌ NO'}`);

    if (providerExists) {
      const providerData = providerDoc.data();
      console.log(`   - ownerId: ${providerData.ownerId}`);
      console.log(`   - name: ${providerData.name}`);

      // Check 2: User is owner?
      const isOwner = providerData.ownerId === userId;
      console.log(`\n2️⃣ User is owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Provider ownerId: ${providerData.ownerId}`);
      console.log(`   - Current userId: ${userId}`);
      console.log(`   - Match: ${isOwner}`);
    }

    // Check 3: User is admin?
    const adminDoc = await db.collection('admin_allowlist').doc(userId).get();
    const isAdmin = adminDoc.exists;
    console.log(`\n3️⃣ User is admin: ${isAdmin ? '✅ YES' : '❌ NO'}`);
    if (isAdmin) {
      console.log(`   - Admin data:`, adminDoc.data());
    }

    // Final verdict
    console.log('\n🎯 Storage Rules Evaluation:');
    console.log(`   - User authenticated: ✅ YES (assumed)`);
    console.log(`   - File size < 5MB: ✅ (assumed - need to check in browser)`);
    console.log(`   - File is image: ✅ (assumed - need to check in browser)`);
    console.log(`   - Provider exists: ${providerExists ? '✅' : '❌'}`);

    if (providerExists) {
      const providerData = providerDoc.data();
      const isOwner = providerData.ownerId === userId;
      console.log(`   - Is owner OR is admin: ${isOwner || isAdmin ? '✅' : '❌'}`);
      console.log(`     - Is owner: ${isOwner ? '✅' : '❌'}`);
      console.log(`     - Is admin: ${isAdmin ? '✅' : '❌'}`);

      if (providerExists && (isOwner || isAdmin)) {
        console.log('\n✅ SHOULD ALLOW UPLOAD');
      } else {
        console.log('\n❌ SHOULD DENY UPLOAD');
        console.log('   Reason: Not owner and not admin');
      }
    } else {
      console.log('\n❌ SHOULD DENY UPLOAD');
      console.log('   Reason: Provider document does not exist');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

testStorageRules();
