import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin accounts to setup
const adminAccounts = [
  { email: 'huutu289@gmail.com', password: 'huutu289@gmail.com' },
  { email: 'iposntmk@gmail.com', password: 'iposntmk@gmail.com' }
];

async function setupAdmin(email, password) {
  try {
    console.log(`\n🔧 Setting up admin: ${email}`);

    let uid;

    // Try to create user first
    try {
      console.log(`   Creating user account...`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      console.log(`   ✅ User created with UID: ${uid}`);
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        // User already exists, try to sign in to get UID
        console.log(`   ℹ️  User already exists, signing in...`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        console.log(`   ✅ Signed in with UID: ${uid}`);
      } else {
        throw createError;
      }
    }

    // Add to admin allowlist in Firestore
    console.log(`   Adding to admin_allowlist...`);
    await setDoc(doc(db, 'admin_allowlist', uid), {
      active: true,
      email: email,
      createdAt: new Date().toISOString()
    });
    console.log(`   ✅ Added to admin_allowlist`);

    // Sign out
    await auth.signOut();

    return { success: true, uid, email };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, email, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting admin setup...\n');
  console.log(`📋 Accounts to setup:`);
  adminAccounts.forEach(acc => console.log(`   - ${acc.email}`));

  const results = [];

  for (const account of adminAccounts) {
    const result = await setupAdmin(account.email, account.password);
    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log(`\n✅ Successfully setup ${successful.length} admin(s):`);
    successful.forEach(r => {
      console.log(`   - ${r.email}`);
      console.log(`     UID: ${r.uid}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed to setup ${failed.length} admin(s):`);
    failed.forEach(r => {
      console.log(`   - ${r.email}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log('\n✨ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
