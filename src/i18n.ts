import type { Language } from './types'

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    brandName: 'MediLens AI',
    brandTagline: 'Healthcare Intelligence Platform',
    clinicalPortal: 'Clinical Portal',
    patientView: 'Patient View',
    doctorView: 'Doctor View',
    signOut: 'Sign Out',
    langSelector: 'Language',
    english: 'English',
    tamil: 'தமிழ்',

    // Notice banner
    demoBanner:
      'MediLens Care System Active: Patient Booking, Physician Accept/Reject, Report Comparison, and Report Explanations synchronized. (Data is sandboxed in local demo storage).',

    // Common Buttons & Actions
    preview: 'Preview',
    explainReport: 'Explain Report',
    compareReports: 'Compare Reports',
    scheduleConsultation: '+ Schedule New Consultation',
    accept: 'Accept',
    decline: 'Decline / Suggest Alternative',
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    remove: 'Remove',
    upload: 'Upload Medical Report',
    submitting: 'Submitting...',
    uploading: 'Uploading Document...',
    saving: 'Saving...',
    loading: 'Loading...',

    // Patient Dashboard
    patientPortalTitle: 'Patient Health Portal',
    patientPortalDesc:
      'Manage medical documents, compare historical lab panels, explain complex diagnostic results, and schedule consultations with your care team.',
    patientIdLabel: 'Patient ID:',
    totalDocsLabel: 'Total Documents:',
    consultationsLabel: 'Consultations:',
    assignedClinicLabel: 'Assigned Clinic:',
    assignedClinicVal: 'MediLens Cardiology & Internal Med',

    // Patient Tabs
    tabReportsHistory: '📁 Medical Reports & History',
    tabConsultations: '📅 Consultations & Appointments',
    tabHealthProfile: '🩺 Health Profile Overview',

    // Upload Section
    uploadSectionTitle: 'Upload Medical Report',
    uploadSectionSub:
      'Upload official lab tests, imaging studies, or doctor summaries. Supported formats: PDF, JPG, PNG (Max 10MB).',
    dragPrompt: 'Drag and drop your medical report here',
    dragOrClick: 'or click to browse your local device files',
    maxFileSize: 'Max 10 MB',
    readyToTransmit: 'Ready to transmit',
    reportCategoryLabel: 'Report Category *',
    clinicalNotesLabel: 'Clinical Notes / Reason for Visit',
    clinicalNotesPlaceholder: 'e.g. Annual routine checkup, requested by Dr. Lin',
    privacyAssurance:
      'Clinical privacy assurance: Report will be routed only to authorized medical personnel.',
    fileUploadSuccess: 'Document was uploaded successfully and queued for clinical review.',
    fileUploadErrorEmpty: 'Please select a medical report file to upload.',
    fileUploadSizeError: 'File size exceeds 10MB limit. Please compress your report or choose a smaller file.',
    fileUploadTypeError: 'Unsupported file format. Please choose a PDF, JPG, or PNG document.',

    // Categories
    catBloodTest: 'Blood Test',
    catMriCt: 'MRI / CT Scan',
    catXRay: 'X-Ray',
    catPathology: 'Pathology',
    catPrescription: 'Prescription',
    catCardiology: 'Cardiology / ECG',
    catGeneralCheckup: 'General Checkup',

    // History Section
    historyTitle: 'Medical Report History',
    historySub:
      'Review your diagnostic reports, explain biomarkers, and compare test results across dates.',
    searchPlaceholder: 'Search filename, test type, or ID...',
    allCategories: 'All Categories',
    noReportsFound: 'No Medical Reports Found',
    noReportsDesc:
      'You have not uploaded any medical reports yet. Use the upload tool above to submit your first diagnostic file.',
    resetFilters: 'Reset Filters',
    fileSizeLabel: 'File Size',
    uploadDateLabel: 'Upload Date',
    ownerLabel: 'Owner',
    consentLabel: 'Consent',
    authorizedTag: '✓ Authorized',
    privateTag: 'Private',
    actionsLabel: 'Actions',
    showingReportsCount: 'Showing reports',

    // Statuses
    statusVerified: 'Verified',
    statusPendingReview: 'Pending Review',
    statusArchived: 'Archived',
    statusAccepted: 'Accepted',
    statusPending: 'Pending Review',
    statusRejected: 'Declined',

    // Consultations Tab (Patient)
    consultationsTabTitle: 'Physician Consultations & Appointments',
    consultationsTabSub:
      'Track the status of your clinic appointments, view doctor responses, and schedule follow-ups.',
    noConsultationsYet: 'No Consultations Scheduled',
    noConsultationsDesc:
      'Schedule your first consultation with a specialist using the button above.',
    reqConsultationDate: 'Requested Consultation Date:',
    reasonForConsultation: 'Reason for Consultation:',
    doctorResponseTitle: 'Doctor Response & Clinical Notes:',
    altSlotRecommended: 'Physician Suggested Alternative Slot:',
    acceptAltSlotBtn: 'Accept This Slot & Confirm',
    authorizedDocsLabel: 'Authorized Diagnostic Files:',
    appointmentConfirmedNotice: 'Appointment Confirmed by Dr. Sarah Lin',
    appointmentDeclinedNotice: 'Appointment Declined / Alternative Suggested',
    pendingReviewNotice: 'Awaiting Physician Schedule Review',

    // Profile Tab
    profileTitle: 'Patient Profile Information',
    profileSub: 'Personal and clinical profile data.',
    legalName: 'Full Legal Name',
    dob: 'Date of Birth',
    primaryDoctor: 'Primary Physician',
    bloodGroup: 'Blood Group',
    knownAllergies: 'Known Allergies',
    emergencyContact: 'Emergency Contact',
    profileTip:
      'To schedule clinical appointments or review responses, switch to the Consultations & Appointments tab.',

    // Doctor Dashboard
    doctorPortalTitle: 'Clinical Physician Dashboard',
    doctorPortalDesc:
      'Welcome back, Dr. Lin. Review incoming consultation requests, manage confirmed patient appointments, and inspect authorized diagnostic reports.',
    pendingRequestsCard: 'Pending Requests',
    confirmedAptsCard: 'Confirmed Appointments',
    totalDiagnosticFiles: 'Total Diagnostic Files',

    // Doctor Tabs
    docTabIncoming: '📥 Incoming Consultation Requests',
    docTabConfirmed: '🗓️ Confirmed Appointments',
    docTabSubmissions: '📋 Patient Diagnostic Submissions',

    // Doctor Incoming Requests
    incomingRequestsTitle: 'Incoming Consultation Requests',
    incomingRequestsSub:
      'Review patient visit reasons and authorized records. Accept or decline with clinical notes and alternative times.',
    noPendingRequests: 'No Pending Requests',
    noPendingRequestsDesc: 'All incoming consultation requests have been addressed.',
    requestedSchedule: 'Requested Schedule:',
    relevantVitals: 'Relevant Vitals:',
    authorizedRecordsCount: 'Patient-Authorized Medical Records',
    doctorDecisionReq: 'Physician Decision Required',
    reviewRequestBtn: 'Review Request & Respond',

    // Doctor Confirmed Tab
    confirmedAptsTitle: 'Confirmed & Upcoming Consultations',
    confirmedAptsSub: 'Appointments confirmed on your clinic schedule.',
    noConfirmedApts: 'No Confirmed Consultations',
    noConfirmedAptsDesc: 'When requests are accepted, they will be listed here.',
    confirmedSchedule: 'Confirmed Schedule:',
    yourInstructions: 'Your Confirmation Instructions:',

    // Doctor Submissions Tab
    consentProtectedMode: 'Consent Protected Mode',
    submissionsSub:
      'All medical documents. Note: Doctor viewing is strictly restricted to documents with patient authorization.',
    accessConsentCol: 'Access Consent',
    actionCol: 'Action',
    openReportBtn: 'Open Report',
    restrictedBadge: '🔒 Restricted',

    // Access Denied Dialog
    accessRestrictedTitle: 'Clinical Access Restricted',
    patientConsentPolicy: 'Patient Consent Policy Enforced',
    patientConsentNotGranted: 'Patient Consent Not Granted',
    accessDeniedExplanation:
      'has not authorized physician viewing access for this document. In compliance with patient privacy policies, clinical providers may only inspect files explicitly permitted by the patient.',
    returnToDashboard: 'Return to Dashboard',
    privacyComplianceRule:
      'In compliance with MediLens patient privacy rules, clinical providers can only open medical documents that patients have explicitly authorized for clinical consultation.',

    // Login Page
    loginStoryTitle: 'Healing begins with kindness & gentle care.',
    loginStoryDesc:
      'Every patient journey deserves empathy, reassurance, and listening. MediLens connects you with your trusted medical providers, diagnostic records, and personalized care in a secure, comforting digital home.',
    loginComfortQuote:
      'Wherever the art of medicine is loved, there is also a genuine love for humanity.',
    loginQuoteAuthor: '— Hippocratic Philosophy of Patient Care',
    loginPillWarm: 'Warm, Patient-Centered Care',
    loginPillHipaa: 'HIPAA-Compliant & Safe',
    loginPillVerified: 'Verified Diagnostic Records',
    loginStoryFooter: 'Trusted by over 40,000+ patients and leading clinical care teams.',
    signInTitle: 'Sign In to Your Portal',
    signInSub: 'Select your account type to access your secure health portal.',
    patientPortalTab: 'Patient Portal',
    physicianPortalTab: 'Physician Portal',
    personalRecordsNote: 'Personal health records',
    clinicalReviewNote: 'Clinical diagnostic review',
    emailLabel: 'Email Address / Clinical ID',
    passwordLabel: 'Password',
    rememberMeLabel: 'Remember this device',
    forgotPasswordLink: 'Forgot password?',
    signInSubmitBtn: 'Sign In',
    quickDemoHeading: 'Quick Demo Access:',
    quickPatientBtn: 'Sign in as Alex Morgan (Patient)',
    quickDoctorBtn: 'Sign in as Dr. Sarah Lin (Doctor)',
    quickDemoNote:
      'Demo Mode: Click buttons above to log in instantly without passwords. Data is saved locally in your browser.',
    compassionateBadge: 'Compassionate Healthcare',

    // Appointment Booking Modal
    scheduleModalTitle: 'Schedule Clinical Consultation',
    scheduleModalSub: 'Book an in-person or video consultation and authorize diagnostic reports.',
    selectPhysicianLabel: 'Select Physician & Specialty *',
    preferredDateLabel: 'Preferred Consultation Date *',
    preferredTimeLabel: 'Preferred Time Window *',
    reasonForVisitField: 'Reason for Visit / Primary Symptoms *',
    reasonForVisitPlaceholder: 'e.g. Follow-up on blood panel and mild fatigue, discuss medication...',
    authorizeReportsHeader: 'Authorize Diagnostic Reports for Doctor Review',
    authorizeReportsHelp:
      'Checked documents will be unlocked for the doctor during consultation. Unchecked documents remain private.',
    noReportsToAuthorize: 'No uploaded reports available to authorize.',
    confirmBookingSubmit: 'Confirm Consultation Request',
    bookingFormErrorDate: 'Please select a valid consultation date.',
    bookingFormErrorReason: 'Please provide a clinical reason or primary symptoms for your visit.',

    // Doctor Review Modal
    reviewModalTitle: 'Review Consultation Request',
    reviewModalSub: 'Evaluate patient visit reason, review authorized records, and provide clear scheduling directions.',
    patientInfoCol: 'Patient Details',
    reasonForVisitCol: 'Reason for Visit',
    acceptTabBtn: '✓ Accept Consultation',
    declineTabBtn: '✕ Decline / Suggest Alternative Slot',
    acceptNotesLabel: 'Confirmation Notes & Preparation Instructions for Patient',
    acceptNotesPlaceholder: 'e.g. Please bring current supplements and fast for 8 hours prior...',
    declineReasonSelectLabel: 'Decline Reason *',
    customReasonField: 'Custom Clinical Reason *',
    customReasonPlaceholder: 'Specify detailed reason for patient...',
    suggestAlternativeToggle: 'Suggest Alternative Consultation Date & Time to Patient',
    alternativeDateLabel: 'Suggested Date',
    alternativeTimeLabel: 'Suggested Time',
    confirmDoctorDecisionBtn: 'Confirm Clinical Decision',
    specifyDeclineReasonError: 'Please specify a rejection reason or explanation for the patient.',

    // Report Comparison Modal
    compareModalTitle: 'Compare Diagnostic Reports',
    compareModalSub:
      'Compare biomarkers side-by-side between two testing dates to track clinical changes over time.',
    baselineReportLabel: 'Baseline Report (Earlier Date)',
    followUpReportLabel: 'Follow-Up Report (Recent Date)',
    selectDifferentReportsError: 'Please choose two different reports to perform a comparative analysis.',
    matchedBiomarkersHeader: 'Matched Diagnostic Biomarkers Across Both Reports',
    biomarkerCol: 'Biomarker / Test',
    baselineValueCol: 'Baseline Result',
    followUpValueCol: 'Follow-Up Result',
    changeTrendCol: 'Observed Change & Context',
    trendHigher: 'Higher (+)',
    trendLower: 'Lower (-)',
    trendConsistent: 'Consistent (=)',
    noMatchingBiomarkersNotice:
      'No overlapping test parameters were detected between these two reports (e.g. comparing a blood panel to an X-Ray). Choose two reports of the same category for biomarker trending.',
    comparisonNotice:
      'Clinical Context: Laboratory variations can occur due to testing equipment calibrations, hydration, time of day, and dietary factors. Trends should always be reviewed with your doctor.',
    tabCompareView: '1. Clinical Comparison',
    tabEditBaseline: '2. Review/Edit Earlier Report Values',
    tabEditFollowup: '3. Review/Edit Later Report Values',
    unitsCol: 'Units',
    previousDateCol: 'Previous Value & Date',
    currentDateCol: 'Current Value & Date',
    numericalChangeCol: 'Numerical Change',
    refRangeCol: 'Reference Range',
    clinicalExplanationCol: 'Plain-Language Medical Context',
    unitMismatchWarning: 'Incompatible Units',
    unmatchedTestsTitle: 'Unmatched Diagnostic Tests (Recorded in Only One Report)',
    unmatchedTestsDesc:
      'These tests were measured in one report but omitted in the other. Values and reference ranges are not assumed or fabricated.',
    editValuesPrompt: 'Review and correct extracted values, units, or laboratory ranges before comparing.',
    addTestBtn: '+ Add Test Parameter',
    saveAndCompareBtn: '✓ Save & View Comparison',
    noChangeLabel: '0.0 (No Shift)',
    recheckNotice: 'Values updated from your verified edits.',

    // Simple Medical Explanation
    simpleExplanationHeader: 'Plain-Language Medical Breakdown',
    simpleExplanationSub:
      'Clear, accessible explanations of your lab biomarkers without confusing medical jargon.',
    safetyNoticeTitle: 'Educational Guidance Notice & Clinical Boundaries',
    safetyNoticePoint1:
      'No Medical Diagnosis or Prescription: MediLens AI provides educational context only. We do not prescribe medications, recommend changing doses, or claim to diagnose conditions.',
    safetyNoticePoint2:
      'Multi-Factor Nature of Results: A single high or low biomarker can have many temporary causes (diet, hydration, stress, recent exercise, mild infection) and cannot confirm a diagnosis on its own.',
    safetyNoticePoint3:
      'Laboratory Range Specificity: Evaluations are compared solely against the printed reference intervals from this specific testing facility.',
    safetyNoticePoint4:
      'Physician Consultation: Always discuss concerning or borderline findings with your primary physician.',
    whatThisMeasures: '💡 What this test measures in simple words:',
    contextOnVariations: '🔬 What this result may indicate & possible causes:',
    doctorDiscussionTip:
      'Doctor discussion topic: Ask your physician how this biomarker aligns with your diet and health history.',
    tabReviewBiomarkers: '1. Review Extracted Data',
    tabSimpleExplanations: '2. Simple Explanations',
    tabCareChatbot: '3. Medical Care Chatbot',
    chatbotDemoNotice:
      'Demonstration Mode: The assistant provides educational guidance based on standard clinical dictionaries and report values. It will not diagnose or prescribe.',
    // Voice & Speech features
    voiceInputStart: 'Voice Input (Click to speak)',
    voiceInputStop: 'Listening... (Click to stop)',
    voiceProcessing: 'Transcribing speech...',
    voiceNotSupported: 'Speech recognition is not supported in this browser.',
    micPermissionDenied: 'Microphone permission was denied. Please allow microphone access or type your question.',
    micNoSpeech: 'No speech was detected. Please try speaking again.',
    micNetworkError: 'Network error occurred during speech recognition.',
    micReviewHint: 'Speech transcribed. Review or edit your question before sending.',
    listenAnswerBtn: 'Listen to this answer',
    stopAudioBtn: 'Stop Spoken Audio',
    ttsNotSupported: 'Text-to-speech audio is not supported in this browser.',
  },
  ta: {
    // Brand & Header
    brandName: 'மெடிலென்ஸ் AI',
    brandTagline: 'மருத்துவ நுண்ணறிவு தளம்',
    clinicalPortal: 'மருத்துவ போர்டல்',
    patientView: 'நோயாளி பார்வை',
    doctorView: 'மருத்துவர் பார்வை',
    signOut: 'வெளியேறு',
    langSelector: 'மொழி',
    english: 'English',
    tamil: 'தமிழ்',

    // Notice banner
    demoBanner:
      'மெடிலென்ஸ் பராமரிப்பு தளம் செயல்பாட்டில் உள்ளது: நோயாளி முன்பதிவு, மருத்துவர் ஏற்பு/மறுப்பு, அறிக்கை ஒப்பீடு மற்றும் எளிய மருத்துவ விளக்கங்கள் முழுமையாக இணைக்கப்பட்டுள்ளன.',

    // Common Buttons & Actions
    preview: 'பார்வையிடு',
    explainReport: 'அறிக்கையை விளக்கு',
    compareReports: 'அறிக்கைகளை ஒப்பிடு',
    scheduleConsultation: '+ புதிய மருத்துவ சந்திப்பு',
    accept: 'ஏற்றுக்கொள்',
    decline: 'மறுத்து மாற்று நேரம் பரிந்துரை',
    confirm: 'உறுதி செய்',
    cancel: 'ரத்து செய்',
    close: 'மூடு',
    remove: 'நீக்கு',
    upload: 'அறிக்கையை பதிவேற்று',
    submitting: 'பதிவாகிறது...',
    uploading: 'கோப்பு பதிவேற்றப்படுகிறது...',
    saving: 'சேமிக்கப்படுகிறது...',
    loading: 'ஏற்றப்படுகிறது...',

    // Patient Dashboard
    patientPortalTitle: 'நோயாளி உடல்நல போர்டல்',
    patientPortalDesc:
      'மருத்துவ ஆவணங்களை நிர்வகியுங்கள், முந்தைய பரிசோதனைகளை ஒப்பிடுங்கள், எளிய மொழியில் விளக்கங்களைப் பெறுங்கள், மற்றும் மருத்துவ ஆலோசனைகளை முன்பதிவு செய்யுங்கள்.',
    patientIdLabel: 'நோயாளி எண்:',
    totalDocsLabel: 'மொத்த ஆவணங்கள்:',
    consultationsLabel: 'சந்திப்புகள்:',
    assignedClinicLabel: 'ஒதுக்கப்பட்ட மருத்துவமனை:',
    assignedClinicVal: 'மெடிலென்ஸ் இதய மற்றும் பொது மருத்துவ மையம்',

    // Patient Tabs
    tabReportsHistory: '📁 மருத்துவ அறிக்கைகள் & வரலாறு',
    tabConsultations: '📅 மருத்துவர் சந்திப்புகள்',
    tabHealthProfile: '🩺 உடல்நல விவரக் குறிப்பு',

    // Upload Section
    uploadSectionTitle: 'மருத்துவ அறிக்கையை பதிவேற்றவும்',
    uploadSectionSub:
      'ஆய்வக பரிசோதனைகள், எக்ஸ்-ரே/ஸ்கேன் அல்லது மருந்து சீட்டுகளைப் பதிவேற்றவும். அனுமதிக்கப்பட்டவை: PDF, JPG, PNG (அதிகபட்சம் 10MB).',
    dragPrompt: 'உங்கள் மருத்துவ அறிக்கையை இங்கே இழுத்து விடவும்',
    dragOrClick: 'அல்லது உங்கள் சாதனத்திலிருந்து கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்',
    maxFileSize: 'அதிகபட்சம் 10 MB',
    readyToTransmit: 'அனுப்பத் தயார்',
    reportCategoryLabel: 'அறிக்கைப் பிரிவு *',
    clinicalNotesLabel: 'மருத்துவக் குறிப்பு / பரிசோதனைக்கான காரணம்',
    clinicalNotesPlaceholder: 'எ.கா: வருடாந்திர வழக்கமான பரிசோதனை, டாக்டர் லின் பரிந்துரைத்தது',
    privacyAssurance:
      'பாதுகாப்பு உறுதி: உங்கள் அறிக்கை அங்கீகரிக்கப்பட்ட மருத்துவ ஊழியர்களால் மட்டுமே பார்க்கப்படும்.',
    fileUploadSuccess: 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது, மருத்துவர் மதிப்பாய்வுக்கு அனுப்பப்பட்டுள்ளது.',
    fileUploadErrorEmpty: 'பதிவேற்ற மருத்துவ அறிக்கை கோப்பைத் தேர்ந்தெடுக்கவும்.',
    fileUploadSizeError: 'கோப்பு 10MB அளவை விடப் பெரிதாக உள்ளது. சிறிய கோப்பைத் தேர்ந்தெடுக்கவும்.',
    fileUploadTypeError: 'ஆதரிக்கப்படாத கோப்பு வடிவம். PDF, JPG, அல்லது PNG ஆவணத்தைத் தேர்ந்தெடுக்கவும்.',

    // Categories
    catBloodTest: 'இரத்தப் பரிசோதனை (Blood Test)',
    catMriCt: 'MRI / CT ஸ்கேன்',
    catXRay: 'எக்ஸ்-ரே (X-Ray)',
    catPathology: 'திசுப் பரிசோதனை (Pathology)',
    catPrescription: 'மருத்துவர் மருந்துச் சீட்டு',
    catCardiology: 'இதயப் பரிசோதனை (Cardiology / ECG)',
    catGeneralCheckup: 'பொது உடல் பரிசோதனை',

    // History Section
    historyTitle: 'மருத்துவ அறிக்கை வரலாறு',
    historySub:
      'உங்கள் முந்தைய பரிசோதனை முடிவுகளைப் பார்வையிடவும், எளிய விளக்கம் பெறவும், வெவ்வேறு தேதிகளின் முடிவுகளை ஒப்பிடவும்.',
    searchPlaceholder: 'கோப்பு பெயர், பரிசோதனை வகை அல்லது எண் மூலம் தேடவும்...',
    allCategories: 'அனைத்துப் பிரிவுகளும்',
    noReportsFound: 'மருத்துவ அறிக்கைகள் எதுவும் இல்லை',
    noReportsDesc:
      'நீங்கள் இதுவரை எந்த மருத்துவ அறிக்கையையும் பதிவேற்றவில்லை. உங்கள் முதல் ஆவணத்தைப் பதிவேற்ற மேலே உள்ள படிவத்தைப் பயன்படுத்தவும்.',
    resetFilters: 'வடிகட்டிகளை மீட்டமை',
    fileSizeLabel: 'கோப்பு அளவு',
    uploadDateLabel: 'பதிவேற்றிய தேதி',
    ownerLabel: 'உரிமையாளர்',
    consentLabel: 'அனுமதி',
    authorizedTag: '✓ அனுமதிக்கப்பட்டது',
    privateTag: 'தனிப்பட்டது',
    actionsLabel: 'செயல்கள்',
    showingReportsCount: 'காட்டப்படும் அறிக்கைகள்',

    // Statuses
    statusVerified: 'சரிபார்க்கப்பட்டது',
    statusPendingReview: 'மதிப்பாய்வில் உள்ளது',
    statusArchived: 'காப்பகப்படுத்தப்பட்டது',
    statusAccepted: 'ஏற்றுக்கொள்ளப்பட்டது',
    statusPending: 'பரிசீலனையில் உள்ளது',
    statusRejected: 'நிராகரிக்கப்பட்டது',

    // Consultations Tab (Patient)
    consultationsTabTitle: 'மருத்துவர் ஆலோசனைகள் & சந்திப்புகள்',
    consultationsTabSub:
      'உங்கள் சந்திப்பு கோரிக்கைகளின் நிலையை அறியவும், மருத்துவரின் பதில்களைக் காணவும், மாற்று நேரங்களை உறுதி செய்யவும்.',
    noConsultationsYet: 'சந்திப்புகள் எதுவும் பதிவு செய்யப்படவில்லை',
    noConsultationsDesc:
      'மேலே உள்ள பொத்தானைப் பயன்படுத்தி மருத்துவ நிபுணருடன் உங்கள் முதல் சந்திப்பைத் திட்டமிடுங்கள்.',
    reqConsultationDate: 'கோரப்பட்ட சந்திப்பு தேதி:',
    reasonForConsultation: 'ஆலோசனைக்கான காரணம்:',
    doctorResponseTitle: 'மருத்துவரின் பதில் & மருத்துவ குறிப்பு:',
    altSlotRecommended: 'மருத்துவர் பரிந்துரைத்த மாற்று நேரம்:',
    acceptAltSlotBtn: 'இந்த நேரத்தை ஏற்று உறுதி செய்',
    authorizedDocsLabel: 'மருத்துவர் பார்க்க அனுமதிக்கப்பட்ட ஆவணங்கள்:',
    appointmentConfirmedNotice: 'டாக்டர் சாரா லின் அவர்களால் சந்திப்பு உறுதி செய்யப்பட்டது',
    appointmentDeclinedNotice: 'சந்திப்பு மறுக்கப்பட்டு மாற்று நேரம் பரிந்துரைக்கப்பட்டுள்ளது',
    pendingReviewNotice: 'மருத்துவரின் அட்டவணை மதிப்பாய்வுக்குக் காத்திருக்கிறது',

    // Profile Tab
    profileTitle: 'நோயாளி சுயவிவரத் தகவல்',
    profileSub: 'தனிப்பட்ட மற்றும் மருத்துவ விவரங்கள்.',
    legalName: 'முழுப் பெயர்',
    dob: 'பிறந்த தேதி',
    primaryDoctor: 'முதன்மை மருத்துவர்',
    bloodGroup: 'இரத்த வகை',
    knownAllergies: 'அலர்ஜி விவரங்கள்',
    emergencyContact: 'அவசர தொடர்பு',
    profileTip:
      'மருத்துவ சந்திப்புகளைத் திட்டமிட அல்லது பதில்களைக் காண, "மருத்துவர் சந்திப்புகள்" பகுதிக்குச் செல்லவும்.',

    // Doctor Dashboard
    doctorPortalTitle: 'மருத்துவர் மருத்துவ போர்டல்',
    doctorPortalDesc:
      'வணக்கம், டாக்டர் லின். புதிய நோயாளி சந்திப்பு கோரிக்கைகளை மதிப்பாய்வு செய்யவும், வரவிருக்கும் சந்திப்புகளை நிர்வகிக்கவும், நோயாளி அனுமதித்த ஆவணங்களை ஆய்வு செய்யவும்.',
    pendingRequestsCard: 'நிலுவையில் உள்ள கோரிக்கைகள்',
    confirmedAptsCard: 'உறுதிசெய்யப்பட்ட சந்திப்புகள்',
    totalDiagnosticFiles: 'மொத்த பரிசோதனை ஆவணங்கள்',

    // Doctor Tabs
    docTabIncoming: '📥 புதிய சந்திப்பு கோரிக்கைகள்',
    docTabConfirmed: '🗓️ உறுதிசெய்யப்பட்ட சந்திப்புகள்',
    docTabSubmissions: '📋 நோயாளியின் பரிசோதனை அறிக்கைகள்',

    // Doctor Incoming Requests
    incomingRequestsTitle: 'புதிய மருத்துவ ஆலோசனை கோரிக்கைகள்',
    incomingRequestsSub:
      'நோயாளியின் வருகைக்கான காரணம் மற்றும் அனுமதிக்கப்பட்ட ஆவணங்களை ஆய்வு செய்து, ஏற்கவும் அல்லது மாற்று நேரம் பரிந்துரைக்கவும்.',
    noPendingRequests: 'நிலுவையில் கோரிக்கைகள் இல்லை',
    noPendingRequestsDesc: 'அனைத்து புதிய சந்திப்பு கோரிக்கைகளும் கவனிக்கப்பட்டுவிட்டன.',
    requestedSchedule: 'கோரப்பட்ட நேரம்:',
    relevantVitals: 'முக்கிய உடல்நலக் குறிப்பு:',
    authorizedRecordsCount: 'நோயாளி அனுமதித்த ஆவணங்கள்',
    doctorDecisionReq: 'மருத்துவர் முடிவு தேவைப்படுகிறது',
    reviewRequestBtn: 'கோரிக்கையை பரிசீலித்து பதிலளிக்கவும்',

    // Doctor Confirmed Tab
    confirmedAptsTitle: 'உறுதிசெய்யப்பட்ட & வரவிருக்கும் சந்திப்புகள்',
    confirmedAptsSub: 'உங்கள் மருத்துவமனை அட்டவணையில் உறுதிசெய்யப்பட்ட சந்திப்புகள்.',
    noConfirmedApts: 'உறுதிசெய்யப்பட்ட சந்திப்புகள் இல்லை',
    noConfirmedAptsDesc: 'கோரிக்கைகள் ஏற்கப்படும்போது அவை இங்கே பட்டியலிடப்படும்.',
    confirmedSchedule: 'உறுதிசெய்யப்பட்ட நேரம்:',
    yourInstructions: 'நீங்கள் வழங்கிய வழிகாட்டுதல்:',

    // Doctor Submissions Tab
    consentProtectedMode: 'அனுமதி பாதுகாக்கப்பட்ட பயன்முறை',
    submissionsSub:
      'அனைத்து மருத்துவ ஆவணங்கள். குறிப்பு: நோயாளி அனுமதி வழங்கிய ஆவணங்களை மட்டுமே மருத்துவர் திறக்க முடியும்.',
    accessConsentCol: 'பார்வை அனுமதி',
    actionCol: 'செயல்',
    openReportBtn: 'அறிக்கையைத் திற',
    restrictedBadge: '🔒 கட்டுப்படுத்தப்பட்டது',

    // Access Denied Dialog
    accessRestrictedTitle: 'மருத்துவ பார்வை அனுமதி கட்டுப்படுத்தப்பட்டுள்ளது',
    patientConsentPolicy: 'நோயாளி தனியுரிமைக் கொள்கை அமலில் உள்ளது',
    patientConsentNotGranted: 'நோயாளி அனுமதி வழங்கவில்லை',
    accessDeniedExplanation:
      'இந்த ஆவணத்தைப் பார்க்க மருத்துவர் பார்வை அனுமதியை வழங்கவில்லை. நோயாளி தனியுரிமை விதிகளின்படி, நோயாளி வெளிப்படையாக அனுமதித்த ஆவணங்களை மட்டுமே மருத்துவ ஊழியர்கள் பார்க்க முடியும்.',
    returnToDashboard: 'முகப்புக்குத் திரும்பு',
    privacyComplianceRule:
      'மெடிலென்ஸ் நோயாளி தனியுரிமை விதிகளின்படி, நோயாளி வெளிப்படையாக அனுமதித்த ஆவணங்களை மட்டுமே மருத்துவர்கள் ஆய்வு செய்ய முடியும்.',

    // Login Page
    loginStoryTitle: 'குணப்படுத்துதல் பரிவு மற்றும் கனிவான கவனிப்பில் தொடங்குகிறது.',
    loginStoryDesc:
      'ஒவ்வொரு நோயாளியின் பயணமும் கருணை, நம்பிக்கை மற்றும் கனிவான கவனிப்பிற்கு தகுதியானது. மெடிலென்ஸ் உங்கள் நம்பகமான மருத்துவர்கள் மற்றும் பரிசோதனை அறிக்கைகளுடன் உங்களை பாதுகாப்பாக இணைக்கிறது.',
    loginComfortQuote:
      'மருத்துவக் கலை எங்கு நேசிக்கப்படுகிறதோ, அங்கு மனிதநேயமும் நேசிக்கப்படுகிறது.',
    loginQuoteAuthor: '— ஹிப்போக்ரடீஸ் மருத்துவ தத்துவம்',
    loginPillWarm: 'அன்பான நோயாளி மைய கவனிப்பு',
    loginPillHipaa: 'பாதுகாப்பானது & தனியுரிமை உறுதி',
    loginPillVerified: 'சரிபார்க்கப்பட்ட மருத்துவ ஆவணங்கள்',
    loginStoryFooter: '40,000-க்கும் மேற்பட்ட நோயாளிகள் மற்றும் முன்னணி மருத்துவர்களால் நம்பப்படுகிறது.',
    signInTitle: 'உங்கள் தளத்தில் உள்நுழையவும்',
    signInSub: 'உங்கள் பாதுகாப்பான மருத்துவ தளத்தை அணுக கணக்கு வகையைத் தேர்ந்தெடுக்கவும்.',
    patientPortalTab: 'நோயாளி தளம்',
    physicianPortalTab: 'மருத்துவர் தளம்',
    personalRecordsNote: 'தனிப்பட்ட மருத்துவ ஆவணங்கள்',
    clinicalReviewNote: 'மருத்துவ பரிசோதனை மதிப்பாய்வு',
    emailLabel: 'மின்னஞ்சல் முகவரி / மருத்துவ ஐடி',
    passwordLabel: 'கடவுச்சொல்',
    rememberMeLabel: 'இந்த சாதனத்தை நினைவில் கொள்க',
    forgotPasswordLink: 'கடவுச்சொல் மறந்துவிட்டதா?',
    signInSubmitBtn: 'உள்நுழைக',
    quickDemoHeading: 'விரைவு மாதிரி அணுகல்:',
    quickPatientBtn: 'அலெக்ஸ் மோர்கன் (நோயாளி) ஆக உள்நுழைக',
    quickDoctorBtn: 'டாக்டர் சாரா லின் (மருத்துவர்) ஆக உள்நுழைக',
    quickDemoNote:
      'மாதிரி முறை: கடவுச்சொல் இன்றி உடனடியாக உள்நுழைய மேலே உள்ள பொத்தான்களைக் கிளிக் செய்யவும். தரவு உங்கள் உலாவியில் சேமிக்கப்படுகிறது.',
    compassionateBadge: 'பரிவான மருத்துவ சேவை',

    // Appointment Booking Modal
    scheduleModalTitle: 'மருத்துவ ஆலோசனையை திட்டமிடுங்கள்',
    scheduleModalSub: 'நேரடி அல்லது காணொளி ஆலோசனையை முன்பதிவு செய்து உங்கள் அறிக்கைகளைப் பகிருங்கள்.',
    selectPhysicianLabel: 'மருத்துவர் & சிறப்புப் பிரிவைத் தேர்ந்தெடுக்கவும் *',
    preferredDateLabel: 'விருப்பமான ஆலோசனை தேதி *',
    preferredTimeLabel: 'விருப்பமான நேரம் *',
    reasonForVisitField: 'வருகைக்கான காரணம் / முக்கிய அறிகுறிகள் *',
    reasonForVisitPlaceholder: 'எ.கா: இரத்தப் பரிசோதனை முடிவுகள் ஆலோசனை, உடல் சோர்வு, மருந்து பரிசீலனை...',
    authorizeReportsHeader: 'மருத்துவர் பார்வைக்கு மருத்துவ அறிக்கைகளை அனுமதிக்கவும்',
    authorizeReportsHelp:
      'தேர்ந்தெடுக்கப்பட்ட ஆவணங்களை மட்டுமே மருத்துவர் பார்க்க முடியும். மற்ற ஆவணங்கள் தனிப்பட்டதாகவே இருக்கும்.',
    noReportsToAuthorize: 'அனுமதிக்க ஆவணங்கள் எதுவும் இல்லை.',
    confirmBookingSubmit: 'ஆலோசனை கோரிக்கையை உறுதி செய்க',
    bookingFormErrorDate: 'சரியான ஆலோசனை தேதியைத் தேர்ந்தெடுக்கவும்.',
    bookingFormErrorReason: 'உங்கள் வருகைக்கான காரணம் அல்லது அறிகுறிகளைக் குறிப்பிடவும்.',

    // Doctor Review Modal
    reviewModalTitle: 'ஆலோசனை கோரிக்கையை மதிப்பாய்வு செய்க',
    reviewModalSub: 'நோயாளி வருகைக்கான காரணத்தை ஆராய்ந்து, அனுமதிக்கப்பட்ட ஆவணங்களைப் பார்வையிட்டு முடிவெடுக்கவும்.',
    patientInfoCol: 'நோயாளி விவரங்கள்',
    reasonForVisitCol: 'வருகைக்கான காரணம்',
    acceptTabBtn: '✓ கோரிக்கையை ஏற்கவும்',
    declineTabBtn: '✕ மறுக்கவும் / மாற்று நேரம் பரிந்துரைக்கவும்',
    acceptNotesLabel: 'நோயாளிக்கான உறுதிப்படுத்தல் குறிப்புகள் மற்றும் தயாரிப்பு வழிகாட்டல்கள்',
    acceptNotesPlaceholder: 'எ.கா: முந்தைய மருந்து பட்டியலைக் கொண்டு வரவும், 8 மணி நேரம் வெறும் வயிற்றில் வரவும்...',
    declineReasonSelectLabel: 'மறுப்பதற்கான காரணம் *',
    customReasonField: 'தனிப்பயன் மருத்துவ காரணம் *',
    customReasonPlaceholder: 'நோயாளிக்கான விரிவான காரணத்தைக் குறிப்பிடவும்...',
    suggestAlternativeToggle: 'நோயாளிக்கு மாற்று தேதி மற்றும் நேரத்தை பரிந்துரைக்கவும்',
    alternativeDateLabel: 'பரிந்துரைக்கப்படும் தேதி',
    alternativeTimeLabel: 'பரிந்துரைக்கப்படும் நேரம்',
    confirmDoctorDecisionBtn: 'மருத்துவர் முடிவை உறுதி செய்க',
    specifyDeclineReasonError: 'நோயாளிக்கு மறுப்பு காரணத்தைக் குறிப்பிடவும்.',

    // Report Comparison Modal
    compareModalTitle: 'மருத்துவ அறிக்கைகளை ஒப்பிடுங்கள்',
    compareModalSub:
      'இரண்டு வெவ்வேறு தேதிகளின் பரிசோதனை முடிவுகளை ஒப்பிட்டு உடல்நல மாற்றங்களைக் கண்காணிக்கவும்.',
    baselineReportLabel: 'தொடக்க அறிக்கை (முந்தைய தேதி)',
    followUpReportLabel: 'பின்தொடர் அறிக்கை (சமீபத்திய தேதி)',
    selectDifferentReportsError: 'ஒப்பீடு செய்ய இரண்டு வெவ்வேறு அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.',
    matchedBiomarkersHeader: 'இரு அறிக்கைகளிலும் கண்டறியப்பட்ட பொதுவான பரிசோதனைகள்',
    biomarkerCol: 'பரிசோதனை பெயர்',
    baselineValueCol: 'முந்தைய முடிவு',
    followUpValueCol: 'சமீபத்திய முடிவு',
    changeTrendCol: 'கண்டறியப்பட்ட மாற்றம் & சூழல்',
    trendHigher: 'அதிகரித்துள்ளது (+)',
    trendLower: 'குறைந்துள்ளது (-)',
    trendConsistent: 'மாற்றமில்லை (=)',
    noMatchingBiomarkersNotice:
      'இந்த இரண்டு அறிக்கைகளுக்கும் இடையே பொருந்தக்கூடிய பொதுவான பரிசோதனைகள் எதுவும் கண்டறியப்படவில்லை. ஒரே வகையிலான இரண்டு அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.',
    comparisonNotice:
      'மருத்துவ சூழல்: ஆய்வக உபகரணங்கள், நீர்ச்சத்து, மற்றும் உணவுப் பழக்கவழக்கங்கள் காரணமாக முடிவுகளில் சிறிய மாற்றங்கள் ஏற்படலாம். எந்தவொரு மாற்றத்தையும் உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.',
    tabCompareView: '1. மருத்துவ ஒப்பீடு',
    tabEditBaseline: '2. முந்தைய அறிக்கை அளவுகளை திருத்தவும்',
    tabEditFollowup: '3. பிந்தைய அறிக்கை அளவுகளை திருத்தவும்',
    unitsCol: 'அளவீட்டு அலகு',
    previousDateCol: 'முந்தைய முடிவு & தேதி',
    currentDateCol: 'சமீபத்திய முடிவு & தேதி',
    numericalChangeCol: 'எண் மாற்றம்',
    refRangeCol: 'ஆய்வக இயல்பு வரம்பு',
    clinicalExplanationCol: 'எளிய மருத்துவ விளக்கம்',
    unitMismatchWarning: 'பொருந்தாத அலகுகள்',
    unmatchedTestsTitle: 'பொருந்தாத தனிப்பட்ட சோதனைகள் (ஒரு அறிக்கையில் மட்டுமே உள்ளவை)',
    unmatchedTestsDesc:
      'இந்த சோதனைகள் ஒரு அறிக்கையில் மட்டுமே செய்யப்பட்டன; மற்றதில் இல்லை. விடுபட்ட அளவுகள் சுயமாக ஊகிக்கப்படுவதில்லை.',
    editValuesPrompt: 'ஒப்பீடு செய்வதற்கு முன் பிரித்தெடுக்கப்பட்ட எண்களையும் அலகுகளையும் சரிபார்க்கவும் அல்லது திருத்தவும்.',
    addTestBtn: '+ புதிய பரிசோதனை சேர்க்க',
    saveAndCompareBtn: '✓ திருத்தங்களைச் சேமித்து ஒப்பிடவும்',
    noChangeLabel: '0.0 (மாற்றமில்லை)',
    recheckNotice: 'உங்கள் திருத்தங்களின் அடிப்படையில் முடிவுகள் புதுப்பிக்கப்பட்டன.',

    // Simple Medical Explanation
    simpleExplanationHeader: 'எளிய தமிழ் மருத்துவ விளக்கம்',
    simpleExplanationSub:
      'கடினமான மருத்துவச் சொற்கள் இன்றி, உங்கள் பரிசோதனை முடிவுகளுக்கான தெளிவான மற்றும் எளிய விளக்கம்.',
    safetyNoticeTitle: 'கல்வி வழிகாட்டல் அறிவிப்பு & மருத்துவ வரம்புகள்',
    safetyNoticePoint1:
      'நோய் கண்டறிதல் அல்லது மருந்து பரிந்துரை அல்ல: மெடிலென்ஸ் AI எளிய கல்விப் புரிதலுக்காக மட்டுமே வழங்கப்படுகிறது. நாங்கள் மருந்துகளை பரிந்துரைப்பதோ, அளவை மாற்றுவதோ, நோய்களை உறுதிப்படுத்துவதோ இல்லை.',
    safetyNoticePoint2:
      'முடிவுகளின் பலகாரணித் தன்மை: ஒரு பரிசோதனை முடிவு அதிகமாகவோ குறைவாகவோ இருப்பதற்கு உணவு, நீர்ச்சத்து, மன அழுத்தம், சமீபத்திய உடற்பயிற்சி போன்ற பல தற்காலிக காரணங்கள் இருக்கலாம்; அது தானாகவே ஒரு நோயை உறுதிப்படுத்தாது.',
    safetyNoticePoint3:
      'ஆய்வக வரம்பின் தனித்துவம்: முடிவுகள் இந்த குறிப்பிட்ட ஆய்வகத்தில் அச்சிடப்பட்ட இயல்பு வரம்புகளுடன் மட்டுமே ஒப்பிடப்படுகின்றன.',
    safetyNoticePoint4:
      'மருத்துவர் ஆலோசனை: சந்தேகம் தரும் அல்லது இயல்புக்கு மாறான எந்தவொரு முடிவையும் உங்கள் முதன்மை மருத்துவரிடம் கலந்தாலோசிக்கவும்.',
    whatThisMeasures: '💡 இந்த பரிசோதனை எதை அளவிடுகிறது (எளிய விளக்கம்):',
    contextOnVariations: '🔬 இந்த முடிவு எதைக் குறிக்கலாம் & சாத்தியமான காரணங்கள்:',
    doctorDiscussionTip:
      'மருத்துவரிடம் கேட்க வேண்டியவை: இந்த அளவு உங்கள் உணவுமுறை மற்றும் வாழ்க்கை முறையுடன் எவ்வாறு பொருந்துகிறது என்று மருத்துவரிடம் கேளுங்கள்.',
    tabReviewBiomarkers: '1. கண்டறியப்பட்ட அளவுகளை சரிபார்க்கவும்',
    tabSimpleExplanations: '2. எளிய மருத்துவ விளக்கம்',
    tabCareChatbot: '3. மருத்துவ வழிகாட்டி சாட்பாட்',
    chatbotDemoNotice:
      'மாதிரி பயன்முறை: இந்த உதவியாளர் மருத்துவ அகராதி மற்றும் அறிக்கை மதிப்புகளின் அடிப்படையில் கல்வி வழிகாட்டலை வழங்குகிறது. இது நோய் கண்டறிதல் அல்லது மருந்து பரிந்துரை செய்யாது.',
    // Voice & Speech features
    voiceInputStart: 'குரல் உள்ளீடு (பேச கிளிக் செய்யவும்)',
    voiceInputStop: 'கேட்கிறது... (நிறுத்த கிளிக் செய்யவும்)',
    voiceProcessing: 'குரல் உரையாக மாற்றப்படுகிறது...',
    voiceNotSupported: 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.',
    micPermissionDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவியில் அனுமதியை இயக்கவும் அல்லது தட்டச்சு செய்யவும்.',
    micNoSpeech: 'குரல் எதுவும் கண்டறியப்படவில்லை. மீண்டும் பேச முயற்சிக்கவும்.',
    micNetworkError: 'குரல் ஏற்பி நெட்வொர்க் பிழை.',
    micReviewHint: 'உங்கள் பேச்சு உரையாக மாற்றப்பட்டது. அனுப்புவதற்கு முன் சரிபார்க்கவும் அல்லது திருத்தவும்.',
    listenAnswerBtn: 'இந்த பதிலை குரலில் கேட்கவும்',
    stopAudioBtn: 'ஒலியை நிறுத்து',
    ttsNotSupported: 'இந்த உலாவியில் பேச்சு ஒலி ஆதரிக்கப்படவில்லை.',
  },
}

export function t(key: string, lang: Language): string {
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
    return TRANSLATIONS[lang][key]
  }
  return TRANSLATIONS.en[key] || key
}
