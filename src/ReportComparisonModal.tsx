import { useState, useMemo } from 'react'
import type {
  ComparisonBiomarkerMatch,
  Language,
  MedicalReport,
  BiomarkerRecord,
  UnmatchedBiomarkerItem,
} from './types'
import {
  generateInitialBiomarkersForReport,
  evaluateReferenceRange,
  BIOMARKER_DICTIONARY,
} from './reportExplainer'
import { t } from './i18n'
import './ReportComparisonModal.css'

interface ReportComparisonModalProps {
  reports: MedicalReport[]
  initialReport1?: MedicalReport
  initialReport2?: MedicalReport
  language?: Language
  onClose: () => void
}

type ComparisonViewTab = 'comparison' | 'edit_earlier' | 'edit_later'

export default function ReportComparisonModal({
  reports,
  initialReport1,
  initialReport2,
  language = 'en',
  onClose,
}: ReportComparisonModalProps) {
  // Available reports to select
  const [selectedReport1Id, setSelectedReport1Id] = useState<string>(
    initialReport1 ? initialReport1.id : reports[0]?.id || ''
  )
  const [selectedReport2Id, setSelectedReport2Id] = useState<string>(() => {
    if (initialReport2) return initialReport2.id
    if (reports.length > 1) {
      const other = reports.find((r) => r.id !== (initialReport1?.id || reports[0]?.id))
      return other ? other.id : reports[1]?.id || ''
    }
    return ''
  })

  // Active view tab: comparison or review/edit values
  const [activeTab, setActiveTab] = useState<ComparisonViewTab>('comparison')

  // Cache/store editable extracted biomarkers per report ID so user edits are preserved
  const [editableBiomarkersMap, setEditableBiomarkersMap] = useState<Record<string, BiomarkerRecord[]>>(() => {
    const initialMap: Record<string, BiomarkerRecord[]> = {}
    reports.forEach((rep) => {
      initialMap[rep.id] = generateInitialBiomarkersForReport(rep, rep.rawText || '')
    })
    return initialMap
  })

  // Get report objects
  const rawReport1 = reports.find((r) => r.id === selectedReport1Id)
  const rawReport2 = reports.find((r) => r.id === selectedReport2Id)

  // Determine chronological ordering: Earlier (Baseline) vs Later (Follow-Up)
  const { earlierReport, laterReport, isChronologicalReversed } = useMemo(() => {
    if (!rawReport1 || !rawReport2 || rawReport1.id === rawReport2.id) {
      return { earlierReport: rawReport1, laterReport: rawReport2, isChronologicalReversed: false }
    }
    const date1 = new Date(rawReport1.uploadDate).getTime()
    const date2 = new Date(rawReport2.uploadDate).getTime()

    if (!isNaN(date1) && !isNaN(date2) && date1 > date2) {
      return { earlierReport: rawReport2, laterReport: rawReport1, isChronologicalReversed: true }
    }
    return { earlierReport: rawReport1, laterReport: rawReport2, isChronologicalReversed: false }
  }, [rawReport1, rawReport2])

  // Biomarkers for earlier and later reports memoized from state
  const earlierBiomarkers = useMemo(() => {
    if (!earlierReport) return []
    return (
      editableBiomarkersMap[earlierReport.id] ??
      generateInitialBiomarkersForReport(earlierReport, earlierReport.rawText || '')
    )
  }, [earlierReport, editableBiomarkersMap])

  const laterBiomarkers = useMemo(() => {
    if (!laterReport) return []
    return (
      editableBiomarkersMap[laterReport.id] ??
      generateInitialBiomarkersForReport(laterReport, laterReport.rawText || '')
    )
  }, [laterReport, editableBiomarkersMap])

  // Handle Biomarker edits for earlier or later report
  const handleUpdateBiomarkerField = (
    reportId: string,
    bioId: string,
    field: keyof BiomarkerRecord,
    value: string
  ) => {
    setEditableBiomarkersMap((prev) => {
      const list = prev[reportId] || []
      const updated = list.map((item) => {
        if (item.id === bioId) {
          const next = { ...item, [field]: value }
          // Re-evaluate reference range if resultValue or referenceRange changed
          if (field === 'resultValue' || field === 'referenceRange') {
            next.comparisonStatus = evaluateReferenceRange(next.resultValue, next.referenceRange)
          }
          return next
        }
        return item
      })
      return { ...prev, [reportId]: updated }
    })
  }

  const handleAddBiomarker = (reportId: string) => {
    const newBio: BiomarkerRecord = {
      id: `custom_${Date.now()}`,
      testName: language === 'ta' ? 'புதிய பரிசோதனை' : 'New Clinical Test',
      testNameTa: 'புதிய பரிசோதனை',
      resultValue: '100',
      unit: 'mg/dL',
      referenceRange: '70 - 110 mg/dL',
      comparisonStatus: 'Within Reference Range',
      plainExplanation: 'Custom patient-added diagnostic parameter.',
      plainExplanationTa: 'நோயாளி சரிபார்த்த தனிப்பயன் பரிசோதனை அளவு.',
      possibleCausesNote: 'Review specific laboratory intervals with your healthcare provider.',
      possibleCausesNoteTa: 'ஆய்வக வரம்புகள் மற்றும் காரணங்களை மருத்துவரிடம் விவாதிக்கவும்.',
    }
    setEditableBiomarkersMap((prev) => ({
      ...prev,
      [reportId]: [...(prev[reportId] || []), newBio],
    }))
  }

  const handleRemoveBiomarker = (reportId: string, bioId: string) => {
    setEditableBiomarkersMap((prev) => ({
      ...prev,
      [reportId]: (prev[reportId] || []).filter((b) => b.id !== bioId),
    }))
  }

  // Swap selected reports
  const handleSwapReports = () => {
    const temp = selectedReport1Id
    setSelectedReport1Id(selectedReport2Id)
    setSelectedReport2Id(temp)
  }

  // Compute matched biomarkers and unmatched biomarkers
  const { matches, unmatchedItems, incompatibleCount } = useMemo(() => {
    if (!earlierReport || !laterReport || earlierReport.id === laterReport.id) {
      return { matches: [], unmatchedItems: [], incompatibleCount: 0 }
    }

    const matchedList: ComparisonBiomarkerMatch[] = []
    const unmatchedList: UnmatchedBiomarkerItem[] = []
    let incompCount = 0

    const matchedLaterIds = new Set<string>()

    earlierBiomarkers.forEach((bEarly) => {
      // Find matching equivalent biomarker in later report by normalized name
      const bLate = laterBiomarkers.find((item) => {
        const norm1 = item.testName.trim().toLowerCase()
        const norm2 = bEarly.testName.trim().toLowerCase()
        return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)
      })

      if (bLate) {
        matchedLaterIds.add(bLate.id)

        // Check unit compatibility (normalized whitespace & case)
        const u1 = (bEarly.unit || '').trim().toLowerCase()
        const u2 = (bLate.unit || '').trim().toLowerCase()
        const isUnitsCompatible = u1 === u2 || (!u1 && !u2)

        const valEarly = parseFloat(bEarly.resultValue)
        const valLate = parseFloat(bLate.resultValue)

        let direction: 'Increased' | 'Decreased' | 'Unchanged' | 'Inconclusive' = 'Unchanged'
        let numDelta: number | null = null
        let pctDelta: string | null = null
        let summaryEn = ''
        let summaryTa = ''
        let incompReasonEn = ''
        let incompReasonTa = ''

        if (!isUnitsCompatible) {
          direction = 'Inconclusive'
          incompCount++
          incompReasonEn = `Units differ (${bEarly.unit || 'none'} vs ${bLate.unit || 'none'}). Cannot be numerically compared without standardized laboratory conversion.`
          incompReasonTa = `அளவீட்டு அலகுகள் பொருந்தவில்லை (${bEarly.unit || 'இல்லை'} vs ${bLate.unit || 'இல்லை'}). ஆய்வக அலகு மாற்றம் இல்லாமல் எண் மாற்றத்தை நேரடியாக கணக்கிட முடியாது.`
          summaryEn = incompReasonEn
          summaryTa = incompReasonTa
        } else if (!isNaN(valEarly) && !isNaN(valLate)) {
          numDelta = parseFloat((valLate - valEarly).toFixed(2))
          if (Math.abs(valEarly) > 0.0001) {
            pctDelta = `${((numDelta / Math.abs(valEarly)) * 100).toFixed(1)}%`
          }

          if (numDelta > 0.0001) {
            direction = 'Increased'
            const sign = `+${numDelta.toFixed(1)}`
            summaryEn = `Shifted from ${bEarly.resultValue} to ${bLate.resultValue} ${bEarly.unit} (${sign} ${bEarly.unit}${pctDelta ? `, ${pctDelta}` : ''}). An increase does not always mean your health worsened or improved; natural fluctuations occur with hydration and diet. Consult Dr. Lin.`
            summaryTa = `${bEarly.resultValue}-லிருந்து ${bLate.resultValue} ${bEarly.unit} ஆக (${sign} ${bEarly.unit}${pctDelta ? `, ${pctDelta}` : ''}) அதிகரித்துள்ளது. ஓர் அளவு அதிகரிப்பது என்பது ஆரோக்கியம் மேம்பட்டதாகவோ அல்லது மோசமடைந்ததாகவோ எப்போதும் பொருள்படாது; உடல் நீர்ச்சத்து மற்றும் உணவுக்கேற்ப ஆய்வக அளவுகள் மாறுபடும்.`
          } else if (numDelta < -0.0001) {
            direction = 'Decreased'
            const sign = `${numDelta.toFixed(1)}`
            summaryEn = `Shifted from ${bEarly.resultValue} to ${bLate.resultValue} ${bEarly.unit} (${sign} ${bEarly.unit}${pctDelta ? `, ${pctDelta}` : ''}). A decrease does not always mean your health worsened or improved; laboratory values naturally vary over time. Review trends with your doctor.`
            summaryTa = `${bEarly.resultValue}-லிருந்து ${bLate.resultValue} ${bEarly.unit} ஆக (${sign} ${bEarly.unit}${pctDelta ? `, ${pctDelta}` : ''}) குறைந்துள்ளது. ஓர் அளவு குறைவது என்பது ஆரோக்கியம் மேம்பட்டதாகவோ அல்லது மோசமடைந்ததாகவோ எப்போதும் பொருள்படாது; காலப்போக்கில் ஆய்வக அளவுகள் இயல்பாக மாறுபடலாம்.`
          } else {
            direction = 'Unchanged'
            summaryEn = `Value remained consistent at ${bEarly.resultValue} ${bEarly.unit} across both testing dates. Laboratory readings remained stable.`
            summaryTa = `இரண்டு பரிசோதனை தேதிகளிலும் மதிப்பு ${bEarly.resultValue} ${bEarly.unit} என சீராக உள்ளது. ஆய்வக அளவுகளில் எவ்வித மாற்றமும் இல்லை.`
          }
        } else {
          direction = 'Unchanged'
          summaryEn = `Qualitative result remained consistent: "${bEarly.resultValue}" on ${earlierReport.uploadDate} vs "${bLate.resultValue}" on ${laterReport.uploadDate}.`
          summaryTa = `விளக்க முடிவு சீராக உள்ளது: "${bEarly.resultValue}" (${earlierReport.uploadDate}) மற்றும் "${bLate.resultValue}" (${laterReport.uploadDate}).`
        }

        matchedList.push({
          testName: bEarly.testName,
          testNameTa: bEarly.testNameTa,
          unit: bEarly.unit || bLate.unit,
          report1Date: earlierReport.uploadDate,
          report1Value: bEarly.resultValue,
          report1Status: bEarly.comparisonStatus,
          report2Date: laterReport.uploadDate,
          report2Value: bLate.resultValue,
          report2Status: bLate.comparisonStatus,
          referenceRange: bEarly.referenceRange || bLate.referenceRange || 'Laboratory Specified',
          changeDirection: direction,
          numericalChange: numDelta,
          percentageChange: pctDelta,
          changeSummary: summaryEn,
          changeSummaryTa: summaryTa,
          isCompatible: isUnitsCompatible,
          incompatibilityReason: incompReasonEn,
          incompatibilityReasonTa: incompReasonTa,
        })
      } else {
        // Unmatched from earlier report
        unmatchedList.push({
          id: `unmatch_early_${bEarly.id}`,
          testName: bEarly.testName,
          testNameTa: bEarly.testNameTa,
          reportFileName: earlierReport.fileName,
          reportDate: earlierReport.uploadDate,
          resultValue: bEarly.resultValue,
          unit: bEarly.unit,
          referenceRange: bEarly.referenceRange,
          comparisonStatus: bEarly.comparisonStatus,
          reason: `Measured only in the baseline report on ${earlierReport.uploadDate}. This test was not performed in the follow-up panel on ${laterReport.uploadDate}. Missing parameters are not assumed.`,
          reasonTa: `முந்தைய அறிக்கையில் மட்டுமே (${earlierReport.uploadDate}) அளவிடப்பட்டது. பிந்தைய அறிக்கையில் (${laterReport.uploadDate}) இந்த சோதனை சேர்க்கப்படவில்லை. விடுபட்ட அளவுகள் ஊகிக்கப்படுவதில்லை.`,
        })
      }
    })

    // Check later report for tests that were not present in earlier report
    laterBiomarkers.forEach((bLate) => {
      if (!matchedLaterIds.has(bLate.id)) {
        unmatchedList.push({
          id: `unmatch_late_${bLate.id}`,
          testName: bLate.testName,
          testNameTa: bLate.testNameTa,
          reportFileName: laterReport.fileName,
          reportDate: laterReport.uploadDate,
          resultValue: bLate.resultValue,
          unit: bLate.unit,
          referenceRange: bLate.referenceRange,
          comparisonStatus: bLate.comparisonStatus,
          reason: `Newly introduced in the follow-up panel on ${laterReport.uploadDate}. Was not evaluated in the baseline report on ${earlierReport.uploadDate}. Missing parameters are not assumed.`,
          reasonTa: `சமீபத்திய அறிக்கையில் (${laterReport.uploadDate}) புதிதாக சேர்க்கப்பட்டது. முந்தைய அறிக்கையில் (${earlierReport.uploadDate}) இந்த சோதனை செய்யப்படவில்லை. விடுபட்ட அளவுகள் ஊகிக்கப்படுவதில்லை.`,
        })
      }
    })

    return { matches: matchedList, unmatchedItems: unmatchedList, incompatibleCount: incompCount }
  }, [earlierReport, laterReport, earlierBiomarkers, laterBiomarkers])

  const getStatusLabel = (status: string) => {
    if (language !== 'ta') return status
    if (status.includes('Within')) return 'இயல்பு வரம்பிற்குள்'
    if (status.includes('Higher')) return 'வரம்பை விட அதிகம்'
    if (status.includes('Lower')) return 'வரம்பை விடக் குறைவு'
    return 'வரம்பு குறிப்பிடப்படவில்லை'
  }

  const getTrendBadge = (m: ComparisonBiomarkerMatch) => {
    if (!m.isCompatible) {
      return (
        <span className="shift-badge shift-incompatible">
          ⚠️ {language === 'ta' ? 'அலகு பொருந்தவில்லை' : 'Unit Mismatch'}
        </span>
      )
    }

    if (m.changeDirection === 'Increased') {
      return (
        <span className="shift-badge shift-increased">
          ▲ {language === 'ta' ? 'அதிகரிப்பு (+)' : 'Increased (+)'}
        </span>
      )
    }
    if (m.changeDirection === 'Decreased') {
      return (
        <span className="shift-badge shift-decreased">
          ▼ {language === 'ta' ? 'குறைவு (-)' : 'Decreased (-)'}
        </span>
      )
    }
    return (
      <span className="shift-badge shift-unchanged">
        — {language === 'ta' ? 'மாற்றமில்லை (=)' : 'Consistent (=)'}
      </span>
    )
  }

  return (
    <div className="comparison-backdrop" onClick={onClose}>
      <div className="comparison-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="comparison-header">
          <div className="header-badge-title">
            <div className="comp-icon-box">⚖️</div>
            <div>
              <div className="comp-pill-row">
                <span className="pill-comp">
                  {language === 'ta' ? 'மருத்துவ ஒப்பீட்டு முறை' : 'Clinical Comparison Mode'}
                </span>
                <span className="pill-honest">
                  {language === 'ta' ? 'பொருந்தும் அளவுகள் மட்டுமே' : 'Verified Parameters Only'}
                </span>
                {incompatibleCount > 0 && (
                  <span className="pill-warning">
                    ⚠️ {incompatibleCount} {language === 'ta' ? 'பொருந்தாத அலகுகள்' : 'Incompatible Units'}
                  </span>
                )}
              </div>
              <h2 className="comp-title">{t('compareModalTitle', language)}</h2>
              <p className="comp-sub">{t('compareModalSub', language)}</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close comparison">
            ✕
          </button>
        </header>

        {/* View Switcher Navigation Tabs */}
        <nav className="comparison-tabs-nav" aria-label="Comparison workflow modes">
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <span>📊 {t('tabCompareView', language)}</span>
            {matches.length > 0 && <span className="tab-count-badge">{matches.length}</span>}
          </button>

          {earlierReport && (
            <button
              type="button"
              className={`comp-tab-btn ${activeTab === 'edit_earlier' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit_earlier')}
            >
              <span>✏️ {t('tabEditBaseline', language)}</span>
              <span className="tab-date-sub">({earlierReport.uploadDate.split(' ')[0]})</span>
            </button>
          )}

          {laterReport && (
            <button
              type="button"
              className={`comp-tab-btn ${activeTab === 'edit_later' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit_later')}
            >
              <span>✏️ {t('tabEditFollowup', language)}</span>
              <span className="tab-date-sub">({laterReport.uploadDate.split(' ')[0]})</span>
            </button>
          )}
        </nav>

        <div className="comparison-body">
          {/* Selectors Panel (Always available) */}
          <div className="report-selectors-panel">
            <div className="selector-group">
              <label htmlFor="select-rep1">
                {isChronologicalReversed
                  ? `📅 ${t('followUpReportLabel', language)}`
                  : `📅 ${t('baselineReportLabel', language)}`}
                :
              </label>
              <select
                id="select-rep1"
                className="comp-select"
                value={selectedReport1Id}
                onChange={(e) => setSelectedReport1Id(e.target.value)}
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fileName} ({r.reportType} • {r.uploadDate})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="swap-reports-btn"
              onClick={handleSwapReports}
              title={language === 'ta' ? 'அறிக்கைகளை மாற்றவும்' : 'Swap Reports'}
              aria-label="Swap reports"
            >
              ⇄
            </button>

            <div className="selector-group">
              <label htmlFor="select-rep2">
                {isChronologicalReversed
                  ? `📅 ${t('baselineReportLabel', language)}`
                  : `📅 ${t('followUpReportLabel', language)}`}
                :
              </label>
              <select
                id="select-rep2"
                className="comp-select"
                value={selectedReport2Id}
                onChange={(e) => setSelectedReport2Id(e.target.value)}
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.id === selectedReport1Id}>
                    {r.fileName} ({r.reportType} • {r.uploadDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Context & Non-Diagnostic Reassurance Banner */}
          <div className="honest-comparison-banner" role="alert">
            <span className="banner-icon">🛡️</span>
            <div>
              <strong>
                {language === 'ta'
                  ? 'மருத்துவ சூழல் & உறுதியற்ற வழிகாட்டல் (நோய் கண்டறிதல் அல்ல):'
                  : 'Clinical Context & Non-Diagnostic Guidance:'}
              </strong>
              <p>
                {language === 'ta'
                  ? 'பரிசோதனை முடிவுகளில் ஏற்படும் எண் மாற்றம் எப்போதும் உங்கள் உடல்நலம் மேம்பட்டதாகவோ அல்லது மோசமடைந்ததாகவோ பொருள்படாது. உடல் நீர்ச்சத்து, உணவு முறை, மற்றும் ஆய்வக உபகரணங்களின் தனித்துவத்தால் அளவுகள் இயல்பாக மாறுபடலாம். மெடிலென்ஸ் AI எந்தவொரு நோயையும் உறுதிப்படுத்தாது; அனைத்து மாற்றங்களையும் உங்கள் முதன்மை மருத்துவரிடம் கலந்தாலோசிக்கவும்.'
                  : 'A numerical increase or decrease does not always mean your health improved or worsened. Laboratory values naturally vary due to hydration, fasting time, testing equipment calibration, and daily biological rhythms. MediLens AI does not diagnose conditions. Please review all historical trends with your physician.'}
              </p>
            </div>
          </div>

          {/* MAIN TAB 1: CLINICAL COMPARISON VIEW */}
          {activeTab === 'comparison' && (
            <>
              {selectedReport1Id === selectedReport2Id ? (
                <div className="comparison-empty-state">
                  <span className="empty-emoji">📑</span>
                  <h4>{t('selectDifferentReportsError', language)}</h4>
                  <p>
                    {language === 'ta'
                      ? 'வரலாற்று மாற்றங்களைக் காண, உங்கள் பட்டியலிலிருந்து இரண்டு வெவ்வேறு தேதிகளின் அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.'
                      : 'To evaluate historical shifts over time, select two distinct diagnostic reports from your history.'}
                  </p>
                </div>
              ) : matches.length === 0 && unmatchedItems.length === 0 ? (
                <div className="comparison-empty-state">
                  <span className="empty-emoji">🔍</span>
                  <h4>{language === 'ta' ? 'பொருந்தக்கூடிய பரிசோதனைகள் இல்லை' : 'No Matching Test Biomarkers Found'}</h4>
                  <p>{t('noMatchingBiomarkersNotice', language)}</p>
                </div>
              ) : (
                <div className="comparison-results-wrap">
                  {/* Summary Bar */}
                  <div className="results-meta-bar">
                    <div className="meta-counts-group">
                      <span className="stat-pill">
                        <strong>{matches.length}</strong> {language === 'ta' ? 'பொருந்திய சோதனைகள்' : 'Matched Tests'}
                      </span>
                      {unmatchedItems.length > 0 && (
                        <span className="stat-pill stat-unmatched">
                          <strong>{unmatchedItems.length}</strong>{' '}
                          {language === 'ta' ? 'தனிப்பட்ட சோதனைகள்' : 'Unmatched Tests'}
                        </span>
                      )}
                      {incompatibleCount > 0 && (
                        <span className="stat-pill stat-warn">
                          <strong>{incompatibleCount}</strong>{' '}
                          {language === 'ta' ? 'பொருந்தாத அலகுகள்' : 'Incompatible Units'}
                        </span>
                      )}
                    </div>
                    <div className="dates-timeline-chip">
                      <span>📌 {earlierReport?.uploadDate}</span>
                      <span className="arrow-sep">➔</span>
                      <span>⏱️ {laterReport?.uploadDate}</span>
                    </div>
                  </div>

                  {/* Primary Comparison Table */}
                  {matches.length > 0 && (
                    <div className="comparison-table-wrapper">
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>{t('biomarkerCol', language)}</th>
                            <th>{t('unitsCol', language)}</th>
                            <th>
                              <div className="th-date-title">
                                <span>{t('previousDateCol', language)}</span>
                                <small>({earlierReport?.uploadDate.split(' ')[0]})</small>
                              </div>
                            </th>
                            <th>
                              <div className="th-date-title">
                                <span>{t('currentDateCol', language)}</span>
                                <small>({laterReport?.uploadDate.split(' ')[0]})</small>
                              </div>
                            </th>
                            <th>{t('numericalChangeCol', language)}</th>
                            <th>{t('refRangeCol', language)}</th>
                            <th>{t('clinicalExplanationCol', language)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((m) => {
                            const dictMatch = BIOMARKER_DICTIONARY[m.testName]
                            const displayName =
                              language === 'ta' && (m.testNameTa || dictMatch?.nameTa)
                                ? m.testNameTa || dictMatch?.nameTa
                                : m.testName

                            return (
                              <tr key={m.testName}>
                                <td className="test-name-cell">
                                  <strong>{displayName}</strong>
                                  {language === 'ta' && m.testName !== displayName && (
                                    <span className="orig-en-name">{m.testName}</span>
                                  )}
                                </td>
                                <td>
                                  <span className="unit-badge">{m.unit || '—'}</span>
                                </td>
                                <td>
                                  <div className="val-cell">
                                    <span className="val-text">
                                      {m.report1Value} <small>{m.unit}</small>
                                    </span>
                                    <span
                                      className={`status-pill status-${m.report1Status.toLowerCase().replace(/[\s/]/g, '-')}`}
                                    >
                                      {getStatusLabel(m.report1Status)}
                                    </span>
                                    <span className="cell-date-sub">{m.report1Date}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="val-cell">
                                    <span className="val-text">
                                      {m.report2Value} <small>{m.unit}</small>
                                    </span>
                                    <span
                                      className={`status-pill status-${m.report2Status.toLowerCase().replace(/[\s/]/g, '-')}`}
                                    >
                                      {getStatusLabel(m.report2Status)}
                                    </span>
                                    <span className="cell-date-sub">{m.report2Date}</span>
                                  </div>
                                </td>
                                <td className="change-cell">
                                  {getTrendBadge(m)}
                                  {m.isCompatible && typeof m.numericalChange === 'number' && (
                                    <div className="numeric-change-text">
                                      <strong>
                                        {m.numericalChange > 0 ? `+${m.numericalChange.toFixed(1)}` : m.numericalChange.toFixed(1)}{' '}
                                        {m.unit}
                                      </strong>
                                      {m.percentageChange && (
                                        <span className="pct-sub">({m.percentageChange})</span>
                                      )}
                                    </div>
                                  )}
                                  {m.isCompatible && m.numericalChange == null && (
                                    <span className="numeric-change-na">
                                      {language === 'ta' ? 'எண் சார்பற்றது' : 'Qualitative'}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <span className="ref-range-chip">{m.referenceRange}</span>
                                </td>
                                <td className="explanation-cell">
                                  <p className="shift-summary-text">
                                    {language === 'ta' && m.changeSummaryTa ? m.changeSummaryTa : m.changeSummary}
                                  </p>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Unmatched Tests Section */}
                  {unmatchedItems.length > 0 && (
                    <section className="unmatched-tests-section">
                      <div className="unmatched-header">
                        <span className="unmatched-icon">ℹ️</span>
                        <div>
                          <h4>{t('unmatchedTestsTitle', language)}</h4>
                          <p>{t('unmatchedTestsDesc', language)}</p>
                        </div>
                      </div>
                      <div className="unmatched-grid">
                        {unmatchedItems.map((u) => {
                          const dictMatch = BIOMARKER_DICTIONARY[u.testName]
                          const displayName =
                            language === 'ta' && (u.testNameTa || dictMatch?.nameTa)
                              ? u.testNameTa || dictMatch?.nameTa
                              : u.testName

                          return (
                            <div key={u.id} className="unmatched-card">
                              <div className="unmatched-card-top">
                                <strong>{displayName}</strong>
                                <span className="unmatched-source-tag">
                                  📅 {u.reportDate.split(' ')[0]}
                                </span>
                              </div>
                              <div className="unmatched-card-meta">
                                <span>
                                  {language === 'ta' ? 'முடிவு:' : 'Result:'} <strong>{u.resultValue} {u.unit}</strong>
                                </span>
                                <span>
                                  {language === 'ta' ? 'வரம்பு:' : 'Range:'} {u.referenceRange}
                                </span>
                              </div>
                              <p className="unmatched-reason-text">
                                {language === 'ta' ? u.reasonTa : u.reason}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* MAIN TAB 2: REVIEW / EDIT EARLIER REPORT BIOMARKERS */}
          {activeTab === 'edit_earlier' && earlierReport && (
            <div className="edit-biomarkers-view">
              <div className="edit-view-intro">
                <div>
                  <h4>
                    {language === 'ta'
                      ? `முந்தைய அறிக்கையின் அளவுகளை சரிபார்க்கவும் (${earlierReport.fileName})`
                      : `Review & Correct Extracted Values for Baseline Report (${earlierReport.fileName})`}
                  </h4>
                  <p>{t('editValuesPrompt', language)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddBiomarker(earlierReport.id)}
                >
                  {t('addTestBtn', language)}
                </button>
              </div>

              <div className="edit-table-wrapper">
                <table className="edit-biomarkers-table">
                  <thead>
                    <tr>
                      <th>{t('biomarkerCol', language)}</th>
                      <th>{language === 'ta' ? 'அளவு (Value)' : 'Result Value'}</th>
                      <th>{t('unitsCol', language)}</th>
                      <th>{t('refRangeCol', language)}</th>
                      <th>{language === 'ta' ? 'வரம்பு நிலை' : 'Range Status'}</th>
                      <th>{language === 'ta' ? 'செயல்' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earlierBiomarkers.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <input
                            type="text"
                            className="edit-input test-name-input"
                            value={b.testName}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(earlierReport.id, b.id, 'testName', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input val-input"
                            value={b.resultValue}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(earlierReport.id, b.id, 'resultValue', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input unit-input"
                            value={b.unit}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(earlierReport.id, b.id, 'unit', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input range-input"
                            value={b.referenceRange}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(earlierReport.id, b.id, 'referenceRange', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${b.comparisonStatus.toLowerCase().replace(/[\s/]/g, '-')}`}
                          >
                            {getStatusLabel(b.comparisonStatus)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleRemoveBiomarker(earlierReport.id, b.id)}
                            title="Remove test"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="edit-footer-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('comparison')}
                >
                  {t('saveAndCompareBtn', language)}
                </button>
              </div>
            </div>
          )}

          {/* MAIN TAB 3: REVIEW / EDIT LATER REPORT BIOMARKERS */}
          {activeTab === 'edit_later' && laterReport && (
            <div className="edit-biomarkers-view">
              <div className="edit-view-intro">
                <div>
                  <h4>
                    {language === 'ta'
                      ? `பிந்தைய அறிக்கையின் அளவுகளை சரிபார்க்கவும் (${laterReport.fileName})`
                      : `Review & Correct Extracted Values for Follow-Up Report (${laterReport.fileName})`}
                  </h4>
                  <p>{t('editValuesPrompt', language)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddBiomarker(laterReport.id)}
                >
                  {t('addTestBtn', language)}
                </button>
              </div>

              <div className="edit-table-wrapper">
                <table className="edit-biomarkers-table">
                  <thead>
                    <tr>
                      <th>{t('biomarkerCol', language)}</th>
                      <th>{language === 'ta' ? 'அளவு (Value)' : 'Result Value'}</th>
                      <th>{t('unitsCol', language)}</th>
                      <th>{t('refRangeCol', language)}</th>
                      <th>{language === 'ta' ? 'வரம்பு நிலை' : 'Range Status'}</th>
                      <th>{language === 'ta' ? 'செயல்' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laterBiomarkers.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <input
                            type="text"
                            className="edit-input test-name-input"
                            value={b.testName}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(laterReport.id, b.id, 'testName', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input val-input"
                            value={b.resultValue}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(laterReport.id, b.id, 'resultValue', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input unit-input"
                            value={b.unit}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(laterReport.id, b.id, 'unit', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input range-input"
                            value={b.referenceRange}
                            onChange={(e) =>
                              handleUpdateBiomarkerField(laterReport.id, b.id, 'referenceRange', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${b.comparisonStatus.toLowerCase().replace(/[\s/]/g, '-')}`}
                          >
                            {getStatusLabel(b.comparisonStatus)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleRemoveBiomarker(laterReport.id, b.id)}
                            title="Remove test"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="edit-footer-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('comparison')}
                >
                  {t('saveAndCompareBtn', language)}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="comparison-footer">
          <small>
            {language === 'ta'
              ? 'மெடிலென்ஸ் AI அறிக்கை ஒப்பீடு • ஆய்வக அச்சிடப்பட்ட இயல்பு வரம்புகளின் அடிப்படையில் மட்டுமே ஒப்பிடப்படுகிறது. நோய் கண்டறிதல் அல்ல.'
              : 'MediLens AI Clinical Comparison • Evaluated strictly against printed laboratory reference intervals without diagnostic claims.'}
          </small>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            {t('close', language)}
          </button>
        </footer>
      </div>
    </div>
  )
}
