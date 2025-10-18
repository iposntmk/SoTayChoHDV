import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const tourismNewsData = [
  {
    title: "Tổng lượt khách du lịch quốc tế đến Việt Nam năm 2024",
    description: "Việt Nam đón 17,5 triệu lượt khách quốc tế trong năm 2024, tăng trưởng mạnh sau đại dịch",
    period: "2024",
    visitors: 17500000,
    growth: 45.2,
    sourceUrl: "https://www.vietnamplus.vn/du-lich-viet-nam-nam-2024-tang-truong-manh-me/",
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Khách quốc tế đến Việt Nam quý 1/2025",
    description: "Đầu năm 2025 ghi nhận 4,8 triệu lượt khách quốc tế, tiếp tục xu hướng tăng trưởng",
    period: "Q1 2025",
    visitors: 4800000,
    growth: 28.5,
    sourceUrl: "https://baodautu.vn/du-lich-viet-nam-dau-nam-2025-tang-truong-tich-cuc/",
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Du khách quốc tế tháng 1/2025",
    description: "Tháng đầu năm đạt 1,6 triệu lượt khách, khởi đầu thuận lợi cho năm 2025",
    period: "Tháng 1/2025",
    visitors: 1600000,
    growth: 32.1,
    sourceUrl: "https://vnexpress.net/khach-quoc-te-den-viet-nam-thang-1-2025/",
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
]

async function addTourismNews() {
  try {
    console.log('Adding tourism news to Firestore...')

    for (const news of tourismNewsData) {
      const docRef = await addDoc(collection(db, 'tourism_news'), news)
      console.log(`✅ Added: ${news.title} (ID: ${docRef.id})`)
    }

    console.log('\n✨ All tourism news added successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding tourism news:', error)
    process.exit(1)
  }
}

addTourismNews()
