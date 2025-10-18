import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, getDocs } from 'firebase/firestore'

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyDnxi75TU_mUZeWSCRMGPb5oNBUhVSWtlk",
  authDomain: "so-tay-cho-hdv.firebaseapp.com",
  projectId: "so-tay-cho-hdv",
  storageBucket: "so-tay-cho-hdv.firebasestorage.app",
  messagingSenderId: "690770695535",
  appId: "1:690770695535:web:b3b0eba73d0e96fd19e91a"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Check for guide cards expiring in the next 30 days
 * This script should be run daily via cron job or Cloud Scheduler
 */
async function checkExpiringCards() {
  try {
    console.log('🔍 Checking for expiring guide cards...\n')

    const q = query(collection(db, 'guide_profiles'))
    const snapshot = await getDocs(q)

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const expiringGuides = []

    snapshot.docs.forEach((doc) => {
      const guide = doc.data()
      const expiryDate = guide.expiryDate.toDate()

      // Check if card expires within 30 days
      if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
        expiringGuides.push({
          id: doc.id,
          fullName: guide.fullName,
          cardNumber: guide.cardNumber,
          expiryDate: expiryDate.toLocaleDateString('vi-VN'),
          daysUntilExpiry,
          userId: guide.userId,
          createdBy: guide.createdBy
        })
      }
    })

    if (expiringGuides.length === 0) {
      console.log('✅ No cards expiring in the next 30 days')
      return
    }

    console.log(`⚠️  Found ${expiringGuides.length} guide card(s) expiring soon:\n`)

    expiringGuides.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.fullName} (${guide.cardNumber})`)
      console.log(`   Expires: ${guide.expiryDate} (${guide.daysUntilExpiry} days from now)`)
      console.log(`   User ID: ${guide.userId}`)
      console.log(`   Email: ${guide.createdBy.email || 'N/A'}`)
      console.log('')
    })

    // TODO: Send email notifications
    // This requires email service configuration (e.g., SendGrid, AWS SES, or Firebase Extensions)
    console.log('📧 Email notifications:')
    console.log('   To enable email notifications, you need to:')
    console.log('   1. Install an email service (SendGrid, AWS SES, etc.)')
    console.log('   2. Configure email templates')
    console.log('   3. Add email sending logic to this script')
    console.log('')
    console.log('   For Firebase, you can use the "Trigger Email" extension:')
    console.log('   https://firebase.google.com/products/extensions/firestore-send-email')
    console.log('')

    // Example email notification logic (requires email service):
    /*
    for (const guide of expiringGuides) {
      if (guide.createdBy.email) {
        await sendEmail({
          to: guide.createdBy.email,
          subject: 'Thông báo: Thẻ hướng dẫn viên sắp hết hạn',
          body: `
            Xin chào ${guide.fullName},

            Thẻ hướng dẫn viên của bạn sẽ hết hạn trong ${guide.daysUntilExpiry} ngày.

            Thông tin thẻ:
            - Số thẻ: ${guide.cardNumber}
            - Ngày hết hạn: ${guide.expiryDate}

            Vui lòng gia hạn thẻ để tiếp tục hoạt động.

            Trân trọng,
            Sổ Tay HDV
          `
        })
        console.log(`   ✅ Email sent to ${guide.createdBy.email}`)
      }
    }
    */

    console.log('✨ Check completed!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error checking expiring cards:', error)
    process.exit(1)
  }
}

checkExpiringCards()
