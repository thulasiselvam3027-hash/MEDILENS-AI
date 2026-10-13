export type UserRole = 'patient' | 'doctor'

export interface UserSession {
  id: string
  name: string
  role: UserRole
  email: string
  patientId: string
  avatar: string
  isDemoSession: boolean
}

export type ReportType =
  | 'Blood Test'
  | 'MRI / CT Scan'
  | 'X-Ray'
  | 'Pathology'
  | 'Prescription'
  | 'Cardiology / ECG'
  | 'General Checkup'

export type ReportStatus = 'Verified' | 'Pending Review' | 'Archived'

export interface MedicalReport {
  id: string
  patientId: string
  patientName: string
  fileName: string
  fileSizeBytes: number
  fileType: string
  reportType: ReportType
  uploadDate: string
  status: ReportStatus
  notes?: string
  dataUrl?: string
  rawText?: string
  isDemoData?: boolean
}

export type Language = 'en' | 'ta'

export type ComparisonStatus =
  | 'Within Reference Range'
  | 'Higher than Laboratory Range'
  | 'Lower than Laboratory Range'
  | 'Reference Range Not Specified'

export interface BiomarkerRecord {
  id: string
  testName: string
  testNameTa?: string
  resultValue: string
  unit: string
  referenceRange: string // Exact printed range or "Not Specified"
  comparisonStatus: ComparisonStatus
  plainExplanation: string
  plainExplanationTa?: string
  possibleCausesNote: string
  possibleCausesNoteTa?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  isSafetyWarning?: boolean
}

export type AppointmentStatus = 'Pending' | 'Accepted' | 'Rejected'

export interface DoctorProfile {
  id: string
  name: string
  title: string
  specialty: string
  clinic: string
  avatar: string
  availableDays: string[]
  availableHours: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  requestedDate: string
  requestedTime: string
  reasonForVisit: string
  status: AppointmentStatus
  doctorResponse?: string
  suggestedAlternativeDate?: string
  suggestedAlternativeTime?: string
  authorizedReportIds: string[] // Specific reports patient authorized doctor to access
  createdAt: string
  patientRelevantVitals?: {
    age: number
    bloodType: string
    allergies: string
  }
}

export interface ComparisonBiomarkerMatch {
  testName: string
  testNameTa?: string
  unit: string
  report1Date: string
  report1Value: string
  report1Status: ComparisonStatus
  report2Date: string
  report2Value: string
  report2Status: ComparisonStatus
  referenceRange: string
  changeDirection: 'Increased' | 'Decreased' | 'Unchanged' | 'Inconclusive'
  numericalChange?: number | null
  percentageChange?: string | null
  changeSummary: string
  changeSummaryTa?: string
  isCompatible?: boolean
  incompatibilityReason?: string
  incompatibilityReasonTa?: string
}

export interface UnmatchedBiomarkerItem {
  id: string
  testName: string
  testNameTa?: string
  reportFileName: string
  reportDate: string
  resultValue: string
  unit: string
  referenceRange: string
  comparisonStatus: ComparisonStatus
  reason: string
  reasonTa: string
}


export const DEMO_PATIENT: UserSession = {
  id: 'usr_pat_01',
  name: 'Alex Morgan',
  role: 'patient',
  email: 'alex.morgan@patient.medilens.health',
  patientId: 'PT-98042',
  avatar: 'AM',
  isDemoSession: true,
}

export const DEMO_DOCTORS: DoctorProfile[] = [
  {
    id: 'DOC-10294',
    name: 'Dr. Sarah Lin, MD',
    title: 'Senior Clinical Cardiologist',
    specialty: 'Cardiology & Preventive Medicine',
    clinic: 'MediLens Heart & Diagnostic Center',
    avatar: 'SL',
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    availableHours: '09:00 AM - 04:30 PM',
  },
  {
    id: 'DOC-10388',
    name: 'Dr. Marcus Vance, MD',
    title: 'Chief of Internal Medicine',
    specialty: 'Internal Medicine & Endocrinology',
    clinic: 'MediLens Comprehensive Care Pavilion',
    avatar: 'MV',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableHours: '10:00 AM - 05:00 PM',
  },
  {
    id: 'DOC-10452',
    name: 'Dr. Elena Rostova, MD',
    title: 'Diagnostic Radiologist',
    specialty: 'Radiology & Imaging Diagnostics',
    clinic: 'MediLens Advanced Imaging Suites',
    avatar: 'ER',
    availableDays: ['Tuesday', 'Wednesday', 'Thursday'],
    availableHours: '08:30 AM - 03:00 PM',
  },
]

export const DEMO_DOCTOR: UserSession = {
  id: 'usr_doc_01',
  name: 'Dr. Sarah Lin, MD',
  role: 'doctor',
  email: 's.lin@cardio.medilens.health',
  patientId: 'DOC-10294',
  avatar: 'SL',
  isDemoSession: true,
}
