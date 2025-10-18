import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase configuration
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
const db = getFirestore(app);

const uid = 'uob6NVNiaJaUllY8BHFq8M3rwSt1';
const email = 'iposntmk@gmail.com';

async function main() {
  console.log(`🔧 Adding ${email} to admin_allowlist...`);
  console.log(`   UID: ${uid}`);

  try {
    await setDoc(doc(db, 'admin_allowlist', uid), {
      active: true,
      email: email,
      createdAt: new Date().toISOString()
    });
    console.log(`✅ Successfully added to admin_allowlist!`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  process.exit(0);
}

main();
