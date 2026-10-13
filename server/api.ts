import type { IncomingMessage, ServerResponse } from 'node:http'
import { db, hashPassword, verifyPassword, type DbUser, type DbReport, type DbAppointment } from './db.ts'


function parseJsonBody<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        if (!body.trim()) {
          resolve({} as T)
        } else {
          resolve(JSON.parse(body) as T)
        }
      } catch {
        reject(new Error('Malformed JSON payload'))
      }
    })
    req.on('error', (err) => reject(err))
  })
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

function sanitizeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    patientId: user.patientId,
    avatar: user.avatar,
    createdAt: user.createdAt,
    isDemoSession: false,
  }
}

function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const rawUrl = req.url?.split('?')[0] || ''
  const url = rawUrl.endsWith('/') && rawUrl.length > 1 ? rawUrl.slice(0, -1) : rawUrl
  const method = req.method?.toUpperCase() || 'GET'

  if (!url.startsWith('/api/')) {
    return false // Let Vite handle non-API assets
  }

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    sendJson(res, 204, {})
    return true
  }

  try {
    // 1. POST /api/auth/register
    if (url === '/api/auth/register' && method === 'POST') {
      const body = await parseJsonBody<{
        name?: string
        email?: string
        password?: string
        role?: 'patient' | 'doctor'
        patientId?: string
      }>(req)

      const name = (body.name || '').trim()
      const email = (body.email || '').trim().toLowerCase()
      const password = (body.password || '').replace(/[\r\n]+$/, '')
      const role = body.role === 'doctor' ? 'doctor' : 'patient'

      if (!name) {
        sendJson(res, 400, { error: 'Full name is required.' })
        return true
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        sendJson(res, 400, { error: 'A valid email address is required.' })
        return true
      }

      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' })
        return true
      }

      // Check duplicate email
      const existing = db.findUserByEmail(email)
      if (existing) {
        sendJson(res, 409, { error: 'An account with this email address already exists. Please sign in.' })
        return true
      }

      const assignedId =
        role === 'patient'
          ? `PT-${Math.floor(10000 + Math.random() * 90000)}`
          : `DOC-${Math.floor(10000 + Math.random() * 90000)}`

      const avatar = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

      const passwordHash = hashPassword(password)
      const user = db.createUser({
        name,
        email,
        passwordHash,
        role,
        patientId: assignedId,
        avatar: avatar || 'US',
      })

      const session = db.createSession(user.id, user.role)
      console.info(
        `[Auth Diagnostics] Stage: REGISTRATION | Category: ACCOUNT_CREATED | User ID: ${user.id} | Server Role: ${user.role} | Domain: @${email.split('@')[1] || 'unknown'}`
      )
      sendJson(res, 201, {
        message: 'Account registered successfully.',
        user: sanitizeUser(user),
        token: session.token,
        diagnostic: {
          stage: 'REGISTRATION',
          category: 'ACCOUNT_CREATED',
          accountFound: true,
          verifiedRole: user.role,
        },
      })
      return true
    }

    // 2. POST /api/auth/login
    if (url === '/api/auth/login' && method === 'POST') {
      const body = await parseJsonBody<{ email?: string; password?: string; role?: string }>(req)
      const email = (body.email || '').trim().toLowerCase()
      const password = (body.password || '').replace(/[\r\n]+$/, '')

      if (!email || !password) {
        console.warn(
          `[Auth Diagnostics] Stage: VALIDATION | Category: MISSING_FIELDS | Email provided: ${!!email} | Password provided: ${!!password}`
        )
        sendJson(res, 400, {
          error: 'Both email and password are required.',
          diagnostic: {
            stage: 'VALIDATION',
            category: 'MISSING_FIELDS',
            accountFound: false,
          },
        })
        return true
      }

      const user = db.findUserByEmail(email)
      if (!user) {
        const domain = email.includes('@') ? email.split('@')[1] : 'unknown'
        console.warn(
          `[Auth Diagnostics] Stage: ACCOUNT_LOOKUP | Category: ACCOUNT_NOT_FOUND | Domain: @${domain}`
        )
        sendJson(res, 401, {
          error: 'No account found with this email address. Please check the spelling or create a new account.',
          diagnostic: {
            stage: 'ACCOUNT_LOOKUP',
            category: 'ACCOUNT_NOT_FOUND',
            accountFound: false,
          },
        })
        return true
      }

      const isValidPassword = verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        console.warn(
          `[Auth Diagnostics] Stage: PASSWORD_VERIFICATION | Category: INVALID_PASSWORD | User ID: ${user.id} | Server Role: ${user.role}`
        )
        sendJson(res, 401, {
          error: 'Incorrect password for this account. Please verify your credentials.',
          diagnostic: {
            stage: 'PASSWORD_VERIFICATION',
            category: 'INVALID_PASSWORD',
            accountFound: true,
          },
        })
        return true
      }

      console.info(
        `[Auth Diagnostics] Stage: AUTH_SUCCESS | Category: VERIFIED | User ID: ${user.id} | Server Role: ${user.role}`
      )
      // Create session; role is strictly derived from user record, never frontend input
      const session = db.createSession(user.id, user.role)
      sendJson(res, 200, {
        message: 'Sign in successful.',
        user: sanitizeUser(user),
        token: session.token,
        diagnostic: {
          stage: 'COMPLETED',
          category: 'AUTH_SUCCESS',
          accountFound: true,
          verifiedRole: user.role,
        },
      })
      return true
    }

    // 3. GET /api/auth/me
    if (url === '/api/auth/me' && method === 'GET') {
      const token = getBearerToken(req)
      if (!token) {
        sendJson(res, 401, { error: 'Authentication required. Please sign in.' })
        return true
      }

      const auth = db.validateSession(token)
      if (!auth) {
        sendJson(res, 401, { error: 'Session expired or invalid. Please sign in again.' })
        return true
      }

      sendJson(res, 200, { user: sanitizeUser(auth.user) })
      return true
    }

    // 4. POST /api/auth/logout
    if (url === '/api/auth/logout' && method === 'POST') {
      const token = getBearerToken(req)
      if (token) {
        db.revokeSession(token)
      }
      sendJson(res, 200, { message: 'Signed out successfully.' })
      return true
    }

    // --- PROTECTED DATA APIS ---
    const token = getBearerToken(req)
    if (!token) {
      sendJson(res, 401, { error: 'Unauthorized access. Authentication token required.' })
      return true
    }

    const auth = db.validateSession(token)
    if (!auth) {
      sendJson(res, 401, { error: 'Session expired. Please sign in again.' })
      return true
    }

    const currentUser = auth.user

    // 5. GET /api/reports
    if (url === '/api/reports' && method === 'GET') {
      const reports = db.getReportsForUser(currentUser)
      sendJson(res, 200, { reports })
      return true
    }

    // 6. POST /api/reports
    if (url === '/api/reports' && method === 'POST') {
      const body = await parseJsonBody<Omit<DbReport, 'id' | 'patientId' | 'patientName'>>(req)

      if (!body.fileName || !body.fileType) {
        sendJson(res, 400, { error: 'Invalid report payload. fileName and fileType are required.' })
        return true
      }

      const now = new Date()
      const formattedDate =
        now.toISOString().slice(0, 10) +
        ' ' +
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const newReport: DbReport = {
        id: `REP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: currentUser.patientId,
        patientName: currentUser.name,
        fileName: body.fileName,
        fileSizeBytes: body.fileSizeBytes || 0,
        fileType: body.fileType,
        reportType: body.reportType || 'General Checkup',
        uploadDate: formattedDate,
        status: 'Pending Review',
        notes: body.notes || 'Uploaded by patient for clinical review',
        dataUrl: body.dataUrl,
        rawText: body.rawText,
        isDemoData: false,
      }

      const created = db.addReport(newReport)
      sendJson(res, 201, { report: created })
      return true
    }

    // 7. GET /api/appointments
    if (url === '/api/appointments' && method === 'GET') {
      const appointments = db.getAppointmentsForUser(currentUser)
      sendJson(res, 200, { appointments })
      return true
    }

    // 8. POST /api/appointments
    if (url === '/api/appointments' && method === 'POST') {
      const body = await parseJsonBody<Partial<DbAppointment>>(req)

      if (!body.doctorId || !body.requestedDate || !body.reasonForVisit) {
        sendJson(res, 400, { error: 'Missing required appointment fields.' })
        return true
      }

      const now = new Date()
      const formattedDate =
        now.toISOString().slice(0, 10) +
        ' ' +
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const newApt: DbAppointment = {
        id: `APT-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        patientId: currentUser.patientId,
        patientName: currentUser.name,
        doctorId: body.doctorId,
        doctorName: body.doctorName || 'Assigned Physician',
        doctorSpecialty: body.doctorSpecialty || 'General Practice',
        requestedDate: body.requestedDate,
        requestedTime: body.requestedTime || '09:00 AM',
        reasonForVisit: body.reasonForVisit,
        status: 'Pending',
        authorizedReportIds: body.authorizedReportIds || [],
        createdAt: formattedDate,
        patientRelevantVitals: body.patientRelevantVitals,
      }

      const created = db.addAppointment(newApt)
      sendJson(res, 201, created)
      return true
    }

    // 9. PATCH /api/appointments/:id
    if (url.startsWith('/api/appointments/') && method === 'PATCH') {
      const appointmentId = url.replace('/api/appointments/', '')
      const body = await parseJsonBody<Partial<DbAppointment>>(req)

      if (currentUser.role !== 'doctor') {
        sendJson(res, 403, { error: 'Only healthcare providers can review or update appointments.' })
        return true
      }

      const updated = db.updateAppointment(
        appointmentId,
        {
          status: body.status,
          doctorResponse: body.doctorResponse,
          suggestedAlternativeDate: body.suggestedAlternativeDate,
          suggestedAlternativeTime: body.suggestedAlternativeTime,
        },
        currentUser
      )

      if (!updated) {
        sendJson(res, 404, { error: 'Appointment not found or unauthorized to update.' })
        return true
      }

      sendJson(res, 200, updated)
      return true
    }

    sendJson(res, 404, { error: `Endpoint not found: ${method} ${url}` })
    return true
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error'
    sendJson(res, 500, { error: errorMsg })
    return true
  }
}
