import { useState } from 'react'
import type { Appointment, Language } from './types'
import { t } from './i18n'
import './DoctorAppointmentReviewModal.css'

interface DoctorAppointmentReviewModalProps {
  appointment: Appointment
  language?: Language
  onConfirmAction: (
    action: 'Accepted' | 'Rejected',
    doctorResponse: string,
    altDate?: string,
    altTime?: string
  ) => void
  onClose: () => void
}

const PRESET_REJECTION_REASONS_EN = [
  'No available slots. Please select another date.',
  'Physician is scheduled in clinical surgery during this window. Alternative date suggested.',
  'Please complete routine fasting blood work before scheduling this consultation.',
  'Clinic block fully booked. Please consult with our nurse coordinator or choose another day.',
]

const PRESET_REJECTION_REASONS_TA = [
  'நேரம் ஒதுக்கீடு காலியாக இல்லை. தயவுசெய்து மற்றொரு தேதியைத் தேர்ந்தெடுக்கவும்.',
  'மருத்துவர் இந்த நேரத்தில் அறுவை சிகிச்சையில் உள்ளார். மாற்று தேதி பரிந்துரைக்கப்படுகிறது.',
  'இந்த ஆலோசனைக்கு முன் வழக்கமான வெறும் வயிற்று இரத்தப் பரிசோதனையை முடிக்கவும்.',
  'மருத்துவமனை நேரம் முழுமையாக நிரம்பியுள்ளது. மற்றொரு நாளைத் தேர்ந்தெடுக்கவும்.',
]

export default function DoctorAppointmentReviewModal({
  appointment,
  language = 'en',
  onConfirmAction,
  onClose,
}: DoctorAppointmentReviewModalProps) {
  const [actionType, setActionType] = useState<'Accepted' | 'Rejected'>('Accepted')
  const [acceptNote, setAcceptNote] = useState<string>(
    language === 'ta'
      ? 'சந்திப்பு உறுதி செய்யப்பட்டது. உங்கள் அறிக்கைகள் மற்றும் உடல்நலப் பதிவுகளை ஆய்வு செய்ய காத்திருக்கிறேன்.'
      : 'Appointment confirmed. Looking forward to reviewing your records and progress.'
  )

  const presetReasons = language === 'ta' ? PRESET_REJECTION_REASONS_TA : PRESET_REJECTION_REASONS_EN
  const [rejectReason, setRejectReason] = useState<string>(presetReasons[0])
  const [customRejectReason, setCustomRejectReason] = useState<string>('')
  const [suggestAlternative, setSuggestAlternative] = useState<boolean>(true)
  const [alternativeDate, setAlternativeDate] = useState<string>(() => {
    // Default to +3 days from requested date
    return new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  })
  const [alternativeTime, setAlternativeTime] = useState<string>('11:00 AM')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (actionType === 'Accepted') {
      onConfirmAction('Accepted', acceptNote.trim())
      onClose()
    } else {
      const finalReason =
        rejectReason === 'CUSTOM' ? customRejectReason.trim() : rejectReason

      if (!finalReason) {
        setErrorMsg(t('specifyDeclineReasonError', language))
        return
      }

      onConfirmAction(
        'Rejected',
        finalReason,
        suggestAlternative ? alternativeDate : undefined,
        suggestAlternative ? alternativeTime : undefined
      )
      onClose()
    }
  }

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="review-modal-header">
          <div className="header-title-box">
            <span className="stethoscope-icon">🩺</span>
            <div>
              <span className="review-pill">
                {language === 'ta' ? 'மருத்துவர் முடிவு செயல்முறை' : 'Clinical Response Workflow'}
              </span>
              <h2 className="review-title">{t('reviewModalTitle', language)}</h2>
              <span className="review-sub">
                ID: {appointment.id} • {appointment.patientName} ({appointment.patientId})
              </span>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close review modal">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="review-modal-body">
            {/* Patient Context Overview */}
            <div className="patient-context-card">
              <div className="context-row">
                <div>
                  <span className="label">{language === 'ta' ? 'நோயாளி பெயர்:' : 'Patient Name:'}</span>
                  <strong>{appointment.patientName}</strong>
                </div>
                <div>
                  <span className="label">{language === 'ta' ? 'கோரப்பட்ட நேரம்:' : 'Requested Date & Time:'}</span>
                  <strong>
                    {appointment.requestedDate} at {appointment.requestedTime}
                  </strong>
                </div>
                <div>
                  <span className="label">{language === 'ta' ? 'உடல்நலக் குறிப்பு:' : 'Relevant Vitals:'}</span>
                  <span>
                    {language === 'ta' ? 'வயது' : 'Age'}: {appointment.patientRelevantVitals?.age ?? 37} • {language === 'ta' ? 'இரத்தம்' : 'Blood'}: {appointment.patientRelevantVitals?.bloodType ?? 'O+'}
                  </span>
                </div>
              </div>
              <div className="reason-row">
                <span className="label">{t('reasonForVisitCol', language)}:</span>
                <p>“{appointment.reasonForVisit}”</p>
              </div>
            </div>

            {errorMsg && (
              <div className="review-alert-error" role="alert">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Decision Tabs */}
            <div className="action-toggle-tabs">
              <button
                type="button"
                className={`tab-toggle accept ${actionType === 'Accepted' ? 'active' : ''}`}
                onClick={() => setActionType('Accepted')}
              >
                {t('acceptTabBtn', language)}
              </button>
              <button
                type="button"
                className={`tab-toggle reject ${actionType === 'Rejected' ? 'active' : ''}`}
                onClick={() => setActionType('Rejected')}
              >
                {t('declineTabBtn', language)}
              </button>
            </div>

            {/* Form Fields for Accept */}
            {actionType === 'Accepted' ? (
              <div className="accept-fields-box">
                <label htmlFor="accept-note">{t('acceptNotesLabel', language)}:</label>
                <textarea
                  id="accept-note"
                  className="review-textarea"
                  rows={3}
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  placeholder={t('acceptNotesPlaceholder', language)}
                />
              </div>
            ) : (
              /* Form Fields for Reject */
              <div className="reject-fields-box">
                <label className="field-label">{t('declineReasonSelectLabel', language)}</label>
                <div className="reasons-radio-list">
                  {presetReasons.map((reason) => (
                    <label key={reason} className="radio-label-card">
                      <input
                        type="radio"
                        name="reject-reason-radio"
                        checked={rejectReason === reason}
                        onChange={() => setRejectReason(reason)}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                  <label className="radio-label-card">
                    <input
                      type="radio"
                      name="reject-reason-radio"
                      checked={rejectReason === 'CUSTOM'}
                      onChange={() => setRejectReason('CUSTOM')}
                    />
                    <span>{language === 'ta' ? 'தனிப்பயன் விளக்கம்...' : 'Custom explanation...'}</span>
                  </label>
                </div>

                {rejectReason === 'CUSTOM' && (
                  <textarea
                    className="review-textarea custom-reason-area"
                    rows={2}
                    placeholder={t('customReasonPlaceholder', language)}
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    required
                  />
                )}

                {/* Alternative Date Option */}
                <div className="alternative-date-box">
                  <label className="checkbox-toggle">
                    <input
                      type="checkbox"
                      checked={suggestAlternative}
                      onChange={(e) => setSuggestAlternative(e.target.checked)}
                    />
                    <strong>{t('suggestAlternativeToggle', language)}</strong>
                  </label>

                  {suggestAlternative && (
                    <div className="alt-fields-grid">
                      <div>
                        <label htmlFor="alt-date">{t('alternativeDateLabel', language)}:</label>
                        <input
                          id="alt-date"
                          type="date"
                          className="review-input"
                          value={alternativeDate}
                          onChange={(e) => setAlternativeDate(e.target.value)}
                          required={suggestAlternative}
                        />
                      </div>
                      <div>
                        <label htmlFor="alt-time">{t('alternativeTimeLabel', language)}:</label>
                        <select
                          id="alt-time"
                          className="review-input"
                          value={alternativeTime}
                          onChange={(e) => setAlternativeTime(e.target.value)}
                        >
                          <option value="09:30 AM">09:30 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="02:30 PM">02:30 PM</option>
                          <option value="04:00 PM">04:00 PM</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="review-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              className={`btn ${actionType === 'Accepted' ? 'btn-primary' : 'btn-danger'}`}
            >
              {actionType === 'Accepted'
                ? (language === 'ta' ? 'சந்திப்பை உறுதி செய்து ஏற்கவும்' : 'Confirm & Accept Appointment')
                : (language === 'ta' ? 'மறுப்பை உறுதி செய்து நோயாளிக்கு அறிவிக்கவும்' : 'Confirm Rejection & Notify Patient')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
