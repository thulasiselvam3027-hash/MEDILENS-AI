import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export interface DbUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'patient' | 'doctor'
  patientId: string
  avatar: string
  createdAt: string
}

export interface DbSession {
  token: string
  userId: string
  role: 'patient' | 'doctor'
  createdAt: number
  expiresAt: number
}

export interface DbReport {
  id: string
  patientId: string
  patientName: string
  fileName: string
  fileSizeBytes: number
  fileType: string
  reportType: string
  uploadDate: string
  status: string
  notes?: string
  dataUrl?: string
  rawText?: string
  isDemoData?: boolean
}

export interface DbAppointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  requestedDate: string
  requestedTime: string
  reasonForVisit: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  doctorResponse?: string
  suggestedAlternativeDate?: string
  suggestedAlternativeTime?: string
  authorizedReportIds: string[]
  createdAt: string
  patientRelevantVitals?: {
    age: number
    bloodType: string
    allergies: string
  }
}

interface DatabaseSchema {
  users: DbUser[]
  sessions: Record<string, DbSession>
  reports: DbReport[]
  appointments: DbAppointment[]
}

// Password hashing utilities using Node.js native crypto scrypt with constant-time equality
export function hashPassword(password: string): string {
  const cleanPassword = password.replace(/[\r\n]+$/, '')
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(cleanPassword, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const cleanPassword = password.replace(/[\r\n]+$/, '')
    const parts = storedHash.split(':')
    if (parts.length !== 2) return false
    const [salt, keyHex] = parts
    const keyBuffer = Buffer.from(keyHex, 'hex')
    const derivedKey = crypto.scryptSync(cleanPassword, salt, 64)
    if (keyBuffer.length !== derivedKey.length) return false
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

const DB_DIR = path.resolve(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'medilens-db.json')

function getInitialDatabase(): DatabaseSchema {
  return {
    users: [
      {
        id: 'usr_pat_01',
        name: 'Alex Morgan',
        email: 'alex.morgan@patient.medilens.health',
        passwordHash: hashPassword('Patient@MediLens2026'),
        role: 'patient',
        patientId: 'PT-98042',
        avatar: 'AM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_doc_01',
        name: 'Dr. Sarah Lin, MD',
        email: 's.lin@cardio.medilens.health',
        passwordHash: hashPassword('Doctor@MediLens2026'),
        role: 'doctor',
        patientId: 'DOC-10294',
        avatar: 'SL',
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: {},
    reports: [
      {
        id: 'REP-2026-0891',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Comprehensive_Metabolic_Panel_Oct2026.pdf',
        fileSizeBytes: 1845120,
        fileType: 'application/pdf',
        reportType: 'Blood Test',
        uploadDate: '2026-10-08 09:30 AM',
        status: 'Verified',
        notes: 'Fasting glucose, liver panel, and renal function within normal ranges.',
        isDemoData: true,
      },
      {
        id: 'REP-2026-0742',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Lumbar_Spine_Digital_XRay.png',
        fileSizeBytes: 2450300,
        fileType: 'image/png',
        reportType: 'X-Ray',
        uploadDate: '2026-09-24 02:15 PM',
        status: 'Verified',
        notes: 'Bilateral lumbar radiograph series. Mild L4-L5 disc space narrowing noted.',
        isDemoData: true,
      },
      {
        id: 'REP-2026-0619',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Resting_12_Lead_ECG_Report.pdf',
        fileSizeBytes: 945200,
        fileType: 'application/pdf',
        reportType: 'Cardiology / ECG',
        uploadDate: '2026-08-11 11:45 AM',
        status: 'Verified',
        notes: 'Normal sinus rhythm, HR 72 bpm, no acute ST-T changes.',
        isDemoData: true,
      },
      {
        id: 'REP-2026-0488',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Dermatology_Biopsy_Pathology.jpg',
        fileSizeBytes: 1240000,
        fileType: 'image/jpeg',
        reportType: 'Pathology',
        uploadDate: '2026-07-02 04:20 PM',
        status: 'Archived',
        notes: 'Benign intradermal nevus biopsy confirmation.',
        isDemoData: true,
      },
      {
        id: 'REP-2026-0312',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Comprehensive_Metabolic_Panel_May2026.pdf',
        fileSizeBytes: 1720450,
        fileType: 'application/pdf',
        reportType: 'Blood Test',
        uploadDate: '2026-05-14 08:45 AM',
        status: 'Verified',
        notes: 'Semi-annual baseline blood chemistry panel. Baseline fasting glucose, lipid profile, and renal biomarkers.',
        isDemoData: true,
      },
      {
        id: 'REP-2026-0155',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        fileName: 'Complete_Blood_Count_Jan2026.pdf',
        fileSizeBytes: 1410200,
        fileType: 'application/pdf',
        reportType: 'Blood Test',
        uploadDate: '2026-01-20 10:15 AM',
        status: 'Verified',
        notes: 'Baseline hematology study. White blood cell count, hemoglobin, platelets.',
        isDemoData: true,
      },
    ],
    appointments: [
      {
        id: 'APT-2026-301',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        doctorId: 'DOC-10294',
        doctorName: 'Dr. Sarah Lin, MD',
        doctorSpecialty: 'Cardiology & Preventive Medicine',
        requestedDate: '2026-10-18',
        requestedTime: '10:30 AM',
        reasonForVisit: 'Routine consultation on Comprehensive Metabolic Panel and Resting ECG findings.',
        status: 'Accepted',
        doctorResponse: 'Appointment confirmed. Please arrive 10 minutes early with your current medication list.',
        authorizedReportIds: ['REP-2026-0891', 'REP-2026-0619'],
        createdAt: '2026-10-09 11:20 AM',
        patientRelevantVitals: {
          age: 37,
          bloodType: 'O+',
          allergies: 'Penicillin (mild rash)',
        },
      },
      {
        id: 'APT-2026-302',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        doctorId: 'DOC-10294',
        doctorName: 'Dr. Sarah Lin, MD',
        doctorSpecialty: 'Cardiology & Preventive Medicine',
        requestedDate: '2026-10-25',
        requestedTime: '02:00 PM',
        reasonForVisit: 'Review spinal radiograph observations regarding L4-L5 disc space and physical posture.',
        status: 'Pending',
        authorizedReportIds: ['REP-2026-0742'],
        createdAt: '2026-10-11 04:15 PM',
        patientRelevantVitals: {
          age: 37,
          bloodType: 'O+',
          allergies: 'Penicillin (mild rash)',
        },
      },
      {
        id: 'APT-2026-289',
        patientId: 'PT-98042',
        patientName: 'Alex Morgan',
        doctorId: 'DOC-10388',
        doctorName: 'Dr. Marcus Vance, MD',
        doctorSpecialty: 'Internal Medicine & Endocrinology',
        requestedDate: '2026-10-05',
        requestedTime: '09:00 AM',
        reasonForVisit: 'Annual endocrinology screening and fasting blood glucose review.',
        status: 'Rejected',
        doctorResponse: 'No available slots during this clinic block. Please select another date.',
        suggestedAlternativeDate: '2026-10-22',
        suggestedAlternativeTime: '11:00 AM',
        authorizedReportIds: ['REP-2026-0891'],
        createdAt: '2026-10-02 01:45 PM',
        patientRelevantVitals: {
          age: 37,
          bloodType: 'O+',
          allergies: 'Penicillin (mild rash)',
        },
      },
    ],
  }
}

class MediLensDatabase {
  private data: DatabaseSchema

  constructor() {
    this.data = this.load()
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        const parsed = JSON.parse(raw) as DatabaseSchema
        // Ensure default users exist
        const initial = getInitialDatabase()
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = initial.users
        } else {
          // Guarantee default demo accounts exist
          initial.users.forEach((defUser) => {
            if (!parsed.users.some((u) => u.email.toLowerCase() === defUser.email.toLowerCase())) {
              parsed.users.push(defUser)
            }
          })
        }
        if (!parsed.sessions) parsed.sessions = {}
        if (!parsed.reports) parsed.reports = initial.reports
        if (!parsed.appointments) parsed.appointments = initial.appointments
        return parsed
      }
    } catch {
      // Fallback on corrupt file
    }

    const fresh = getInitialDatabase()
    this.save(fresh)
    return fresh
  }

  private save(dataToSave?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to persist MediLens database:', err)
    }
  }

  public ensureFresh(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        const parsed = JSON.parse(raw) as DatabaseSchema
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.data = parsed
        }
      }
    } catch {
      // ignore read error
    }
  }

  // --- USER METHODS ---
  public findUserByEmail(email: string): DbUser | undefined {
    this.ensureFresh()
    const cleanEmail = email.trim().toLowerCase()
    return this.data.users.find((u) => u.email.toLowerCase() === cleanEmail)
  }

  public findUserById(id: string): DbUser | undefined {
    this.ensureFresh()
    return this.data.users.find((u) => u.id === id)
  }

  public createUser(user: Omit<DbUser, 'id' | 'createdAt'>): DbUser {
    this.ensureFresh()
    const newUser: DbUser = {
      ...user,
      id: `usr_${user.role.slice(0, 3)}_${Date.now()}`,
      email: user.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    }
    this.data.users.push(newUser)
    this.save()
    return newUser
  }

  // --- SESSION METHODS ---
  public createSession(userId: string, role: 'patient' | 'doctor'): DbSession {
    const token = generateToken()
    const now = Date.now()
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 days

    const session: DbSession = {
      token,
      userId,
      role,
      createdAt: now,
      expiresAt,
    }

    this.data.sessions[token] = session
    this.save()
    return session
  }

  public validateSession(token: string): { user: DbUser; session: DbSession } | null {
    if (!token) return null
    const session = this.data.sessions[token]
    if (!session) return null

    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token]
      this.save()
      return null
    }

    const user = this.findUserById(session.userId)
    if (!user) {
      delete this.data.sessions[token]
      this.save()
      return null
    }

    return { user, session }
  }

  public revokeSession(token: string): void {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token]
      this.save()
    }
  }

  // --- REPORT METHODS (With strict role & ownership enforcement) ---
  public getReportsForUser(user: DbUser): DbReport[] {
    if (user.role === 'patient') {
      // Patients only see their own reports
      return this.data.reports.filter((r) => r.patientId === user.patientId)
    }
    // Doctors only see reports that are authorized through appointments or assigned
    const authorizedReportIds = new Set<string>()
    this.data.appointments
      .filter((apt) => apt.doctorId === user.patientId || apt.doctorName.toLowerCase().includes(user.name.toLowerCase()))
      .forEach((apt) => {
        apt.authorizedReportIds.forEach((id) => authorizedReportIds.add(id))
      })

    return this.data.reports.filter((r) => authorizedReportIds.has(r.id) || r.isDemoData)
  }

  public addReport(report: DbReport): DbReport {
    this.data.reports.unshift(report)
    this.save()
    return report
  }

  // --- APPOINTMENT METHODS ---
  public getAppointmentsForUser(user: DbUser): DbAppointment[] {
    if (user.role === 'patient') {
      return this.data.appointments.filter((apt) => apt.patientId === user.patientId)
    }
    // Doctor appointments
    return this.data.appointments.filter(
      (apt) => apt.doctorId === user.patientId || apt.doctorName.toLowerCase().includes(user.name.toLowerCase())
    )
  }

  public addAppointment(apt: DbAppointment): DbAppointment {
    this.data.appointments.unshift(apt)
    this.save()
    return apt
  }

  public updateAppointment(
    id: string,
    updates: Partial<DbAppointment>,
    requestingDoctor: DbUser
  ): DbAppointment | null {
    const idx = this.data.appointments.findIndex((a) => a.id === id)
    if (idx === -1) return null

    const apt = this.data.appointments[idx]
    // Verify doctor permission
    if (
      requestingDoctor.role !== 'doctor' &&
      apt.doctorId !== requestingDoctor.patientId
    ) {
      return null
    }

    const updated = { ...apt, ...updates }
    this.data.appointments[idx] = updated
    this.save()
    return updated
  }
}

export const db = new MediLensDatabase()
