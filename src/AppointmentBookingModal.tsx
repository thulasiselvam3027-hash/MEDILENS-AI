import { useState } from 'react'
import { DEMO_DOCTORS, type Appointment, type Language, type MedicalReport, type UserSession } from './types'
import { t } from './i18n'
import './AppointmentBookingModal.css'

interface AppointmentBookingModalProps {
  currentUser: UserSession
  availableReports: MedicalReport[]
  language?: Language
  onBookAppointment: (appointment: Appointment) => void
  onClose: () => void
}

export default function AppointmentBookingModal({
  currentUser,
  availableReports,
  language = 'en',
  onBookAppointment,
  onClose,
}: AppointmentBookingModalProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DEMO_DOCTORS[0].id)
  const [requestedDate, setRequestedDate] = useState<string>('')
  const [requestedTime, setRequestedTime] = useState<string>('10:30 AM')
  const [reasonForVisit, setReasonForVisit] = useState<string>('')
  const [authorizedReports, setAuthorizedReports] = useState<string[]>(
    availableReports.slice(0, 2).map((r) => r.id)
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedDoctor = DEMO_DOCTORS.find((d) => d.id === selectedDoctorId) || DEMO_DOCTORS[0]

  const handleToggleReport = (reportId: string) => {
    setAuthorizedReports((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!requestedDate) {
      setFormError(t('bookingFormErrorDate', language))
      return
    }

    if (!reasonForVisit.trim()) {
      setFormError(t('bookingFormErrorReason', language))
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      const now = new Date()
      const newAppointment: Appointment = {
        id: `APT-${now.getFullYear()}-${Math.floor(300 + Math.random() * 700)}`,
        patientId: currentUser.patientId,
        patientName: currentUser.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        requestedDate,
        requestedTime,
        reasonForVisit: reasonForVisit.trim(),
        status: 'Pending',
        authorizedReportIds: authorizedReports,
        createdAt:
          now.toISOString().slice(0, 10) +
          ' ' +
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patientRelevantVitals: {
          age: 37,
          bloodType: 'O+',
          allergies: 'Penicillin (mild rash)',
        },
      }

      onBookAppointment(newAppointment)
      setIsSubmitting(false)
      onClose()
    }, 700)
  }

  // Calculate minimum selectable date (tomorrow)
  const [tomorrowStr] = useState<string>(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))

  return (
    <div className="booking-modal-backdrop" onClick={onClose}>
      <div className="booking-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="booking-modal-header">
          <div className="header-info">
            <span className="calendar-icon">📅</span>
            <div>
              <div className="booking-badge-row">
                <span className="badge-pill">
                  {language === 'ta' ? 'மருத்துவர் நேரடி முன்பதிவு' : 'Direct Provider Scheduling'}
                </span>
                <span className="badge-pill-auth">
                  {language === 'ta' ? 'நோயாளி அனுமதி கட்டுப்பாடு' : 'Explicit Report Consent'}
                </span>
              </div>
              <h2 className="booking-title">{t('scheduleModalTitle', language)}</h2>
              <p className="booking-sub">{t('scheduleModalSub', language)}</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close booking modal">
            ✕
          </button>
        </header>

        {/* Body Form */}
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-modal-body">
            {formError && (
              <div className="booking-alert-error" role="alert">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Step 1: Doctor Selection */}
            <div className="form-section">
              <label className="section-heading">{t('selectPhysicianLabel', language)}</label>
              <div className="doctors-grid">
                {DEMO_DOCTORS.map((doc) => (
                  <div
                    key={doc.id}
                    className={`doctor-card-choice ${selectedDoctorId === doc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctorId(doc.id)}
                  >
                    <div className="doc-avatar">{doc.avatar}</div>
                    <div className="doc-details">
                      <strong>{doc.name}</strong>
                      <span className="doc-spec">{doc.specialty}</span>
                      <small className="doc-clinic">{doc.clinic}</small>
                      <div className="doc-hours">🕒 {doc.availableHours}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Date & Time */}
            <div className="form-section date-time-row">
              <div className="field-group">
                <label htmlFor="appointment-date">{t('preferredDateLabel', language)}</label>
                <input
                  id="appointment-date"
                  type="date"
                  className="form-input-field"
                  min={tomorrowStr}
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="appointment-time">{t('preferredTimeLabel', language)}</label>
                <select
                  id="appointment-time"
                  className="form-select-field"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                >
                  <option value="09:00 AM">
                    09:00 AM - {language === 'ta' ? 'காலை நேரம்' : 'Morning Block'}
                  </option>
                  <option value="10:30 AM">
                    10:30 AM - {language === 'ta' ? 'காலை நேரம்' : 'Morning Block'}
                  </option>
                  <option value="11:45 AM">
                    11:45 AM - {language === 'ta' ? 'நண்பகல் நேரம்' : 'Late Morning'}
                  </option>
                  <option value="02:00 PM">
                    02:00 PM - {language === 'ta' ? 'மதிய நேரம்' : 'Afternoon Block'}
                  </option>
                  <option value="03:30 PM">
                    03:30 PM - {language === 'ta' ? 'மதிய நேரம்' : 'Afternoon Block'}
                  </option>
                  <option value="04:30 PM">
                    04:30 PM - {language === 'ta' ? 'மாலை நேரம்' : 'Evening Block'}
                  </option>
                </select>
              </div>
            </div>

            {/* Step 3: Reason for Visit */}
            <div className="form-section">
              <label htmlFor="visit-reason">{t('reasonForVisitField', language)}</label>
              <textarea
                id="visit-reason"
                className="form-textarea-field"
                rows={3}
                placeholder={t('reasonForVisitPlaceholder', language)}
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                required
              />
            </div>

            {/* Step 4: Medical Report Consent & Authorization */}
            <div className="form-section consent-section">
              <div className="consent-header">
                <div>
                  <label className="section-heading">{t('authorizeReportsHeader', language)}</label>
                  <p className="consent-sub">{t('authorizeReportsHelp', language)}</p>
                </div>
                <span className="privacy-badge">
                  🔒 {language === 'ta' ? 'அனுமதி கட்டுப்பாடு' : 'Access Control Enforced'}
                </span>
              </div>

              {availableReports.length === 0 ? (
                <p className="no-reports-note">{t('noReportsToAuthorize', language)}</p>
              ) : (
                <div className="reports-checklist">
                  {availableReports.map((r) => {
                    const isChecked = authorizedReports.includes(r.id)
                    return (
                      <label key={r.id} className={`report-check-card ${isChecked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleReport(r.id)}
                        />
                        <div className="check-card-info">
                          <span className="rep-name">{r.fileName}</span>
                          <span className="rep-type">
                            {r.reportType} • {r.uploadDate}
                          </span>
                        </div>
                        <span className="auth-status-tag">
                          {isChecked
                            ? (language === 'ta' ? '✓ மருத்துவருக்கு அனுமதிக்கப்பட்டது' : '✓ Authorized for Doctor')
                            : (language === 'ta' ? 'தனிப்பட்டது' : 'Restricted')}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <footer className="booking-modal-footer">
            <div className="footer-notice">
              <span>
                {language === 'ta'
                  ? `நிலை: ${selectedDoctor.name} மதிப்பாய்வு செய்யும் வரை "பரிசீலனையில் உள்ளது" எனக் குறிக்கப்படும்.`
                  : `Status will be marked as Pending until reviewed by ${selectedDoctor.name}.`}
              </span>
            </div>
            <div className="footer-btns">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('cancel', language)}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-primary submit-book-btn ${isSubmitting ? 'loading' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    <span>{t('submitting', language)}</span>
                  </>
                ) : (
                  <>
                    <span>{t('confirmBookingSubmit', language)}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
