import { useState, useRef, useEffect } from 'react'
import LoginPage from './LoginPage'
import ReportExplainModal from './ReportExplainModal'
import ReportComparisonModal from './ReportComparisonModal'
import AppointmentBookingModal from './AppointmentBookingModal'
import DoctorAppointmentReviewModal from './DoctorAppointmentReviewModal'
import { extractTextFromPdf } from './reportExplainer'
import { getStoredAppointments, saveStoredAppointments } from './dataStore'
import { t } from './i18n'
import {
  type UserSession,
  type MedicalReport,
  type ReportType,
  type Appointment,
  type Language,
} from './types'
import './App.css'

// Initial Realistic Fictional Medical Reports
const INITIAL_DEMO_REPORTS: MedicalReport[] = [
  {
    id: 'REP-2026-0891',
    patientId: 'PT-98042',
    patientName: 'Alex Morgan',
    fileName: 'Comprehensive_Metabolic_Panel_Oct2026.pdf',
    fileSizeBytes: 1845120, // ~1.76 MB
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
    fileSizeBytes: 2450300, // ~2.33 MB
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
    fileSizeBytes: 945200, // ~923 KB
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
]

const REPORT_TYPES: ReportType[] = [
  'Blood Test',
  'MRI / CT Scan',
  'X-Ray',
  'Pathology',
  'Prescription',
  'Cardiology / ECG',
  'General Checkup',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default function App() {
  // Language State: 'en' | 'ta'
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('medilens_language')
      if (saved === 'en' || saved === 'ta') {
        return saved
      }
    } catch {
      // fallback
    }
    return 'en'
  })

  // Persist language choice
  useEffect(() => {
    try {
      localStorage.setItem('medilens_language', language)
    } catch {
      // ignore
    }
  }, [language])

  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('medilens_auth_token')
    } catch {
      return null
    }
  })
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('medilens_auth_token')
    } catch {
      return false
    }
  })

  // Verify stored session token on mount
  useEffect(() => {
    if (!authToken) {
      return
    }

    let isMounted = true
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (res) => {
        if (!isMounted) return
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setCurrentUser(data.user)
          } else {
            setCurrentUser(null)
            setAuthToken(null)
            localStorage.removeItem('medilens_auth_token')
          }
        } else {
          setCurrentUser(null)
          setAuthToken(null)
          localStorage.removeItem('medilens_auth_token')
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null)
          setAuthToken(null)
          try {
            localStorage.removeItem('medilens_auth_token')
          } catch {
            // ignore
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsVerifyingSession(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [authToken])

  // Patient tab: reports, appointments, or overview
  const [patientTab, setPatientTab] = useState<'reports' | 'appointments' | 'overview'>('reports')
  // Doctor tab: requests, upcoming, or submissions
  const [doctorTab, setDoctorTab] = useState<'requests' | 'upcoming' | 'submissions'>('requests')

  // Reports state (with localStorage persistence fallback)
  const [reports, setReports] = useState<MedicalReport[]>(() => {
    try {
      const saved = localStorage.getItem('medilens_demo_reports')
      if (saved) {
        const parsed: MedicalReport[] = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((r) => r.id))
          const missing = INITIAL_DEMO_REPORTS.filter((r) => !existingIds.has(r.id))
          if (missing.length > 0) {
            return [...parsed, ...missing]
          }
          return parsed
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_REPORTS
  })

  // Synchronize reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('medilens_demo_reports', JSON.stringify(reports))
    } catch {
      // localstorage quota full or error
    }
  }, [reports])

  // Appointments state (connected across patient and doctor views)
  const [appointments, setAppointments] = useState<Appointment[]>(() => getStoredAppointments())

  useEffect(() => {
    saveStoredAppointments(appointments)
  }, [appointments])

  // Synchronize reports and appointments from protected backend API
  useEffect(() => {
    if (!authToken || !currentUser) return
    let isCancelled = false

    async function fetchBackendData() {
      try {
        const repRes = await fetch('/api/reports', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (repRes.ok) {
          const data = await repRes.json()
          if (!isCancelled && Array.isArray(data.reports) && data.reports.length > 0) {
            setReports(data.reports)
          }
        }
      } catch (err) {
        console.warn('Reports sync error:', err)
      }

      try {
        const aptRes = await fetch('/api/appointments', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (aptRes.ok) {
          const data = await aptRes.json()
          if (!isCancelled && Array.isArray(data.appointments)) {
            setAppointments(data.appointments)
          }
        }
      } catch (err) {
        console.warn('Appointments sync error:', err)
      }
    }

    fetchBackendData()
    return () => {
      isCancelled = true
    }
  }, [authToken, currentUser])

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('Blood Test')
  const [reportNotes, setReportNotes] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Filter & Search in History
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')

  // Modals State
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null)
  const [explainReport, setExplainReport] = useState<MedicalReport | null>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [comparisonInitialReport, setComparisonInitialReport] = useState<MedicalReport | undefined>(undefined)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null)
  const [unauthorizedReportAttempt, setUnauthorizedReportAttempt] = useState<MedicalReport | null>(null)

  // Helper translations for categories
  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'Blood Test':
        return t('catBloodTest', language)
      case 'MRI / CT Scan':
        return t('catMriCt', language)
      case 'X-Ray':
        return t('catXRay', language)
      case 'Pathology':
        return t('catPathology', language)
      case 'Prescription':
        return t('catPrescription', language)
      case 'Cardiology / ECG':
        return t('catCardiology', language)
      case 'General Checkup':
        return t('catGeneralCheckup', language)
      default:
        return type
    }
  }

  // Helper translations for status tags
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Verified':
        return t('statusVerified', language)
      case 'Pending Review':
      case 'Pending':
        return t('statusPendingReview', language)
      case 'Archived':
        return t('statusArchived', language)
      case 'Accepted':
        return t('statusAccepted', language)
      case 'Rejected':
        return t('statusRejected', language)
      default:
        return status
    }
  }

  // Calculate authorized report IDs across appointments for the doctor
  const patientAuthorizedReportIds = new Set(
    appointments.flatMap((apt) => apt.authorizedReportIds)
  )

  // Doctor Report Open Permission Check
  const handleDoctorOpenReport = (report: MedicalReport) => {
    if (patientAuthorizedReportIds.has(report.id)) {
      setPreviewReport(report)
    } else {
      setUnauthorizedReportAttempt(report)
    }
  }

  // File validation
  const validateAndSetFile = (file: File) => {
    setUploadError(null)
    setUploadSuccessMsg(null)

    // Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(ext)
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type)

    if (!isExtensionAllowed && !isMimeAllowed) {
      setUploadError(
        language === 'ta'
          ? `ஆதரிக்கப்படாத கோப்பு வடிவம் "${ext}". PDF, JPG அல்லது PNG ஆவணத்தைத் தேர்ந்தெடுக்கவும்.`
          : `Unsupported file format "${ext}". Please choose a PDF, JPG, or PNG document.`
      )
      setSelectedFile(null)
      setFileDataUrl(null)
      return false
    }

    // Check size limit (10MB)
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        language === 'ta'
          ? `கோப்பு அளவு 10MB வரம்பை மீறுகிறது (${formatBytes(file.size)}). சிறிய கோப்பைத் தேர்ந்தெடுக்கவும்.`
          : `File size exceeds 10MB limit (${formatBytes(file.size)}). Please compress your report or choose a smaller file.`
      )
      setSelectedFile(null)
      setFileDataUrl(null)
      return false
    }

    if (file.size === 0) {
      setUploadError(
        language === 'ta'
          ? 'தேர்ந்தெடுக்கப்பட்ட கோப்பில் தரவு எதுவும் இல்லை. சரியான கோப்பைத் தேர்ந்தெடுக்கவும்.'
          : 'The selected file is empty. Please select a valid document.'
      )
      setSelectedFile(null)
      setFileDataUrl(null)
      return false
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setFileDataUrl(reader.result as string)
    }
    reader.onerror = () => {
      setFileDataUrl(null)
    }
    reader.readAsDataURL(file)

    return true
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError(t('fileUploadErrorEmpty', language))
      return
    }

    setUploadStatus('uploading')
    setUploadError(null)

    setTimeout(async () => {
      const now = new Date()
      const formattedDate =
        now.toISOString().slice(0, 10) +
        ' ' +
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      let rawExtractedText = ''
      if (selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfExtract = await extractTextFromPdf(selectedFile)
          rawExtractedText = pdfExtract.text
        } catch {
          rawExtractedText = ''
        }
      }

      const newReport: MedicalReport = {
        id: `REP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: currentUser ? currentUser.patientId : 'PT-DEMO',
        patientName: currentUser ? currentUser.name : 'Demo Patient',
        fileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        reportType: selectedReportType,
        uploadDate: formattedDate,
        status: 'Pending Review',
        notes:
          reportNotes.trim() ||
          (language === 'ta' ? 'நோயாளி பதிவேற்றிய பரிசோதனை அறிக்கை' : 'Uploaded by patient for clinical review'),
        dataUrl: fileDataUrl || undefined,
        rawText: rawExtractedText || undefined,
        isDemoData: true,
      }

      // Sync report to backend database
      if (authToken) {
        fetch('/api/reports', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newReport),
        }).catch((e) => console.warn('Backend report sync error:', e))
      }

      setReports((prev) => [newReport, ...prev])
      setUploadStatus('success')
      setUploadSuccessMsg(
        language === 'ta'
          ? `"${selectedFile.name}" வெற்றிகரமாகப் பதிவேற்றப்பட்டது, மருத்துவர் மதிப்பாய்வுக்கு அனுப்பப்பட்டுள்ளது.`
          : `"${selectedFile.name}" was uploaded successfully and queued for clinical review.`
      )

      // Reset file input
      setSelectedFile(null)
      setFileDataUrl(null)
      setReportNotes('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        setUploadStatus('idle')
      }, 5000)
    }, 1100)
  }

  const handleClearSelected = () => {
    setSelectedFile(null)
    setFileDataUrl(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Appointment Actions
  const handleBookAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev])
    setPatientTab('appointments')
    if (authToken) {
      fetch('/api/appointments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApt),
      }).catch((e) => console.warn('Backend appointment sync error:', e))
    }
  }

  const handleDoctorConfirmAction = (
    action: 'Accepted' | 'Rejected',
    doctorResponse: string,
    altDate?: string,
    altTime?: string
  ) => {
    if (!reviewingAppointment) return

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== reviewingAppointment.id) return apt
        return {
          ...apt,
          status: action,
          doctorResponse,
          suggestedAlternativeDate: altDate,
          suggestedAlternativeTime: altTime,
        }
      })
    )

    if (authToken) {
      fetch(`/api/appointments/${reviewingAppointment.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          doctorResponse,
          suggestedAlternativeDate: altDate,
          suggestedAlternativeTime: altTime,
        }),
      }).catch((e) => console.warn('Backend appointment patch error:', e))
    }

    setReviewingAppointment(null)
  }

  const handlePatientAcceptAlternative = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== aptId) return apt
        return {
          ...apt,
          status: 'Accepted',
          requestedDate: apt.suggestedAlternativeDate || apt.requestedDate,
          requestedTime: apt.suggestedAlternativeTime || apt.requestedTime,
          doctorResponse:
            language === 'ta'
              ? 'நோயாளி மற்றும் மருத்துவரால் மாற்று நேரம் உறுதி செய்யப்பட்டது.'
              : 'Alternative appointment time confirmed by patient and physician.',
          suggestedAlternativeDate: undefined,
          suggestedAlternativeTime: undefined,
        }
      })
    )

    if (authToken) {
      fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Accepted',
          doctorResponse:
            language === 'ta'
              ? 'நோயாளி மற்றும் மருத்துவரால் மாற்று நேரம் உறுதி செய்யப்பட்டது.'
              : 'Alternative appointment time confirmed by patient and physician.',
        }),
      }).catch((e) => console.warn('Backend appointment update error:', e))
    }
  }

  // Filtered reports for current view
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.reportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.notes && rep.notes.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'ALL' || rep.reportType === filterType
    const matchesPatient = currentUser?.role === 'patient' ? rep.patientId === currentUser.patientId : true

    return matchesSearch && matchesType && matchesPatient
  })

  // Patient appointments
  const patientAppointments = appointments.filter((apt) =>
    currentUser?.role === 'patient' ? apt.patientId === currentUser.patientId : true
  )

  // Doctor appointments
  const pendingAppointments = appointments.filter((apt) => apt.status === 'Pending')
  const acceptedAppointments = appointments.filter((apt) => apt.status === 'Accepted')

  const handleLoginSuccess = (user: UserSession, token?: string) => {
    if (token) {
      setAuthToken(token)
      try {
        localStorage.setItem('medilens_auth_token', token)
      } catch {
        // ignore
      }
    }
    setCurrentUser(user)
  }

  const handleSignOut = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        })
      } catch {
        // ignore
      }
    }
    setAuthToken(null)
    setCurrentUser(null)
    try {
      localStorage.removeItem('medilens_auth_token')
    } catch {
      // ignore
    }
  }

  // Session verifying state
  if (isVerifyingSession) {
    return (
      <div className="session-verifying-splash">
        <div className="verifying-card">
          <div className="verifying-icon">⚕️</div>
          <h3>{language === 'ta' ? 'அமர்வை சரிபார்க்கிறது...' : 'Verifying Secure Session...'}</h3>
          <p>{language === 'ta' ? 'MediLens AI பாதுகாப்பான மருத்துவ போர்டல்' : 'MediLens AI Healthcare Security Layer'}</p>
          <div className="spinner-sm" style={{ width: 28, height: 28, borderWidth: 3, margin: '1rem auto' }}></div>
        </div>
      </div>
    )
  }

  // Render Login Screen if currentUser is null
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLoginSuccess}
        language={language}
        onLanguageChange={setLanguage}
      />
    )
  }

  return (
    <div className="medilens-app">
      {/* Top Navbar */}
      <header className="top-nav">
        <div className="nav-brand">
          <div className="logo-mark">
            <span className="plus">+</span>
          </div>
          <div>
            <h1 className="brand-name">{t('brandName', language)}</h1>
            <span className="brand-subtitle">{t('brandTagline', language)}</span>
          </div>
        </div>

        <div className="nav-controls">
          {/* Prominent Bilingual Language Switcher */}
          <div className="lang-switcher" role="group" aria-label="Select language">
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              title="Switch interface to English"
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
              onClick={() => setLanguage('ta')}
              title="இடைமுகத்தை தமிழாக மாற்றுக"
            >
              <span>🇮🇳</span>
              <span>தமிழ்</span>
            </button>
          </div>

          <div className="user-pill">
            <span className="avatar-circle">{currentUser.avatar}</span>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role-badge">
                {currentUser.role === 'patient'
                  ? `${language === 'ta' ? 'நோயாளி' : 'Patient'} (${currentUser.patientId})`
                  : t('clinicalPortal', language)}
              </span>
            </div>
          </div>

          <div className="role-security-badge">
            <span className="verified-role-pill">
              🔒 {currentUser.role === 'doctor'
                ? (language === 'ta' ? 'சரிபார்க்கப்பட்ட மருத்துவர்' : 'Verified Physician')
                : (language === 'ta' ? 'சரிபார்க்கப்பட்ட நோயாளி' : 'Verified Patient')}
            </span>
            <button
              type="button"
              className="pill-btn logout"
              onClick={handleSignOut}
              title="Sign out of MediLens session"
            >
              🚪 {t('signOut', language)}
            </button>
          </div>
        </div>
      </header>

      {/* Demo Notice Banner */}
      <aside className="notice-banner" aria-label="Demo notice">
        <div className="banner-content">
          <span className="shield-icon">🛡️</span>
          <span>{t('demoBanner', language)}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-container">
        {/* DOCTOR DASHBOARD VIEW */}
        {currentUser.role === 'doctor' ? (
          <div className="doctor-dashboard">
            <div className="dash-hero">
              <div className="dash-hero-title">
                <h2>{t('doctorPortalTitle', language)}</h2>
                <p>{t('doctorPortalDesc', language)}</p>
              </div>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-num">{pendingAppointments.length}</span>
                  <span className="stat-label">{t('pendingRequestsCard', language)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{acceptedAppointments.length}</span>
                  <span className="stat-label">{t('confirmedAptsCard', language)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{reports.length}</span>
                  <span className="stat-label">{t('totalDiagnosticFiles', language)}</span>
                </div>
              </div>
            </div>

            {/* Doctor Navigation Tabs */}
            <div className="tab-nav">
              <button
                type="button"
                className={`tab-btn ${doctorTab === 'requests' ? 'active' : ''}`}
                onClick={() => setDoctorTab('requests')}
              >
                {t('docTabIncoming', language)} ({pendingAppointments.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${doctorTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setDoctorTab('upcoming')}
              >
                {t('docTabConfirmed', language)} ({acceptedAppointments.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${doctorTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setDoctorTab('submissions')}
              >
                {t('docTabSubmissions', language)} ({reports.length})
              </button>
            </div>

            {/* DOCTOR TAB 1: INCOMING REQUESTS */}
            {doctorTab === 'requests' && (
              <section className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{t('incomingRequestsTitle', language)}</h3>
                    <p className="card-sub">{t('incomingRequestsSub', language)}</p>
                  </div>
                  <span className="badge-demo">{t('doctorDecisionReq', language)}</span>
                </div>

                {pendingAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon-wrap">☕</span>
                    <h4>{t('noPendingRequests', language)}</h4>
                    <p>{t('noPendingRequestsDesc', language)}</p>
                  </div>
                ) : (
                  <div className="appointments-doctor-list">
                    {pendingAppointments.map((apt) => (
                      <article key={apt.id} className="doctor-apt-card pending-card">
                        <div className="apt-card-header">
                          <div>
                            <span className="apt-id-tag">{apt.id}</span>
                            <h4 className="patient-name-title">{apt.patientName}</h4>
                            <span className="patient-mrn">MRN: {apt.patientId}</span>
                          </div>
                          <span className="status-badge status-pending-review">
                            {t('statusPendingReview', language)}
                          </span>
                        </div>

                        <div className="apt-card-details">
                          <div className="detail-item">
                            <span className="detail-label">{t('requestedSchedule', language)}</span>
                            <strong>
                              📅 {apt.requestedDate} at {apt.requestedTime}
                            </strong>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">{t('relevantVitals', language)}</span>
                            <span>
                              {language === 'ta' ? 'வயது' : 'Age'}: {apt.patientRelevantVitals?.age ?? 37} • {language === 'ta' ? 'இரத்தம்' : 'Blood'}: {apt.patientRelevantVitals?.bloodType ?? 'O+'} • {language === 'ta' ? 'அலர்ஜி' : 'Allergies'}: {apt.patientRelevantVitals?.allergies ?? 'None'}
                            </span>
                          </div>

                          <div className="detail-item reason-item">
                            <span className="detail-label">{t('reasonForVisitCol', language)}:</span>
                            <p className="reason-quote">“{apt.reasonForVisit}”</p>
                          </div>

                          {/* Authorized Medical Reports for this appointment */}
                          <div className="detail-item">
                            <span className="detail-label">
                              {t('authorizedRecordsCount', language)} ({apt.authorizedReportIds.length}):
                            </span>
                            <div className="auth-reports-pills">
                              {apt.authorizedReportIds.map((repId) => {
                                const repObj = reports.find((r) => r.id === repId)
                                return (
                                  <button
                                    key={repId}
                                    type="button"
                                    className="auth-rep-link-btn"
                                    onClick={() => repObj && setPreviewReport(repObj)}
                                    title="Click to view authorized report"
                                  >
                                    📄 {repObj ? repObj.fileName : repId} ({t('authorizedTag', language)})
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="doctor-decision-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setReviewingAppointment(apt)
                            }}
                          >
                            ✕ {t('decline', language)}
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setReviewingAppointment(apt)
                            }}
                          >
                            ✓ {t('accept', language)}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* DOCTOR TAB 2: CONFIRMED APPOINTMENTS */}
            {doctorTab === 'upcoming' && (
              <section className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{t('confirmedAptsTitle', language)}</h3>
                    <p className="card-sub">{t('confirmedAptsSub', language)}</p>
                  </div>
                </div>

                {acceptedAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon-wrap">📅</span>
                    <h4>{t('noConfirmedApts', language)}</h4>
                    <p>{t('noConfirmedAptsDesc', language)}</p>
                  </div>
                ) : (
                  <div className="appointments-doctor-list">
                    {acceptedAppointments.map((apt) => (
                      <article key={apt.id} className="doctor-apt-card confirmed-card">
                        <div className="apt-card-header">
                          <div>
                            <span className="apt-id-tag">{apt.id}</span>
                            <h4 className="patient-name-title">{apt.patientName}</h4>
                            <span className="patient-mrn">MRN: {apt.patientId}</span>
                          </div>
                          <span className="status-badge status-verified">{t('statusVerified', language)}</span>
                        </div>

                        <div className="apt-card-details">
                          <div className="detail-item">
                            <span className="detail-label">{t('confirmedSchedule', language)}</span>
                            <strong>
                              📅 {apt.requestedDate} at {apt.requestedTime}
                            </strong>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">{t('reasonForVisitCol', language)}:</span>
                            <p className="reason-quote">“{apt.reasonForVisit}”</p>
                          </div>

                          {apt.doctorResponse && (
                            <div className="detail-item response-item">
                              <span className="detail-label">{t('yourInstructions', language)}</span>
                              <p className="doctor-inst-text">“{apt.doctorResponse}”</p>
                            </div>
                          )}

                          <div className="detail-item">
                            <span className="detail-label">{t('authorizedDocsLabel', language)}</span>
                            <div className="auth-reports-pills">
                              {apt.authorizedReportIds.map((repId) => {
                                const repObj = reports.find((r) => r.id === repId)
                                return (
                                  <button
                                    key={repId}
                                    type="button"
                                    className="auth-rep-link-btn"
                                    onClick={() => repObj && setPreviewReport(repObj)}
                                  >
                                    📄 {repObj ? repObj.fileName : repId}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* DOCTOR TAB 3: DIAGNOSTIC SUBMISSIONS */}
            {doctorTab === 'submissions' && (
              <section className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{t('docTabSubmissions', language)}</h3>
                    <p className="card-sub">{t('submissionsSub', language)}</p>
                  </div>
                  <div className="badge-demo">{t('consentProtectedMode', language)}</div>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{language === 'ta' ? 'நோயாளி' : 'Patient'}</th>
                        <th>{language === 'ta' ? 'ஆவணம்' : 'Document'}</th>
                        <th>{t('reportCategoryLabel', language).replace(' *', '')}</th>
                        <th>{t('uploadDateLabel', language)}</th>
                        <th>{t('accessConsentCol', language)}</th>
                        <th>{t('actionCol', language)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((rep) => {
                        const isAuthorized = patientAuthorizedReportIds.has(rep.id)
                        return (
                          <tr key={rep.id}>
                            <td className="code-font">{rep.id}</td>
                            <td>
                              <strong>{rep.patientName}</strong>
                              <div className="subtext">{rep.patientId}</div>
                            </td>
                            <td>
                              <div className="file-cell">
                                <span className="file-icon">
                                  {rep.fileType.includes('pdf') ? '📄' : '🖼️'}
                                </span>
                                <div>
                                  <div className="file-name-text">{rep.fileName}</div>
                                  <div className="subtext">{formatBytes(rep.fileSizeBytes)}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="category-tag">{getCategoryLabel(rep.reportType)}</span>
                            </td>
                            <td className="subtext">{rep.uploadDate}</td>
                            <td>
                              <span
                                className={`consent-badge ${
                                  isAuthorized ? 'consent-authorized' : 'consent-restricted'
                                }`}
                              >
                                {isAuthorized ? t('authorizedTag', language) : t('restrictedBadge', language)}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleDoctorOpenReport(rep)}
                                >
                                  {t('preview', language)}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => setExplainReport(rep)}
                                >
                                  ✨ {t('explainReport', language)}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* PATIENT DASHBOARD VIEW */
          <div className="patient-dashboard">
            {/* Patient Header Summary */}
            <div className="dash-hero">
              <div className="dash-hero-title">
                <h2>{t('patientPortalTitle', language)}</h2>
                <p>{t('patientPortalDesc', language)}</p>
              </div>

              <div className="quick-metrics">
                <div className="metric-chip">
                  <span className="chip-label">{t('patientIdLabel', language)}</span>
                  <span className="chip-val">{currentUser.patientId}</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">{t('totalDocsLabel', language)}</span>
                  <span className="chip-val">{filteredReports.length}</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">{t('consultationsLabel', language)}</span>
                  <span className="chip-val">{patientAppointments.length}</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">{t('assignedClinicLabel', language)}</span>
                  <span className="chip-val">{t('assignedClinicVal', language)}</span>
                </div>
              </div>
            </div>

            {/* Patient Navigation Tabs */}
            <div className="tab-nav">
              <button
                type="button"
                className={`tab-btn ${patientTab === 'reports' ? 'active' : ''}`}
                onClick={() => setPatientTab('reports')}
              >
                {t('tabReportsHistory', language)}
              </button>
              <button
                type="button"
                className={`tab-btn ${patientTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setPatientTab('appointments')}
              >
                {t('tabConsultations', language)} ({patientAppointments.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${patientTab === 'overview' ? 'active' : ''}`}
                onClick={() => setPatientTab('overview')}
              >
                {t('tabHealthProfile', language)}
              </button>
            </div>

            {/* PATIENT TAB 1: REPORTS & HISTORY */}
            {patientTab === 'reports' && (
              <div className="phase3-layout">
                {/* 1. UPLOAD MEDICAL REPORT SECTION */}
                <section className="dashboard-card upload-section">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{t('uploadSectionTitle', language)}</h3>
                      <p className="card-sub">{t('uploadSectionSub', language)}</p>
                    </div>
                    <span className="phase-pill">
                      {language === 'ta' ? 'அறிக்கை பதிவேற்றம் & விளக்கம்' : 'Diagnostic Upload & Explain'}
                    </span>
                  </div>

                  {/* Feedback Messages */}
                  {uploadError && (
                    <div className="alert-message alert-error" role="alert">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-body">
                        <strong>{language === 'ta' ? 'பிழை:' : 'Upload Error:'}</strong>
                        <p>{uploadError}</p>
                      </div>
                      <button
                        type="button"
                        className="alert-dismiss"
                        onClick={() => setUploadError(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {uploadSuccessMsg && (
                    <div className="alert-message alert-success" role="status">
                      <span className="alert-icon">✅</span>
                      <div className="alert-body">
                        <strong>{language === 'ta' ? 'வெற்றி:' : 'Success:'}</strong>
                        <p>{uploadSuccessMsg}</p>
                      </div>
                      <button
                        type="button"
                        className="alert-dismiss"
                        onClick={() => setUploadSuccessMsg(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <form className="upload-form" onSubmit={handleUploadSubmit}>
                    {/* Drag and Drop Zone */}
                    <div
                      className={`dropzone ${dragActive ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !selectedFile && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="medical-file-input"
                        className="hidden-file-input"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleFileInputChange}
                      />

                      {!selectedFile ? (
                        <div className="dropzone-prompt">
                          <div className="upload-icon-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <h4>{t('dragPrompt', language)}</h4>
                          <p className="drop-sub">{t('dragOrClick', language)}</p>
                          <div className="file-pills">
                            <span className="file-type-badge">PDF</span>
                            <span className="file-type-badge">JPG</span>
                            <span className="file-type-badge">PNG</span>
                            <span className="file-size-badge">{t('maxFileSize', language)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="selected-file-card" onClick={(e) => e.stopPropagation()}>
                          <div className="file-preview-icon">
                            {selectedFile.type.includes('pdf') ? '📄' : '🖼️'}
                          </div>
                          <div className="selected-file-details">
                            <div className="file-name-row">
                              <span className="file-name-strong" title={selectedFile.name}>
                                {selectedFile.name}
                              </span>
                              <button
                                type="button"
                                className="remove-file-btn"
                                onClick={handleClearSelected}
                                title="Remove file"
                              >
                                ✕ {t('remove', language)}
                              </button>
                            </div>
                            <div className="file-meta-row">
                              <span>
                                <strong>{t('fileSizeLabel', language)}:</strong> {formatBytes(selectedFile.size)}
                              </span>
                              <span>
                                <strong>{language === 'ta' ? 'வகை:' : 'Type:'}</strong> {selectedFile.type || 'Document'}
                              </span>
                              <span>
                                <strong>{language === 'ta' ? 'நிலை:' : 'Status:'}</strong> {t('readyToTransmit', language)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Fields */}
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="report-category">
                          {t('reportCategoryLabel', language)}
                        </label>
                        <select
                          id="report-category"
                          value={selectedReportType}
                          onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                          className="form-select"
                        >
                          {REPORT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {getCategoryLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="report-notes">
                          {t('clinicalNotesLabel', language)}
                        </label>
                        <input
                          id="report-notes"
                          type="text"
                          value={reportNotes}
                          onChange={(e) => setReportNotes(e.target.value)}
                          placeholder={t('clinicalNotesPlaceholder', language)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="upload-submit-bar">
                      <div className="security-assure">
                        <span className="lock-icon">🔒</span>
                        <span>{t('privacyAssurance', language)}</span>
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedFile || uploadStatus === 'uploading'}
                        className={`btn btn-primary submit-btn ${uploadStatus === 'uploading' ? 'loading' : ''}`}
                      >
                        {uploadStatus === 'uploading' ? (
                          <>
                            <span className="spinner"></span>
                            {t('uploading', language)}
                          </>
                        ) : (
                          <>
                            <span>{t('upload', language)}</span>
                            <span className="arrow">→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

                {/* 2. REPORT HISTORY SECTION */}
                <section className="dashboard-card history-section">
                  <div className="history-header">
                    <div>
                      <h3 className="card-title">{t('historyTitle', language)}</h3>
                      <p className="card-sub">{t('historySub', language)}</p>
                    </div>

                    {/* Search and Filters */}
                    <div className="history-controls">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm compare-action-btn"
                        onClick={() => {
                          setComparisonInitialReport(filteredReports[0])
                          setShowComparisonModal(true)
                        }}
                      >
                        <span>⚖️ {t('compareReports', language)}</span>
                      </button>

                      <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                          type="text"
                          placeholder={t('searchPlaceholder', language)}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="search-input"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                      >
                        <option value="ALL">{t('allCategories', language)}</option>
                        {REPORT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {getCategoryLabel(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Empty State */}
                  {filteredReports.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon-wrap">📋</div>
                      <h4>{t('noReportsFound', language)}</h4>
                      <p>
                        {searchQuery || filterType !== 'ALL'
                          ? (language === 'ta' ? 'உங்கள் வடிகட்டலுக்கு பொருந்தும் அறிக்கைகள் எதுவும் இல்லை. வடிப்பானை மீட்டமைக்கவும்.' : 'No reports matched your active filter criteria. Try clearing the search or category filter.')
                          : t('noReportsDesc', language)}
                      </p>
                      {(searchQuery || filterType !== 'ALL') && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSearchQuery('')
                            setFilterType('ALL')
                          }}
                        >
                          {t('resetFilters', language)}
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Reports Card Grid */
                    <div className="reports-grid">
                      {filteredReports.map((report) => (
                        <article key={report.id} className="report-card">
                          <div className="report-card-top">
                            <div className="type-and-id">
                              <span className="report-badge-category">
                                {getCategoryLabel(report.reportType)}
                              </span>
                              <span className="report-id-code">{report.id}</span>
                            </div>
                            <span
                              className={`status-badge status-${report.status.toLowerCase().replace(' ', '-')}`}
                            >
                              {getStatusLabel(report.status)}
                            </span>
                          </div>

                          <div className="report-card-body">
                            <div className="file-info-header">
                              <span className="format-indicator">
                                {report.fileType.includes('pdf') ? 'PDF' : report.fileType.includes('png') ? 'PNG' : 'JPG'}
                              </span>
                              <h4 className="card-filename" title={report.fileName}>
                                {report.fileName}
                              </h4>
                            </div>

                            {report.notes && (
                              <p className="report-card-notes" title={report.notes}>
                                “{report.notes}”
                              </p>
                            )}

                            <div className="report-meta-grid">
                              <div className="meta-cell">
                                <span className="meta-label">{t('fileSizeLabel', language)}</span>
                                <span className="meta-value">{formatBytes(report.fileSizeBytes)}</span>
                              </div>
                              <div className="meta-cell">
                                <span className="meta-label">{t('uploadDateLabel', language)}</span>
                                <span className="meta-value">{report.uploadDate}</span>
                              </div>
                              <div className="meta-cell">
                                <span className="meta-label">{t('ownerLabel', language)}</span>
                                <span className="meta-value">{report.patientName}</span>
                              </div>
                              <div className="meta-cell">
                                <span className="meta-label">{t('consentLabel', language)}</span>
                                <span className="meta-value secure-tag">
                                  {patientAuthorizedReportIds.has(report.id)
                                    ? t('authorizedTag', language)
                                    : t('privateTag', language)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="report-card-footer">
                            <button
                              type="button"
                              className="btn btn-outline preview-btn"
                              onClick={() => setPreviewReport(report)}
                            >
                              <span>👁️ {t('preview', language)}</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary compare-card-btn"
                              onClick={() => {
                                setComparisonInitialReport(report)
                                setShowComparisonModal(true)
                              }}
                              title={t('compareReports', language)}
                            >
                              <span>⚖️ {t('compareReports', language)}</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary explain-btn"
                              onClick={() => setExplainReport(report)}
                            >
                              <span>✨ {t('explainReport', language)}</span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* PATIENT TAB 2: CONSULTATIONS & APPOINTMENTS */}
            {patientTab === 'appointments' && (
              <section className="dashboard-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{t('consultationsTabTitle', language)}</h3>
                    <p className="card-sub">{t('consultationsTabSub', language)}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowBookingModal(true)}
                  >
                    <span>{t('scheduleConsultation', language)}</span>
                  </button>
                </div>

                {patientAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon-wrap">📅</span>
                    <h4>{t('noConsultationsYet', language)}</h4>
                    <p>{t('noConsultationsDesc', language)}</p>
                  </div>
                ) : (
                  <div className="appointments-patient-grid">
                    {patientAppointments.map((apt) => (
                      <article key={apt.id} className="patient-apt-card">
                        <div className="apt-header-row">
                          <div>
                            <span className="apt-id-code">{apt.id}</span>
                            <h4 className="doc-name-head">{apt.doctorName}</h4>
                            <span className="doc-spec-sub">{apt.doctorSpecialty}</span>
                          </div>
                          <span
                            className={`status-badge status-${apt.status.toLowerCase()}`}
                          >
                            {apt.status === 'Pending' && `⏳ ${t('statusPendingReview', language)}`}
                            {apt.status === 'Accepted' && `✅ ${t('statusAccepted', language)}`}
                            {apt.status === 'Rejected' && `✕ ${t('statusRejected', language)}`}
                          </span>
                        </div>

                        <div className="apt-body-details">
                          <div className="detail-row">
                            <span className="detail-title">{t('reqConsultationDate', language)}</span>
                            <strong>
                              📅 {apt.requestedDate} at {apt.requestedTime}
                            </strong>
                          </div>

                          <div className="detail-row">
                            <span className="detail-title">{t('reasonForConsultation', language)}</span>
                            <p className="visit-reason-text">“{apt.reasonForVisit}”</p>
                          </div>

                          {/* Doctor Response / Instructions */}
                          {apt.doctorResponse && (
                            <div className="doctor-response-box">
                              <span className="response-title">{t('doctorResponseTitle', language)}</span>
                              <p className="response-text">“{apt.doctorResponse}”</p>
                            </div>
                          )}

                          {/* Doctor Suggested Alternative Slot */}
                          {apt.suggestedAlternativeDate && (
                            <div className="alt-slot-suggestion-card">
                              <div className="alt-icon">💡</div>
                              <div className="alt-text-wrap">
                                <strong>{t('altSlotRecommended', language)}</strong>
                                <p>
                                  {apt.doctorName}{' '}
                                  {language === 'ta' ? 'பரிந்துரைத்த புதிய நேரம்:' : 'suggested'}{' '}
                                  <strong>
                                    {apt.suggestedAlternativeDate} at {apt.suggestedAlternativeTime}
                                  </strong>
                                  .
                                </p>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm accept-alt-btn"
                                  onClick={() => handlePatientAcceptAlternative(apt.id)}
                                >
                                  {t('acceptAltSlotBtn', language)}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Authorized reports */}
                          <div className="detail-row">
                            <span className="detail-title">{t('authorizedDocsLabel', language)}</span>
                            <div className="auth-pills-row">
                              {apt.authorizedReportIds.length === 0 ? (
                                <small className="muted-text">
                                  {language === 'ta' ? 'அனுமதிக்கப்படவில்லை' : 'None authorized'}
                                </small>
                              ) : (
                                apt.authorizedReportIds.map((repId) => {
                                  const rep = reports.find((r) => r.id === repId)
                                  return (
                                    <span key={repId} className="auth-chip">
                                      📄 {rep ? rep.fileName : repId}
                                    </span>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* PATIENT TAB 3: OVERVIEW */}
            {patientTab === 'overview' && (
              <section className="dashboard-card profile-card">
                <h3 className="card-title">{t('profileTitle', language)}</h3>
                <p className="card-sub">{t('profileSub', language)}</p>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>{t('legalName', language)}</label>
                    <p>Alex Morgan</p>
                  </div>
                  <div className="profile-item">
                    <label>{t('dob', language)}</label>
                    <p>14 May 1989 (37 yrs)</p>
                  </div>
                  <div className="profile-item">
                    <label>{t('primaryDoctor', language)}</label>
                    <p>Dr. Sarah Lin, MD (Cardiology)</p>
                  </div>
                  <div className="profile-item">
                    <label>{t('bloodGroup', language)}</label>
                    <p>O-Positive (O+)</p>
                  </div>
                  <div className="profile-item">
                    <label>{t('knownAllergies', language)}</label>
                    <p>Penicillin (Mild urticaria)</p>
                  </div>
                  <div className="profile-item">
                    <label>{t('emergencyContact', language)}</label>
                    <p>David Morgan (+1 555-019-2831)</p>
                  </div>
                </div>
                <div className="profile-footer-tip">
                  <span>💡 {t('profileTip', language)}</span>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* 3. REPORT PREVIEW MODAL */}
      {previewReport && (
        <div className="modal-backdrop" onClick={() => setPreviewReport(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">📄</span>
                <div>
                  <h3 className="modal-title">{previewReport.fileName}</h3>
                  <div className="modal-sub">
                    <span>{getCategoryLabel(previewReport.reportType)}</span> • <span>ID: {previewReport.id}</span> • <span>{previewReport.uploadDate}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewReport(null)}
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {previewReport.dataUrl && previewReport.fileType.startsWith('image/') ? (
                <div className="image-preview-container">
                  <img
                    src={previewReport.dataUrl}
                    alt={previewReport.fileName}
                    className="modal-image-preview"
                  />
                </div>
              ) : previewReport.dataUrl && previewReport.fileType === 'application/pdf' ? (
                <div className="pdf-preview-container">
                  <iframe
                    src={previewReport.dataUrl}
                    title={previewReport.fileName}
                    className="pdf-iframe"
                  />
                </div>
              ) : (
                <div className="clinical-sheet-preview">
                  <div className="sheet-watermark">FICTIONAL CLINICAL RECORD</div>
                  <div className="sheet-header">
                    <div className="sheet-institution">
                      <h4>MEDILENS CLINICAL HEALTH NETWORK</h4>
                      <p>Department of Diagnostic Medicine • Verified Digital Record</p>
                    </div>
                    <div className="sheet-badge">
                      <span className={`status-badge status-${previewReport.status.toLowerCase().replace(' ', '-')}`}>
                        {getStatusLabel(previewReport.status)}
                      </span>
                    </div>
                  </div>

                  <div className="sheet-patient-bar">
                    <div>
                      <strong>Patient Name:</strong> {previewReport.patientName}
                    </div>
                    <div>
                      <strong>Patient ID:</strong> {previewReport.patientId}
                    </div>
                    <div>
                      <strong>Document ID:</strong> {previewReport.id}
                    </div>
                    <div>
                      <strong>Transmitted:</strong> {previewReport.uploadDate}
                    </div>
                  </div>

                  <div className="sheet-content-section">
                    <h5>Document Overview & Clinical Findings</h5>
                    <div className="finding-box">
                      <p>
                        <strong>Report Category:</strong> {getCategoryLabel(previewReport.reportType)}
                      </p>
                      <p>
                        <strong>Original File:</strong> {previewReport.fileName} ({formatBytes(previewReport.fileSizeBytes)})
                      </p>
                      <p>
                        <strong>Clinical Annotations:</strong> {previewReport.notes || 'No notes provided by patient.'}
                      </p>
                    </div>

                    <div className="sample-parameters">
                      <h6>Diagnostic Summary & Biomarkers (Reference Values)</h6>
                      <div className="parameter-table-mock">
                        <div className="param-row header">
                          <span>Test / Parameter</span>
                          <span>Result</span>
                          <span>Reference Range</span>
                          <span>Evaluation</span>
                        </div>
                        <div className="param-row">
                          <span>Serum Glucose (Fasting)</span>
                          <span>92 mg/dL</span>
                          <span>70 - 99 mg/dL</span>
                          <span className="tag-normal">Normal</span>
                        </div>
                        <div className="param-row">
                          <span>Total Cholesterol</span>
                          <span>178 mg/dL</span>
                          <span>&lt; 200 mg/dL</span>
                          <span className="tag-normal">Desirable</span>
                        </div>
                        <div className="param-row">
                          <span>Hemoglobin A1c</span>
                          <span>5.4%</span>
                          <span>4.0 - 5.6%</span>
                          <span className="tag-normal">Optimal</span>
                        </div>
                        <div className="param-row">
                          <span>Estimated GFR</span>
                          <span>&gt; 90 mL/min</span>
                          <span>&gt; 60 mL/min</span>
                          <span className="tag-normal">Normal</span>
                        </div>
                      </div>
                    </div>

                    <div className="clinical-notice">
                      <span className="shield">🛡️</span>
                      <small>
                        Privacy Notice: Fictional medical report preview generated safely within MediLens demo sandboxing. Real patient records are never loaded or stored.
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-footer-meta">
                <span>{t('fileSizeLabel', language)}: {formatBytes(previewReport.fileSizeBytes)}</span>
                <span>•</span>
                <span>{language === 'ta' ? 'வகை:' : 'Type:'} {previewReport.fileType}</span>
              </div>
              <div className="table-actions-cell">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreviewReport(null)}
                >
                  {t('close', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const rep = previewReport
                    setPreviewReport(null)
                    setComparisonInitialReport(rep)
                    setShowComparisonModal(true)
                  }}
                >
                  ⚖️ {t('compareReports', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const rep = previewReport
                    setPreviewReport(null)
                    setExplainReport(rep)
                  }}
                >
                  ✨ {t('explainReport', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PHASE 4: AI MEDICAL REPORT EXPLANATION MODAL */}
      {explainReport && (
        <ReportExplainModal
          report={explainReport}
          language={language}
          onClose={() => setExplainReport(null)}
          onOpenCompare={(rep) => {
            setExplainReport(null)
            setComparisonInitialReport(rep)
            setShowComparisonModal(true)
          }}
        />
      )}

      {/* 5. REPORT COMPARISON MODAL */}
      {showComparisonModal && (
        <ReportComparisonModal
          reports={reports}
          initialReport1={comparisonInitialReport}
          language={language}
          onClose={() => {
            setShowComparisonModal(false)
            setComparisonInitialReport(undefined)
          }}
        />
      )}

      {/* 6. APPOINTMENT BOOKING MODAL */}
      {showBookingModal && (
        <AppointmentBookingModal
          currentUser={currentUser}
          availableReports={reports}
          language={language}
          onBookAppointment={handleBookAppointment}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* 7. DOCTOR APPOINTMENT REVIEW MODAL */}
      {reviewingAppointment && (
        <DoctorAppointmentReviewModal
          appointment={reviewingAppointment}
          language={language}
          onConfirmAction={handleDoctorConfirmAction}
          onClose={() => setReviewingAppointment(null)}
        />
      )}

      {/* 8. UNAUTHORIZED REPORT ACCESS RESTRICTION MODAL */}
      {unauthorizedReportAttempt && (
        <div className="modal-backdrop" onClick={() => setUnauthorizedReportAttempt(null)}>
          <div className="modal-dialog auth-denied-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header auth-denied-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🔒</span>
                <div>
                  <h3 className="modal-title">{t('accessRestrictedTitle', language)}</h3>
                  <span className="modal-sub">{t('patientConsentPolicy', language)}</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setUnauthorizedReportAttempt(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body auth-denied-body">
              <div className="denied-icon-wrap">🚫</div>
              <h4>{t('patientConsentNotGranted', language)}</h4>
              <p>
                {language === 'ta'
                  ? `நோயாளி ${unauthorizedReportAttempt.patientName} இந்த ஆவணத்தைப் ("${unauthorizedReportAttempt.fileName}") பார்க்க மருத்துவர் அனுமதியை வழங்கவில்லை.`
                  : `Patient ${unauthorizedReportAttempt.patientName} has not granted viewing permission for this document: "${unauthorizedReportAttempt.fileName}".`}
              </p>
              <div className="consent-rule-box">
                <p>{t('privacyComplianceRule', language)}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUnauthorizedReportAttempt(null)}
              >
                {t('returnToDashboard', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="portal-footer">
        <div className="footer-content">
          <div>
            <strong>MediLens AI Health Portal</strong> • Phase 3 & 4 + Consultations & Appointments Active
          </div>
          <div className="footer-links">
            <span>HIPAA Consent Policy Guardrails</span>
            <span>•</span>
            <span>Navy-Blue, White & Teal Healthcare Theme</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
