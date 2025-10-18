const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProvider() {
  const providerId = 'xqbp7lbvc7sLlvbTiAGH';

  try {
    const docSnap = await db.collection('providers').doc(providerId).get();

    if (!docSnap.exists) {
      console.log('❌ Provider document does not exist');
      return;
    }

    const data = docSnap.data();
    console.log('✅ Provider document exists');
    console.log('📋 Document data:');
    console.log('  - name:', data.name);
    console.log('  - ownerId:', data.ownerId);
    console.log('  - createdBy:', JSON.stringify(data.createdBy, null, 2));
    console.log('  - isApproved:', data.isApproved);

    // Check current user
    const auth = admin.auth();
    const users = await auth.listUsers(1000);
    console.log('\n👥 Available users:');
    users.users.forEach(user => {
      console.log(`  - ${user.email} (uid: ${user.uid})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

checkProvider();
