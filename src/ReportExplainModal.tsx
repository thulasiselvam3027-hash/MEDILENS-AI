import { useState, useEffect, useRef } from 'react'
import type { BiomarkerRecord, ChatMessage, Language, MedicalReport } from './types'
import {
  evaluateReferenceRange,
  formatPatientFriendlyResultSentence,
  generateInitialBiomarkersForReport,
  getChatbotResponse,
  BIOMARKER_DICTIONARY,
} from './reportExplainer'
import { t } from './i18n'
import { VoiceRecognitionSession, isSpeechRecognitionSupported } from './voiceRecognition'
import './ReportExplainModal.css'

interface ReportExplainModalProps {
  report: MedicalReport
  language?: Language
  onClose: () => void
  onOpenCompare?: (report: MedicalReport) => void
}

type ModalTab = 'review' | 'explanations' | 'chat'

/**
 * Clean markdown symbols for natural text-to-speech without altering test names, numbers, or units.
 */
function prepareTextForSpeech(text: string): string {
  return text
    .replace(/[*_#`~]/g, '')
    .replace(/•/g, ', ')
    .replace(/https?:\/\/\S+/g, '')
    .trim()
}

export default function ReportExplainModal({
  report,
  language = 'en',
  onClose,
  onOpenCompare,
}: ReportExplainModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('review')

  // Text Extraction State
  const [isExtracting, setIsExtracting] = useState(true)
  const [extractedRawText, setExtractedRawText] = useState<string>('')
  const [isScannedImage, setIsScannedImage] = useState<boolean>(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Editable Biomarkers State
  const [biomarkers, setBiomarkers] = useState<BiomarkerRecord[]>([])
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false)

  // Initial greeting according to language
  const initialGreeting =
    language === 'ta'
      ? `வணக்கம், நான் மெடிலென்ஸ் மருத்துவ வழிகாட்டி உதவியாளர். உங்கள் மருத்துவ அறிக்கையை (${report.fileName}) ஆய்வு செய்துள்ளேன்.\n\nமருத்துவச் சொற்களுக்கான எளிய விளக்கம், ஆய்வக வரம்புகள் மற்றும் உங்கள் மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள் குறித்து என்னிடம் கேட்கலாம்.\n\n*பாதுகாப்பு குறிப்பு: இந்த பதில்கள் எளிய புரிதலுக்கானவை மட்டுமே; மருத்துவ சிகிச்சைக்கு மாற்றாகாது.*`
      : `Hello, I'm the MediLens Educational Assistant. I've analyzed your **${report.fileName}** (${report.reportType}).\n\nI can explain laboratory terminology, clarify why reference ranges differ between facilities, or help you organize questions for your physician, Dr. Sarah Lin.\n\n*Safety Notice: Responses are educational only and cannot replace clinical judgment, provide a medical diagnosis, or advise on medications.*`

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_1',
      sender: 'assistant',
      text: initialGreeting,
      timestamp: 'Today',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  // Voice Input (SpeechRecognition) State
  const [isListening, setIsListening] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const [voiceLang, setVoiceLang] = useState<'ta-IN' | 'en-IN' | 'en-US'>(() =>
    language === 'ta' ? 'ta-IN' : 'en-IN'
  )
  const [audioLevel, setAudioLevel] = useState(0)
  const voiceSessionRef = useRef<VoiceRecognitionSession | null>(null)
  const isSpeechRecSupported = isSpeechRecognitionSupported()

  // Sync voiceLang when language prop updates
  useEffect(() => {
    const nextLang = language === 'ta' ? 'ta-IN' : 'en-IN'
    setVoiceLang(nextLang)
    if (voiceSessionRef.current) {
      voiceSessionRef.current.setLanguage(nextLang)
    }
  }, [language])

  // Clean up voice session on unmount
  useEffect(() => {
    return () => {
      if (voiceSessionRef.current) {
        voiceSessionRef.current.stop()
        voiceSessionRef.current = null
      }
    }
  }, [])

  // Spoken Responses (SpeechSynthesis) State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const isSpeechSynthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isBotTyping])

  // Initial Extraction effect
  useEffect(() => {
    let isMounted = true

    const runExtraction = async () => {
      setIsExtracting(true)
      setExtractionError(null)

      try {
        const isPdf = report.fileType.toLowerCase().includes('pdf') || report.fileName.toLowerCase().endsWith('.pdf')
        const isImage = report.fileType.toLowerCase().includes('image') || /\.(png|jpe?g)$/i.test(report.fileName)

        if (isImage) {
          if (isMounted) {
            setIsScannedImage(true)
            setExtractedRawText('')
            setIsExtracting(false)
            const initialList = generateInitialBiomarkersForReport(report, '')
            setBiomarkers(initialList)
          }
          return
        }

        if (isPdf) {
          let textResult = ''
          const scanned = false

          if (report.rawText) {
            textResult = report.rawText
          } else {
            await new Promise((r) => setTimeout(r, 650))
            textResult = `Patient: ${report.patientName} | MRN: ${report.patientId} | Date: ${report.uploadDate}\nReport: ${report.reportType}\nFasting Blood Glucose: 92 mg/dL (Ref: 70 - 99 mg/dL)\nTotal Cholesterol: 178 mg/dL (Ref: < 200 mg/dL)\nSerum Creatinine: 1.0 mg/dL (Ref: 0.7 - 1.3 mg/dL)\neGFR: 95 mL/min/1.73m2 (Ref: > 60 mL/min/1.73m2)`
          }

          if (isMounted) {
            setExtractedRawText(textResult)
            setIsScannedImage(scanned)
            const initialList = generateInitialBiomarkersForReport(report, textResult)
            setBiomarkers(initialList)
            setIsExtracting(false)
          }
        } else {
          if (isMounted) {
            const initialList = generateInitialBiomarkersForReport(report, '')
            setBiomarkers(initialList)
            setIsExtracting(false)
          }
        }
      } catch {
        if (isMounted) {
          setExtractionError(
            language === 'ta'
              ? 'கோப்பிலிருந்து உரையைப் பிரித்தெடுக்க முடியவில்லை. கீழே உள்ள அளவுகளை நீங்களே சரிபார்க்கலாம்.'
              : 'Failed to extract document contents. You can manually enter values below.'
          )
          const initialList = generateInitialBiomarkersForReport(report, '')
          setBiomarkers(initialList)
          setIsExtracting(false)
        }
      }
    }

    runExtraction()

    return () => {
      isMounted = false
    }
  }, [report, language])

  // Handle biomarker edit
  const handleUpdateBiomarker = (
    id: string,
    field: 'testName' | 'resultValue' | 'unit' | 'referenceRange',
    value: string
  ) => {
    setBiomarkers((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b

        const updated = { ...b, [field]: value }
        if (field === 'resultValue' || field === 'referenceRange') {
          updated.comparisonStatus = evaluateReferenceRange(
            field === 'resultValue' ? value : b.resultValue,
            field === 'referenceRange' ? value : b.referenceRange
          )
        }
        if (field === 'testName' && BIOMARKER_DICTIONARY[value]) {
          const dict = BIOMARKER_DICTIONARY[value]
          updated.plainExplanation = dict.plainExplanation
          updated.plainExplanationTa = dict.plainExplanationTa
          updated.possibleCausesNote = dict.possibleCauses
          updated.possibleCausesNoteTa = dict.possibleCausesTa
        }
        return updated
      })
    )
  }

  const handleAddBiomarker = () => {
    const newBio: BiomarkerRecord = {
      id: `bio_${Date.now()}_custom`,
      testName: language === 'ta' ? 'புதிய பரிசோதனை அளவு' : 'New Test Parameter',
      testNameTa: 'புதிய பரிசோதனை அளவு',
      resultValue: '',
      unit: '',
      referenceRange: language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not Specified',
      comparisonStatus: 'Reference Range Not Specified',
      plainExplanation: 'Custom patient-reviewed biomarker.',
      plainExplanationTa: 'நோயாளி சரிபார்த்த தனிப்பயன் பரிசோதனை அளவு.',
      possibleCausesNote:
        'Individual laboratory values must be interpreted by your physician in conjunction with clinical symptoms.',
      possibleCausesNoteTa:
        'தனிப்பட்ட ஆய்வக அளவுகளை உங்கள் மருத்துவரிடம் உடலறிகுறிகளுடன் ஒப்பிட்டு விவாதிக்க வேண்டும்.',
    }
    setBiomarkers((prev) => [...prev, newBio])
  }

  const handleRemoveBiomarker = (id: string) => {
    setBiomarkers((prev) => prev.filter((b) => b.id !== id))
  }

  const handleSwitchTab = (tab: ModalTab) => {
    if (tab !== 'chat') {
      handleStopListening()
      handleStopSpokenAudio()
    }
    setActiveTab(tab)
  }

  const handleGenerateExplanations = () => {
    setIsGeneratingExplanations(true)
    setTimeout(() => {
      setIsGeneratingExplanations(false)
      handleSwitchTab('explanations')
    }, 600)
  }

  // Start Speech Recognition using VoiceRecognitionSession
  const handleStartListening = async () => {
    setVoiceError(null)
    setVoiceHint(null)

    if (!isSpeechRecSupported) {
      setVoiceError(t('voiceNotSupported', language))
      return
    }

    // Cancel any ongoing spoken audio playback first
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
    }

    if (voiceSessionRef.current) {
      voiceSessionRef.current.stop()
      voiceSessionRef.current = null
    }

    const session = new VoiceRecognitionSession(voiceLang, {
      onStart: () => {
        setIsListening(true)
        setVoiceProcessing(false)
        setVoiceError(null)
      },
      onTranscriptChange: (text) => {
        setChatInput(text)
        setVoiceProcessing(true)
      },
      onAudioLevel: (level) => {
        setAudioLevel(level)
      },
      onError: (errType, message) => {
        setIsListening(false)
        setVoiceProcessing(false)
        setAudioLevel(0)
        if (errType === 'permission_denied') {
          setVoiceError(t('micPermissionDenied', language))
        } else if (errType === 'network') {
          setVoiceError(t('micNetworkError', language))
        } else {
          setVoiceError(message)
        }
      },
      onEnd: () => {
        setIsListening(false)
        setVoiceProcessing(false)
        setAudioLevel(0)
        voiceSessionRef.current = null
        setVoiceHint(t('micReviewHint', language))
      },
    })

    voiceSessionRef.current = session
    await session.start()
  }

  // Stop Speech Recognition
  const handleStopListening = () => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.stop()
      voiceSessionRef.current = null
    }
    setIsListening(false)
    setVoiceProcessing(false)
    setAudioLevel(0)
  }

  const handleToggleVoiceLang = () => {
    const nextLang = voiceLang === 'ta-IN' ? 'en-IN' : 'ta-IN'
    setVoiceLang(nextLang)
    if (voiceSessionRef.current) {
      voiceSessionRef.current.setLanguage(nextLang)
    }
  }

  // Speak Chatbot Response using Browser SpeechSynthesis
  const handleSpeakResponse = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceError(t('ttsNotSupported', language))
      return
    }

    // Toggle off if currently speaking this message
    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Clean formatting symbols without changing test names, values, or units
    const cleanText = prepareTextForSpeech(text)
    const utterance = new SpeechSynthesisUtterance(cleanText)
    // Request Tamil (ta-IN) or Indian English (en-IN)
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN'

    // Choose regional voice if available
    const voices = window.speechSynthesis.getVoices()
    if (language === 'ta') {
      const taVoice =
        voices.find((v) => v.lang.toLowerCase() === 'ta-in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ta')) ||
        voices.find((v) => v.name.toLowerCase().includes('tamil'))
      if (taVoice) {
        utterance.voice = taVoice
      }
    } else {
      const inVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.name.toLowerCase().includes('india')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'))
      if (inVoice) {
        utterance.voice = inVoice
      }
    }

    utterance.onstart = () => {
      setSpeakingMessageId(msgId)
    }

    utterance.onend = () => {
      setSpeakingMessageId(null)
    }

    utterance.onerror = () => {
      setSpeakingMessageId(null)
    }

    window.speechSynthesis.speak(utterance)
  }

  // Stop Spoken Audio Playback
  const handleStopSpokenAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingMessageId(null)
  }

  // Cleanup speech resources on unmount
  useEffect(() => {
    return () => {
      if (voiceSessionRef.current) {
        voiceSessionRef.current.stop()
        voiceSessionRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleSendChat = (messageText?: string) => {
    const textToSend = (messageText || chatInput).trim()
    if (!textToSend) return

    handleStopListening()
    setVoiceHint(null)
    setVoiceError(null)

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: now,
    }

    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setIsBotTyping(true)

    setTimeout(() => {
      const botResponse = getChatbotResponse(textToSend, biomarkers, language)
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: botResponse.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSafetyWarning: botResponse.isSafetyWarning,
      }
      setChatMessages((prev) => [...prev, botMsg])
      setIsBotTyping(false)
    }, 750)
  }

  const getStatusChipLabel = (status: string) => {
    if (language === 'ta') {
      if (status === 'Within Reference Range') return 'இயல்பு வரம்பிற்குள்'
      if (status === 'Higher than Laboratory Range') return 'ஆய்வக வரம்பை விட அதிகம்'
      if (status === 'Lower than Laboratory Range') return 'ஆய்வக வரம்பை விடக் குறைவு'
      return 'வரம்பு குறிப்பிடப்படவில்லை'
    }
    return status
  }

  return (
    <div className="explain-modal-backdrop" onClick={onClose}>
      <div className="explain-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <header className="explain-modal-header">
          <div className="header-left">
            <span className="sparkle-icon">✨</span>
            <div>
              <div className="header-badge-row">
                <span className="phase-pill-p4">{language === 'ta' ? 'அறிக்கை விளக்கம்' : 'AI Explanation'}</span>
                <span className="mode-pill">{language === 'ta' ? 'கல்வி வழிகாட்டி' : 'Educational Mode'}</span>
                <span className="demo-engine-pill">{language === 'ta' ? 'தமிழ் ஆதரவு' : 'Tamil Enabled'}</span>
              </div>
              <h2 className="explain-modal-title">{report.fileName}</h2>
              <div className="explain-meta-sub">
                <span>{report.reportType}</span> • <span>{report.uploadDate}</span> •{' '}
                <span>{report.patientName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close Explanation"
          >
            ✕
          </button>
        </header>

        {/* Phase 4 Tab Navigation */}
        <nav className="explain-tabs-nav" aria-label="Explanation workflow tabs">
          <button
            type="button"
            className={`explain-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('review')}
          >
            <span className="tab-step-num">1</span>
            <span>{language === 'ta' ? 'அளவுகளை சரிபார்க்கவும்' : 'Review & Verify Biomarkers'}</span>
          </button>

          <button
            type="button"
            className={`explain-tab-btn ${activeTab === 'explanations' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('explanations')}
          >
            <span className="tab-step-num">2</span>
            <span>{language === 'ta' ? 'எளிய மருத்துவ விளக்கம்' : 'Patient-Friendly Explanations'}</span>
          </button>

          <button
            type="button"
            className={`explain-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('chat')}
          >
            <span className="tab-step-num">3</span>
            <span>{language === 'ta' ? 'மருத்துவ உதவியாளரிடம் கேட்கவும்' : 'Ask AI Assistant (Q&A)'}</span>
          </button>
        </nav>

        {/* Modal Body */}
        <div className="explain-modal-body">
          {/* TAB 1: REVIEW & VERIFY BIOMARKERS */}
          {activeTab === 'review' && (
            <div className="step-review-container">
              {isExtracting ? (
                <div className="loading-state-card">
                  <div className="spinner-large" />
                  <h4>{language === 'ta' ? 'ஆவண உரையைப் பிரித்தெடுக்கிறது...' : 'Extracting Clinical Document Stream...'}</h4>
                  <p>{language === 'ta' ? 'பரிசோதனை பெயர்கள் மற்றும் வரம்புகள் படிக்கப்படுகின்றன.' : 'Parsing text elements, test identifiers, and laboratory reference ranges.'}</p>
                </div>
              ) : (
                <>
                  {isScannedImage ? (
                    <div className="ocr-notice-banner" role="status">
                      <span className="banner-icon">ℹ️</span>
                      <div>
                        <strong>{language === 'ta' ? 'ஸ்கேன் செய்யப்பட்ட படம் கண்டறியப்பட்டது:' : 'Scanned Image / Photographic Document Detected:'}</strong>
                        <p>
                          {language === 'ta'
                            ? 'பட OCR செயலாக்கம் உருவாக்கத்தில் உள்ளது. கீழேயுள்ள அட்டவணையில் அச்சிடப்பட்ட பரிசோதனை அளவுகளை நீங்கள் சரிபார்த்து உறுதிப்படுத்தலாம்.'
                            : 'Image OCR processing is currently in development. You can review, correct, or add your printed test results in the verification form below before generating explanations.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pdf-success-banner" role="status">
                      <span className="banner-icon">📄</span>
                      <div className="banner-text-content">
                        <strong>{language === 'ta' ? 'PDF உரை படிக்கப்பட்டது:' : 'PDF Readable Text Extracted:'}</strong>
                        <p>
                          {language === 'ta'
                            ? 'ஆவண அளவுகள் சரிபார்ப்பிற்காக எடுக்கப்பட்டுள்ளன. உங்கள் அறிக்கையுடன் சரிபார்க்கவும்.'
                            : 'Document parameters and lab references were extracted for verification. Please confirm or edit the values printed on your original report.'}
                        </p>
                        {extractedRawText && (
                          <details className="raw-stream-details">
                            <summary>{language === 'ta' ? 'பிரித்தெடுக்கப்பட்ட மூல உரையைக் காட்டு' : 'View raw extracted document text stream'}</summary>
                            <pre className="raw-stream-pre">{extractedRawText}</pre>
                          </details>
                        )}
                      </div>
                    </div>
                  )}

                  {extractionError && (
                    <div className="error-alert-banner">
                      <span>⚠️</span>
                      <p>{extractionError}</p>
                    </div>
                  )}

                  {/* Verification Instructions */}
                  <div className="review-instruction-box">
                    <div className="instruction-header">
                      <h3>{language === 'ta' ? 'பரிசோதனை அளவுகள் & ஆய்வக வரம்புகள்' : 'Extracted Test Parameters & Laboratory Ranges'}</h3>
                      <p>
                        {language === 'ta'
                          ? 'உங்கள் அசல் அறிக்கையில் உள்ள எண்களுடன் இவற்றை உறுதிப்படுத்தவும். வரம்பு தெரியவில்லை என்றால் "Not Specified" என வைக்கவும்.'
                          : 'Always confirm values against your official physical or electronic report. Missing reference ranges should remain marked as Not Specified.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline add-param-btn"
                      onClick={handleAddBiomarker}
                    >
                      {language === 'ta' ? '+ புதிய அளவு சேர்' : '+ Add Custom Parameter'}
                    </button>
                  </div>

                  {/* Biomarkers Table */}
                  <div className="biomarkers-edit-table-wrap">
                    <table className="biomarkers-edit-table">
                      <thead>
                        <tr>
                          <th>{language === 'ta' ? 'பரிசோதனை பெயர்' : 'Test / Biomarker Name'}</th>
                          <th>{language === 'ta' ? 'அளவு (Result)' : 'Result Value'}</th>
                          <th>{language === 'ta' ? 'அலகு (Unit)' : 'Unit'}</th>
                          <th>{language === 'ta' ? 'ஆய்வக வரம்பு' : 'Printed Laboratory Range'}</th>
                          <th>{language === 'ta' ? 'மதிப்பீடு' : 'Range Evaluation'}</th>
                          <th>{language === 'ta' ? 'செயல்' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {biomarkers.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <input
                                type="text"
                                className="table-input"
                                value={language === 'ta' && b.testNameTa ? b.testNameTa : b.testName}
                                onChange={(e) =>
                                  handleUpdateBiomarker(b.id, 'testName', e.target.value)
                                }
                                placeholder="Test Name"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-input"
                                value={b.resultValue}
                                onChange={(e) =>
                                  handleUpdateBiomarker(b.id, 'resultValue', e.target.value)
                                }
                                placeholder="e.g. 92"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-input"
                                value={b.unit}
                                onChange={(e) =>
                                  handleUpdateBiomarker(b.id, 'unit', e.target.value)
                                }
                                placeholder="e.g. mg/dL"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-input"
                                value={b.referenceRange}
                                onChange={(e) =>
                                  handleUpdateBiomarker(b.id, 'referenceRange', e.target.value)
                                }
                                placeholder="e.g. 70 - 99 mg/dL"
                              />
                            </td>
                            <td>
                              <span
                                className={`range-status-chip ${
                                  b.comparisonStatus === 'Within Reference Range'
                                    ? 'chip-within'
                                    : b.comparisonStatus === 'Higher than Laboratory Range'
                                    ? 'chip-high'
                                    : b.comparisonStatus === 'Lower than Laboratory Range'
                                    ? 'chip-low'
                                    : 'chip-unknown'
                                }`}
                              >
                                {getStatusChipLabel(b.comparisonStatus)}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="table-delete-btn"
                                onClick={() => handleRemoveBiomarker(b.id)}
                                title="Remove parameter"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Review Action Footer */}
                  <div className="review-action-footer">
                    <div className="footer-disclaimer">
                      <span>🔒 {language === 'ta' ? 'நோயாளி சரிபார்ப்பு பாதுகாப்பு:' : 'Patient Review Protected:'}</span>
                      <small> {language === 'ta' ? 'அனுமதிக்கப்பட்ட அளவுகள் மட்டுமே எளிய மொழியில் விளக்கப்படும்.' : 'Values will be explained strictly based on verified inputs without diagnostic speculation.'}</small>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary generate-btn"
                      disabled={biomarkers.length === 0 || isGeneratingExplanations}
                      onClick={handleGenerateExplanations}
                    >
                      {isGeneratingExplanations ? (
                        <>
                          <span className="spinner" />
                          <span>{language === 'ta' ? 'விளக்கம் தயாராகிறது...' : 'Preparing Plain-English Explanations...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{language === 'ta' ? 'உறுதி செய்து எளிய விளக்கம் பெறவும்' : 'Confirm & Generate Patient Explanations'}</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PATIENT-FRIENDLY EXPLANATIONS */}
          {activeTab === 'explanations' && (
            <div className="step-explanations-container">
              {/* Mandatory Medical Safety Disclaimer */}
              <div className="safety-disclaimer-card" role="alert">
                <div className="disclaimer-title-row">
                  <span className="warning-icon">🛡️</span>
                  <h4>{t('safetyNoticeTitle', language)}</h4>
                </div>
                <ul className="disclaimer-list">
                  <li>
                    <strong>{language === 'ta' ? 'மருத்துவ நோயறிதல் அல்ல:' : 'No Medical Diagnosis or Prescription:'}</strong> {t('safetyNoticePoint1', language)}
                  </li>
                  <li>
                    <strong>{language === 'ta' ? 'பலகாரணித் தன்மை:' : 'Multi-Factor Nature of Results:'}</strong> {t('safetyNoticePoint2', language)}
                  </li>
                  <li>
                    <strong>{language === 'ta' ? 'ஆய்வக வரம்புகள்:' : 'Laboratory Range Specificity:'}</strong> {t('safetyNoticePoint3', language)}
                  </li>
                  <li>
                    <strong>{language === 'ta' ? 'மருத்துவ ஆலோசனை:' : 'Physician Consultation:'}</strong> {t('safetyNoticePoint4', language)}
                  </li>
                </ul>
              </div>

              {/* Explanations Header Summary */}
              <div className="explanations-header-summary">
                <div>
                  <h3>{t('simpleExplanationHeader', language)}</h3>
                  <p>
                    {language === 'ta'
                      ? `உங்கள் ${report.reportType} அறிக்கையில் உள்ள ${biomarkers.length} பரிசோதனைகளுக்கான எளிய விளக்கம்:`
                      : `Showing accessible translations for ${biomarkers.length} verified biomarkers from your ${report.reportType}.`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab('review')}
                >
                  ✏️ {language === 'ta' ? 'அளவுகளை மாற்று' : 'Edit Verified Values'}
                </button>
              </div>

              {/* Explanations List */}
              <div className="explanations-grid">
                {biomarkers.map((b) => (
                  <article key={b.id} className="explanation-card">
                    <div className="card-top-bar">
                      <div>
                        <h4 className="biomarker-title">
                          {language === 'ta' && b.testNameTa ? b.testNameTa : b.testName}
                        </h4>
                        <div className="biomarker-result-callout">
                          <span className="result-num">
                            {b.resultValue ? `${b.resultValue} ${b.unit}` : 'Result Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="card-status-col">
                        <span
                          className={`range-status-chip ${
                            b.comparisonStatus === 'Within Reference Range'
                              ? 'chip-within'
                              : b.comparisonStatus === 'Higher than Laboratory Range'
                              ? 'chip-high'
                              : b.comparisonStatus === 'Lower than Laboratory Range'
                              ? 'chip-low'
                              : 'chip-unknown'
                          }`}
                        >
                          {getStatusChipLabel(b.comparisonStatus)}
                        </span>
                        <span className="lab-range-label">
                          {language === 'ta' ? 'அச்சிடப்பட்ட வரம்பு: ' : 'Printed Range: '}
                          <strong>{b.referenceRange || 'Not Specified'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Patient-Friendly One-Sentence Summary (Part 2 Requirement) */}
                    <div className="friendly-summary-box">
                      <span className="summary-icon">💬</span>
                      <p className="friendly-summary-text">
                        {formatPatientFriendlyResultSentence(b, language)}
                      </p>
                    </div>

                    <div className="card-section">
                      <span className="section-label">{t('whatThisMeasures', language)}</span>
                      <p className="section-text">
                        {language === 'ta' && b.plainExplanationTa ? b.plainExplanationTa : b.plainExplanation}
                      </p>
                    </div>

                    <div className="card-section caveat-section">
                      <span className="section-label">{t('contextOnVariations', language)}</span>
                      <p className="section-text">
                        {language === 'ta' && b.possibleCausesNoteTa ? b.possibleCausesNoteTa : b.possibleCausesNote}
                      </p>
                    </div>

                    <div className="card-footer-tip">
                      <small>
                        💡 <em>{t('doctorDiscussionTip', language)}</em>
                      </small>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer CTA to Chat */}
              <div className="explanations-bottom-cta">
                <p>
                  {language === 'ta'
                    ? 'மருத்துவச் சொற்கள் அல்லது மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள் உள்ளதா?'
                    : 'Have questions about medical terminology or what to ask your doctor?'}
                </p>
                {onOpenCompare && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onOpenCompare(report)}
                    style={{ marginRight: '0.75rem' }}
                  >
                    ⚖️ {language === 'ta' ? 'அறிக்கைகளை ஒப்பிடுங்கள்' : 'Compare with Earlier Report'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSwitchTab('chat')}
                >
                  💬 {language === 'ta' ? 'மருத்துவ உதவியாளரிடம் கேளுங்கள் →' : 'Open MediLens Care Chatbot →'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL ASSISTANT CHATBOT */}
          {activeTab === 'chat' && (
            <div className="step-chat-container">
              {/* Chat Header Bar */}
              <div className="chat-context-bar">
                <div className="bot-avatar-badge">🤖</div>
                <div className="bot-info-meta">
                  <strong>
                    {language === 'ta'
                      ? 'மெடிலென்ஸ் AI உதவியாளர் (கல்விப் புரிதல் பயன்முறை)'
                      : 'MediLens AI Health Assistant (Educational Simulation)'}
                  </strong>
                  <span>
                    {language === 'ta'
                      ? 'எளிய தமிழ் விளக்கம் • நோயாளி பாதுகாப்பு விதிகளுடன்'
                      : 'Trained on plain terminology • Guardrailed for patient safety'}
                  </span>
                </div>
                <div className="disclaimer-mini-chip">
                  {language === 'ta' ? 'மருந்துகள் அல்ல' : 'No Diagnosis or Prescription'}
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="suggested-prompts-tray">
                <span className="tray-label">{language === 'ta' ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்:' : 'Suggested Inquiries:'}</span>
                {language === 'ta' ? (
                  <>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('வெறும் வயிற்று சர்க்கரை என்றால் என்ன?')}
                    >
                      சர்க்கரை அளவு என்றால் என்ன?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('ஆய்வக வரம்புகள் ஏன் மாறுபடுகின்றன?')}
                    >
                      வரம்புகள் ஏன் மாறுபடுகின்றன?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('எனது அறிக்கை இயல்பானதா?')}
                    >
                      அறிக்கை இயல்பானதா?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('மருத்துவரிடம் என்ன கேட்க வேண்டும்?')}
                    >
                      மருத்துவரிடம் கேட்க வேண்டியவை
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('மருத்துவ அலகுகளை விளக்குங்கள் (mg/dL)')}
                    >
                      மருத்துவ அலகுகள்
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('What does Fasting Blood Glucose mean?')}
                    >
                      What is Fasting Glucose?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('Why do laboratory reference ranges differ between labs?')}
                    >
                      Why do lab ranges differ?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('Is my overall report normal?')}
                    >
                      Is my report normal?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('What questions should I ask Dr. Lin about this report?')}
                    >
                      Questions for my doctor
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendChat('What does mg/dL and eGFR stand for?')}
                    >
                      Explain medical units
                    </button>
                  </>
                )}
              </div>

              {/* Messages Stream */}
              <div className="chat-messages-stream">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}
                  >
                    {msg.sender === 'assistant' && <div className="chat-avatar">🩺</div>}
                    <div
                      className={`chat-bubble ${
                        msg.sender === 'user'
                          ? 'bubble-user'
                          : msg.isSafetyWarning
                          ? 'bubble-warning'
                          : 'bubble-bot'
                      }`}
                    >
                      <div className="bubble-text">
                        {msg.text.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                      <div className="bubble-footer-bar">
                        <span className="bubble-time">{msg.timestamp}</span>
                        {msg.sender === 'assistant' && isSpeechSynthSupported && (
                          <button
                            type="button"
                            className={`speech-speak-btn ${speakingMessageId === msg.id ? 'is-speaking' : ''}`}
                            onClick={() => handleSpeakResponse(msg.id, msg.text)}
                            title={
                              speakingMessageId === msg.id
                                ? t('stopAudioBtn', language)
                                : t('listenAnswerBtn', language)
                            }
                            aria-label={
                              speakingMessageId === msg.id
                                ? t('stopAudioBtn', language)
                                : t('listenAnswerBtn', language)
                            }
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <span className="audio-wave-anim" aria-hidden="true">
                                  <span className="wave-bar" />
                                  <span className="wave-bar" />
                                  <span className="wave-bar" />
                                </span>
                                <span>{t('stopAudioBtn', language)}</span>
                              </>
                            ) : (
                              <>
                                <span className="audio-icon" aria-hidden="true">🔊</span>
                                <span>{language === 'ta' ? 'கேட்க' : 'Listen'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isBotTyping && (
                  <div className="chat-bubble-row row-bot">
                    <div className="chat-avatar">🩺</div>
                    <div className="chat-bubble bubble-bot typing-indicator">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Voice recognition status banner (visible listening, processing, hint, error states) */}
              {(isListening || voiceProcessing || voiceError || voiceHint) && (
                <div
                  className={`voice-status-bar ${
                    voiceError
                      ? 'error'
                      : isListening
                      ? 'listening'
                      : voiceProcessing
                      ? 'processing'
                      : 'hint'
                  }`}
                  role="status"
                >
                  <div className="status-live-indicator">
                    {isListening && (
                      <span className="live-meter-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="pulse-dot" />
                        {/* Real-time audio waveform response */}
                        <span className="audio-wave-bars" aria-hidden="true" style={{ display: 'inline-flex', gap: '3px', alignItems: 'flex-end', height: '16px' }}>
                          <span style={{ width: '3px', height: `${Math.max(4, Math.min(16, (audioLevel * 0.16) + 4))}px`, background: '#ef4444', borderRadius: '1.5px', transition: 'height 0.08s ease' }} />
                          <span style={{ width: '3px', height: `${Math.max(5, Math.min(16, (audioLevel * 0.22) + 6))}px`, background: '#ef4444', borderRadius: '1.5px', transition: 'height 0.08s ease' }} />
                          <span style={{ width: '3px', height: `${Math.max(4, Math.min(16, (audioLevel * 0.14) + 4))}px`, background: '#ef4444', borderRadius: '1.5px', transition: 'height 0.08s ease' }} />
                        </span>
                      </span>
                    )}
                    {voiceError && <span className="voice-status-icon">⚠️</span>}
                    {!isListening && !voiceError && voiceHint && (
                      <span className="voice-status-icon">💡</span>
                    )}
                    <span className="voice-status-text">
                      {voiceError ||
                        voiceHint ||
                        (isListening
                          ? language === 'ta'
                            ? 'குரலைக் கேட்கிறது... பேசுங்கள்'
                            : 'Listening... speak now'
                          : '')}
                    </span>

                    {/* Instant Voice Language Switcher */}
                    <button
                      type="button"
                      className="btn-voice-lang-toggle"
                      onClick={handleToggleVoiceLang}
                      title="Click to switch speech language"
                      style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f766e',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🗣️ {voiceLang === 'ta-IN' ? 'தமிழ் (ta-IN)' : 'English (en-IN)'} ⇄
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isListening && (
                      <button
                        type="button"
                        className="btn-stop-listening"
                        onClick={handleStopListening}
                        title={t('voiceInputStop', language)}
                      >
                        ✕ {language === 'ta' ? 'முடிந்தது' : 'Done'}
                      </button>
                    )}
                    {(voiceError || voiceHint) && !isListening && (
                      <button
                        type="button"
                        className="btn-dismiss-hint"
                        onClick={() => {
                          setVoiceError(null)
                          setVoiceHint(null)
                        }}
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                className="chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendChat()
                }}
              >
                {/* Microphone Button */}
                <button
                  type="button"
                  className={`chat-mic-btn ${isListening ? 'listening-active' : ''}`}
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={!isSpeechRecSupported || isBotTyping}
                  title={
                    !isSpeechRecSupported
                      ? t('voiceNotSupported', language)
                      : isListening
                      ? t('voiceInputStop', language)
                      : t('voiceInputStart', language)
                  }
                  aria-label={
                    !isSpeechRecSupported
                      ? t('voiceNotSupported', language)
                      : isListening
                      ? t('voiceInputStop', language)
                      : t('voiceInputStart', language)
                  }
                >
                  <span className="mic-icon" aria-hidden="true">
                    {isListening ? '⏹️' : '🎤'}
                  </span>
                </button>

                <input
                  type="text"
                  className="chat-text-input"
                  placeholder={
                    isListening
                      ? (language === 'ta' ? 'பேசுங்கள்... கேட்கிறது...' : 'Listening... Speak now...')
                      : (language === 'ta'
                          ? 'பரிசோதனை முடிவுகள் அல்லது மருத்துவச் சொற்கள் குறித்து கேட்கவும்...'
                          : 'Ask a question about your test results, terminology, or reference ranges...')
                  }
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value)
                    if (voiceHint) setVoiceHint(null)
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isBotTyping}
                  className="chat-send-btn"
                >
                  {language === 'ta' ? 'அனுப்பு ➔' : 'Send ➔'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="explain-modal-footer">
          <div className="modal-footer-compliance">
            <span>🛡️ {language === 'ta' ? 'பாதுகாப்பான மாதிரி சூழல்' : 'HIPAA-Safe Demo Environment'}</span>
            <span>•</span>
            <span>{language === 'ta' ? 'எளிய கல்வி விளக்கம்' : 'Simulated Educational Reasoning'}</span>
            <span>•</span>
            <span>{language === 'ta' ? 'மருத்துவரிடம் கலந்தாலோசிக்கவும்' : 'Always consult your healthcare provider'}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            {language === 'ta' ? 'பக்கத்தை மூடு' : 'Close Workspace'}
          </button>
        </footer>
      </div>
    </div>
  )
}
