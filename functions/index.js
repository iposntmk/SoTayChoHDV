const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const cheerio = require('cheerio')

admin.initializeApp()

const getConfigValue = (path, fallback = undefined) => {
  const value = path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), functions.config())
  return value === undefined ? fallback : value
}

const GMAIL_USER = getConfigValue('gmail.user')
const GMAIL_APP_PASSWORD = getConfigValue('gmail.password')
const FROM_EMAIL = getConfigValue('gmail.from_email', GMAIL_USER || 'noreply@example.com')

const HTML_ESCAPE_LOOKUP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
}

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_LOOKUP[char] || char)
}

const getRequestBaseUrl = (req) => {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host')
  if (!host) {
    return ''
  }
  return `${proto}://${host}`
}

let transporter = null
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  })
}

exports.notifyExpiringGuide = functions.firestore
  .document('guide_profiles/{uid}')
  .onWrite(async (change, context) => {
    const afterSnap = change.after
    if (!afterSnap.exists) {
      return null
    }

    if (!transporter) {
      functions.logger.warn('Gmail credentials not configured; skipping email notification')
      return null
    }

    const data = afterSnap.data()
    const expiryTimestamp = data.expiryDate
    if (!expiryTimestamp || !expiryTimestamp.toDate) {
      return null
    }

    const expiryDate = expiryTimestamp.toDate()
    const now = new Date()
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0 || diffDays > 30) {
      return null
    }

    if (!data.email) {
      functions.logger.info('Guide missing email; skip notification', { uid: context.params.uid })
      return null
    }

    const lastNotifiedTs = data.lastExpiryNotificationAt
    if (lastNotifiedTs && lastNotifiedTs.toDate) {
      const lastNotifiedDate = lastNotifiedTs.toDate()
      const hoursSince = (now.getTime() - lastNotifiedDate.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return null
      }
    }

    const fullName = data.fullName || 'bạn'
    const mailOptions = {
      from: FROM_EMAIL,
      to: data.email,
      subject: '⚠️ Thông báo quan trọng: Thẻ hướng dẫn viên sắp hết hạn',
      text: `Xin chào ${fullName},\n\nThẻ hướng dẫn viên của bạn sẽ hết hạn vào ngày ${expiryDate.toLocaleDateString('vi-VN')}. Vui lòng chuẩn bị gia hạn để tránh gián đoạn công việc.\n\nTrân trọng,\nHệ thống Sổ Tay Cho HDV`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin: 0;">⚠️ Thông báo quan trọng</h2>
          </div>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px;">Thẻ hướng dẫn viên của bạn sẽ hết hạn vào ngày <strong style="color: #dc2626;">${expiryDate.toLocaleDateString('vi-VN')}</strong> (còn <strong>${diffDays} ngày</strong>).</p>
          <div style="background-color: #fee2e2; border-radius: 8px; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">📋 Vui lòng chuẩn bị gia hạn sớm để tránh gián đoạn công việc.</p>
          </div>
          <p>Trân trọng,<br/><strong>Hệ thống Sổ Tay Cho HDV</strong></p>
        </div>
      `,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
    }

    try {
      await transporter.sendMail(mailOptions)
      await afterSnap.ref.update({
        lastExpiryNotificationAt: admin.firestore.Timestamp.fromDate(now),
      })
      functions.logger.info('Sent expiry notification', {
        uid: context.params.uid,
        email: data.email,
        diffDays,
      })
    } catch (error) {
      functions.logger.error('Failed to send expiry notification', {
        error: error.message,
        uid: context.params.uid,
      })
    }

    return null
  })

const HUE_BASE_URL = 'https://sdl.hue.gov.vn'

const fetchWithCookies = async (path, options = {}, jar = {}) => {
  while (true) {
    const headers = { ...(options.headers || {}) }
    if (jar.D1N) {
      headers.Cookie = `D1N=${jar.D1N}`
    }

    const response = await globalThis.fetch(`${HUE_BASE_URL}${path}`, {
      method: options.body ? 'POST' : 'GET',
      ...options,
      headers,
    })

    const text = await response.text()
    const cookieMatch = text.match(/document\.cookie=\"D1N=([A-Za-z0-9]+)\"/)
    if (cookieMatch) {
      jar.D1N = cookieMatch[1]
      if (text.includes('window.location.reload')) {
        continue
      }
    }
    return text
  }
}

const extractWidgetPayloads = (html) => {
  const $ = cheerio.load(html)
  const payloads = []
  $('.view-data-widget .data-widget').each((_, element) => {
    const raw = $(element).attr('data-value')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw.replace(/&quot;/g, '"'))
      payloads.push(parsed)
    } catch (error) {
      functions.logger.warn('Failed to parse widget payload', { raw })
    }
  })
  return payloads
}

const resolveWidgetFragment = async (payloads, jar) => {
  for (const payload of payloads) {
    const params = new URLSearchParams()
    Object.entries(payload).forEach(([key, value]) => params.append(key, value ?? ''))
    const fragment = await fetchWithCookies(
      '/trang-chu',
      {
        body: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      },
      jar
    )
    if (fragment.includes('page-content')) {
      return fragment
    }
  }
  return ''
}

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim()

const parseHueGuideArticles = (fragment) => {
  if (!fragment) return []
  const $ = cheerio.load(fragment)
  const articles = []
  $('.items').each((_, element) => {
    const container = $(element)
    const linkEl = container.find('.listitems_other_right .line-clamp-2 a').first()
    if (!linkEl.length) return

    const title = normalizeText(linkEl.text())
    const relativeUrl = linkEl.attr('href') || '#'
    const url = new URL(relativeUrl, HUE_BASE_URL).toString()

    const summary = normalizeText(container.find('.listitems_other_right .line-clamp-2 .desc').text() || '')
    const dateText = normalizeText(container.find('.card-text').text() || '')
    const imageSrc = container.find('.article-thumbnail img').attr('src')
    const imageUrl = imageSrc ? new URL(imageSrc, HUE_BASE_URL).toString() : null

    articles.push({
      title,
      url,
      summary,
      publishedAt: dateText,
      imageUrl,
    })
  })

  return articles
}

exports.hueGuideFeed = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  try {
    const jar = {}
    const pageHtml = await fetchWithCookies('/huong-dan-vien.html', {}, jar)
    const payloads = extractWidgetPayloads(pageHtml)
    const fragment = await resolveWidgetFragment(payloads, jar)
    const articles = parseHueGuideArticles(fragment).slice(0, 6)

    res.status(200).json({
      source: HUE_BASE_URL,
      articles,
    })
  } catch (error) {
    functions.logger.error('Failed to fetch hue guide feed', { error: error.message })
    res.status(500).json({
      error: 'failed-to-fetch-hue-feed',
      message: 'Không thể lấy dữ liệu từ sdl.hue.gov.vn',
    })
  }
})

exports.providerShareCard = functions.runWith({
  invoker: 'public'
}).https.onRequest(async (req, res) => {
  // Parse provider ID from path: /share/provider/{id} or from query ?id=xxx
  let providerId = req.query.id
  if (!providerId) {
    const pathMatch = req.path.match(/\/share\/provider\/([^\/]+)/)
    if (pathMatch) {
      providerId = pathMatch[1]
    }
  }
  
  if (!providerId || typeof providerId !== 'string') {
    res.status(400).send('Missing provider id')
    return
  }

  try {
    const docSnap = await admin.firestore().collection('providers').doc(providerId).get()
    if (!docSnap.exists) {
      res.status(404).send('Provider not found')
      return
    }

    const provider = docSnap.data() || {}
    if (provider.isApproved === false) {
      res.status(404).send('Provider not available')
      return
    }

    const baseUrl = getRequestBaseUrl(req)
    const detailUrl = baseUrl ? `${baseUrl}/p/${providerId}` : `https://so-tay-cho-hdv.web.app/p/${providerId}`
    const shareUrl = baseUrl ? `${baseUrl}/share/provider/${providerId}` : detailUrl
    const imageUrl =
      typeof provider.mainImageUrl === 'string' && provider.mainImageUrl
        ? provider.mainImageUrl
        : 'https://dummyimage.com/1200x630/1d4ed8/ffffff.png&text=So+Tay+Cho+HDV'

    const descriptionSource =
      provider.description ||
      provider.notes ||
      provider.address ||
      (provider.province ? `Nhà cung cấp tại ${provider.province}` : 'Đối tác uy tín trên Sổ Tay cho HDV')

    const title = provider.name || 'Sổ Tay cho HDV'
    const description = `${descriptionSource}`.slice(0, 200)

    const html = `
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(detailUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Sổ Tay Cho HDV" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(detailUrl)}" />
    <script>
      setTimeout(function () {
        window.location.replace('${escapeHtml(detailUrl)}')
      }, 50)
    </script>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f3f4f6;
        color: #111827;
        padding: 24px;
        text-align: center;
      }
      .card {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 520px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
      }
      .card img {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 16px;
        object-fit: cover;
      }
      .card a {
        display: inline-block;
        margin-top: 12px;
        color: #2563eb;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${escapeHtml(detailUrl)}" rel="noopener noreferrer">Đi tới chi tiết</a>
    </div>
  </body>
</html>
`

    res
      .status(200)
      .set('Cache-Control', 'public, max-age=300, s-maxage=1800')
      .type('text/html; charset=utf-8')
      .send(html)
  } catch (error) {
    functions.logger.error('Failed to build provider share card', {
      error: error.message,
      providerId,
    })
    res.status(500).send('Failed to build share content')
  }
})
