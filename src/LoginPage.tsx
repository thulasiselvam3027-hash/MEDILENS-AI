import { useState } from 'react'
import type { Language, UserRole, UserSession } from './types'
import { t } from './i18n'
import { supabase, isSupabaseConfigured, mapSupabaseUserToSession } from './supabaseClient'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (user: UserSession, token: string) => void
  language?: Language
  onLanguageChange?: (lang: Language) => void
}

type AuthMode = 'login' | 'register'

export default function LoginPage({
  onLogin,
  language = 'en',
  onLanguageChange,
}: LoginPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient')

  // Form Fields - start clean so user input is not accidentally overwritten
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Status & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loginDiagnostic, setLoginDiagnostic] = useState<{
    stage: string
    category: string
    accountFound?: boolean
  } | null>(null)

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    setErrorMessage(null)
    setLoginDiagnostic(null)
    setSuccessMessage(null)
    // Preserves whatever email & password the user entered; never overwrites them
  }

  const handleToggleMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setErrorMessage(null)
    setLoginDiagnostic(null)
    setSuccessMessage(null)
    if (mode === 'register') {
      setConfirmPassword('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoginDiagnostic(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setErrorMessage(
        language === 'ta'
          ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : 'Please enter a valid email address.'
      )
      return
    }

    if (!password) {
      setErrorMessage(
        language === 'ta'
          ? 'கடவுச்சொல்லை உள்ளிடவும்.'
          : 'Please enter your account password.'
      )
      return
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setErrorMessage(
          language === 'ta'
            ? 'உங்கள் முழு பெயரை உள்ளிடவும்.'
            : 'Please enter your full name.'
        )
        return
      }

      if (password.length < 8) {
        setErrorMessage(
          language === 'ta'
            ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் கொண்டதாக இருக்க வேண்டும்.'
            : 'Password must be at least 8 characters long.'
        )
        return
      }

      if (password !== confirmPassword) {
        setErrorMessage(
          language === 'ta'
            ? 'கடவுச்சொற்கள் பொருந்தவில்லை. மீண்டும் சரிபார்க்கவும்.'
            : 'Passwords do not match. Please re-enter them.'
        )
        return
      }

      setIsSubmitting(true)

      // 1. If Supabase credentials are configured in .env, use Supabase Auth
      if (isSupabaseConfigured()) {
        try {
          const assignedId =
            selectedRole === 'patient'
              ? `PT-${Math.floor(10000 + Math.random() * 90000)}`
              : `DOC-${Math.floor(10000 + Math.random() * 90000)}`

          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: name.trim(),
                role: selectedRole,
                patientId: assignedId,
              },
            },
          })

          if (error) {
            setErrorMessage(error.message)
            setIsSubmitting(false)
            return
          }

          if (data.user) {
            const user = mapSupabaseUserToSession(data.user)
            const token = data.session?.access_token || `sb_session_${data.user.id}`
            if (rememberMe) {
              localStorage.setItem('medilens_auth_token', token)
            } else {
              sessionStorage.setItem('medilens_auth_token', token)
            }

            setSuccessMessage(
              language === 'ta'
                ? 'Supabase கணக்கு உருவாக்கப்பட்டது! உள்நுழைகிறது...'
                : 'Supabase account created successfully! Logging you in...'
            )

            setTimeout(() => {
              setIsSubmitting(false)
              onLogin(user, token)
            }, 600)
            return
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Supabase signup failed.'
          setErrorMessage(msg)
          setIsSubmitting(false)
          return
        }
      }

      // 2. Fallback to Local API
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
            role: selectedRole,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMessage(data.error || 'Registration failed. Please try again.')
          setIsSubmitting(false)
          return
        }

        // Store secure token
        if (rememberMe) {
          localStorage.setItem('medilens_auth_token', data.token)
        } else {
          sessionStorage.setItem('medilens_auth_token', data.token)
        }

        setSuccessMessage(
          language === 'ta'
            ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! உள்நுழைகிறது...'
            : 'Account created successfully! Logging you in...'
        )

        setTimeout(() => {
          setIsSubmitting(false)
          onLogin(data.user, data.token)
        }, 600)
      } catch {
        setErrorMessage(
          language === 'ta'
            ? 'சர்வர் இணைப்பு பிழை. நெட்வொர்க்கைச் சரிபார்க்கவும்.'
            : 'Server connection error. Please check your network.'
        )
        setIsSubmitting(false)
      }
    } else {
      // Sign In Mode
      setIsSubmitting(true)

      // 1. If Supabase is configured, use Supabase Auth
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })

          if (error) {
            setErrorMessage(error.message)
            setLoginDiagnostic({
              stage: 'SUPABASE_AUTH',
              category: 'INVALID_CREDENTIALS',
            })
            setIsSubmitting(false)
            return
          }

          if (data.user && data.session) {
            const user = mapSupabaseUserToSession(data.user)
            const token = data.session.access_token

            if (rememberMe) {
              localStorage.setItem('medilens_auth_token', token)
            } else {
              sessionStorage.setItem('medilens_auth_token', token)
            }

            setLoginDiagnostic(null)
            setTimeout(() => {
              setIsSubmitting(false)
              onLogin(user, token)
            }, 400)
            return
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Supabase sign-in failed.'
          setErrorMessage(msg)
          setIsSubmitting(false)
          return
        }
      }

      // 2. Fallback to Local API
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            role: selectedRole,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMessage(
            data.error ||
              (language === 'ta'
                ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.'
                : 'Invalid email or password.')
          )
          if (data.diagnostic) {
            setLoginDiagnostic(data.diagnostic)
          } else {
            setLoginDiagnostic({
              stage: 'HTTP_RESPONSE',
              category: `STATUS_${res.status}`,
            })
          }
          setIsSubmitting(false)
          return
        }

        setLoginDiagnostic(null)

        // Store secure token
        if (rememberMe) {
          localStorage.setItem('medilens_auth_token', data.token)
        } else {
          sessionStorage.setItem('medilens_auth_token', data.token)
        }

        // Forward authenticated user profile; server verifies actual role
        setTimeout(() => {
          setIsSubmitting(false)
          onLogin(data.user, data.token)
        }, 400)
      } catch {
        setErrorMessage(
          language === 'ta'
            ? 'சர்வர் இணைப்பு பிழை. நெட்வொர்க்கைச் சரிபார்க்கவும்.'
            : 'Server connection error. Please check your network.'
        )
        setLoginDiagnostic({
          stage: 'NETWORK_TRANSPORT',
          category: 'FETCH_ERROR',
        })
        setIsSubmitting(false)
      }
    }
  }

  // Helper buttons for testing fictional test accounts
  const handlePrefillPatient = () => {
    setAuthMode('login')
    setSelectedRole('patient')
    setEmail('alex.morgan@patient.medilens.health')
    setPassword('Patient@MediLens2026')
    setErrorMessage(null)
    setLoginDiagnostic(null)
  }

  const handlePrefillDoctor = () => {
    setAuthMode('login')
    setSelectedRole('doctor')
    setEmail('s.lin@cardio.medilens.health')
    setPassword('Doctor@MediLens2026')
    setErrorMessage(null)
    setLoginDiagnostic(null)
  }

  const handlePrefillWrongPassword = () => {
    setAuthMode('login')
    setEmail('alex.morgan@patient.medilens.health')
    setPassword('WrongPassword#2026')
    setErrorMessage(null)
    setLoginDiagnostic(null)
  }

  const handleClearFields = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setErrorMessage(null)
    setLoginDiagnostic(null)
    setSuccessMessage(null)
  }

  return (
    <div className="login-page-wrapper">
      {/* Background Graphic Layer */}
      <div className="login-bg-media" aria-hidden="true">
        <div className="login-bg-overlay" />
        <img
          src="/healthcare-bg.jpg"
          alt="Gentle caring hands in healthcare"
          className="login-bg-img"
        />
      </div>

      {/* Floating Gentle Ambient Glows */}
      <div className="ambient-glow glow-1" aria-hidden="true" />
      <div className="ambient-glow glow-2" aria-hidden="true" />

      {/* Top Language Bar for Login Screen */}
      {onLanguageChange && (
        <div className="login-lang-bar">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`login-lang-btn ${language === 'en' ? 'active' : ''}`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta')}
            className={`login-lang-btn ${language === 'ta' ? 'active' : ''}`}
          >
            🇮🇳 தமிழ்
          </button>
        </div>
      )}

      {/* Centered Dual-Column Container */}
      <div className="login-container-grid">
        {/* Left Column: Brand & Compassion Story */}
        <section className="login-story-card">
          <div className="story-content-top">
            <header className="story-header">
              <div className="brand-badge-pill">
                <span className="brand-plus">+</span>
                <span className="brand-name">{t('brandName', language)}</span>
              </div>
              <span className="compassion-tag">
                ❤️ {language === 'ta' ? 'பரிவான மருத்துவ சேவை' : 'Compassionate Care'}
              </span>
            </header>

            <div className="story-hero-text">
              <h1 className="story-title">
                {language === 'ta'
                  ? 'உங்கள் ஆரோக்கியப் பயணத்தில் நம்பிக்கையான வழிகாட்டி.'
                  : 'Empowering your health journey with clarity and compassion.'}
              </h1>
              <p className="story-desc">
                {language === 'ta'
                  ? 'ஆய்வக அறிக்கைகளை எளிதாகப் புரிந்து கொள்ளுங்கள், மருத்துவ தேதிகளை ஒப்பிடுங்கள், மற்றும் உங்கள் மருத்துவக் குழுவுடன் பாதுகாப்பாக இணையுங்கள்.'
                  : 'Understand diagnostic reports in plain language, track historical biomarker changes, and consult seamlessly with your certified healthcare provider.'}
              </p>
            </div>

            <div className="trust-pills-row">
              <div className="trust-pill">
                <span className="pill-icon">🔒</span>
                <span>{language === 'ta' ? 'குறியாக்கப்பட்ட கடவுச்சொல் (scrypt)' : 'Encrypted Credentials (scrypt)'}</span>
              </div>
              <div className="trust-pill">
                <span className="pill-icon">🛡️</span>
                <span>{language === 'ta' ? 'சர்வர் அங்கீகாரப் பாதுகாப்பு' : 'Server Role Verification'}</span>
              </div>
              <div className="trust-pill">
                <span className="pill-icon">🌐</span>
                <span>{language === 'ta' ? 'தமிழ் & ஆங்கில ஆதரவு' : 'Bilingual EN / TA Support'}</span>
              </div>
            </div>
          </div>

          {/* Fictional Credentials Helper for Evaluation */}
          <div className="fictional-eval-box">
            <span className="eval-heading">
              🧪 {language === 'ta' ? 'மாதிரி கணக்கு விவரங்கள் (Fictional Test Data):' : 'Fictional Test Accounts for Evaluation:'}
            </span>
            <div className="eval-creds-list">
              <div className="eval-item">
                <strong>{language === 'ta' ? 'நோயாளி (Patient):' : 'Patient:'}</strong>
                <code>alex.morgan@patient.medilens.health</code>
                <span className="pwd-label">Pass: <code>Patient@MediLens2026</code></span>
              </div>
              <div className="eval-item">
                <strong>{language === 'ta' ? 'மருத்துவர் (Doctor):' : 'Doctor:'}</strong>
                <code>s.lin@cardio.medilens.health</code>
                <span className="pwd-label">Pass: <code>Doctor@MediLens2026</code></span>
              </div>
            </div>
            <div className="eval-quick-actions">
              <button type="button" className="btn-eval-fill" onClick={handlePrefillPatient}>
                ⚡ {language === 'ta' ? 'நோயாளி நிரப்பு' : 'Fill Patient'}
              </button>
              <button type="button" className="btn-eval-fill" onClick={handlePrefillDoctor}>
                ⚡ {language === 'ta' ? 'மருத்துவர் நிரப்பு' : 'Fill Doctor'}
              </button>
              <button type="button" className="btn-eval-fill test-wrong" onClick={handlePrefillWrongPassword}>
                ❌ {language === 'ta' ? 'தவறான கடவுச்சொல் சோதனை' : 'Test Wrong Pass'}
              </button>
              <button type="button" className="btn-eval-fill" onClick={handleClearFields}>
                🧹 {language === 'ta' ? 'படிவத்தை அழி' : 'Clear Fields'}
              </button>
            </div>
          </div>

          <footer className="story-footer">
            <p>
              © 2026 {t('brandName', language)} •{' '}
              {language === 'ta'
                ? 'மருத்துவ பாதுகாப்புத் தரம் & HIPAA-பாதுகாப்பான வடிவமைப்பு.'
                : 'Clinical data isolation & HIPAA-compliant architecture.'}
            </p>
          </footer>
        </section>

        {/* Right Column: Portal Login / Register Form Card */}
        <section className="login-form-card" aria-label="Sign In or Register Form">
          {/* Auth Mode Toggle Tabs (Sign In vs Register) */}
          <div className="auth-mode-switch" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'login'}
              className={`mode-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleToggleMode('login')}
            >
              <span>🔑 {language === 'ta' ? 'உள்நுழைக (Sign In)' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'register'}
              className={`mode-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleToggleMode('register')}
            >
              <span>✨ {language === 'ta' ? 'புதிய கணக்கு (Register)' : 'Create Account'}</span>
            </button>
          </div>

          <div className="form-card-header">
            <h2 className="portal-title">
              {authMode === 'login'
                ? language === 'ta'
                  ? 'மருத்துவ தளத்திற்கு வருக'
                  : 'Welcome to MediLens'
                : language === 'ta'
                ? 'புதிய கணக்கை உருவாக்கவும்'
                : 'Create Your Account'}
            </h2>
            <p className="portal-sub">
              {authMode === 'login'
                ? language === 'ta'
                  ? 'உங்கள் அங்கீகரிக்கப்பட்ட கணக்கு விவரங்களை உள்ளிடவும்.'
                  : 'Enter your verified healthcare credentials to access your dashboard.'
                : language === 'ta'
                ? 'நோயாளி அல்லது மருத்துவராக பதிவு செய்து கடவுச்சொல்லை அமைக்கவும்.'
                : 'Register as a patient or physician with a secure password.'}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: isSupabaseConfigured() ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
              color: isSupabaseConfigured() ? '#059669' : '#2563eb',
              border: `1px solid ${isSupabaseConfigured() ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
              marginTop: '8px'
            }}>
              <span>{isSupabaseConfigured() ? '🟢' : '⚡'}</span>
              <span>
                {isSupabaseConfigured()
                  ? (language === 'ta' ? 'Supabase கிளவுட் அங்கீகாரம் இணைக்கப்பட்டுள்ளது' : 'Supabase Cloud Auth Active')
                  : (language === 'ta' ? 'Supabase ரெடி (.env-ல் URL & Key வழங்கி இணைக்கலாம்)' : 'Supabase Ready (Add credentials in .env to connect)')}
              </span>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="role-tab-group" role="radiogroup" aria-label="User portal role selection">
            <button
              type="button"
              className={`role-tab ${selectedRole === 'patient' ? 'active' : ''}`}
              onClick={() => handleRoleChange('patient')}
              role="radio"
              aria-checked={selectedRole === 'patient'}
            >
              <span className="tab-icon">👤</span>
              <div className="tab-info">
                <strong>{t('patientPortalTab', language)}</strong>
                <span>{language === 'ta' ? 'அறிக்கைகள் & ஆலோசனைகள்' : 'Reports & Consultations'}</span>
              </div>
            </button>

            <button
              type="button"
              className={`role-tab ${selectedRole === 'doctor' ? 'active' : ''}`}
              onClick={() => handleRoleChange('doctor')}
              role="radio"
              aria-checked={selectedRole === 'doctor'}
            >
              <span className="tab-icon">🩺</span>
              <div className="tab-info">
                <strong>{t('physicianPortalTab', language)}</strong>
                <span>{language === 'ta' ? 'மருத்துவர் மதிப்பாய்வு' : 'Clinical Diagnostic Review'}</span>
              </div>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="login-alert-error" role="alert">
              <div className="alert-message-text">
                <span className="alert-icon">⚠️</span>
                <span>{errorMessage}</span>
              </div>
              {loginDiagnostic && (
                <div className="dev-diagnostic-box">
                  <span className="diagnostic-title">
                    🔍 {language === 'ta' ? 'பாதுகாப்பான பகுப்பாய்வு (Diagnostic):' : 'Safe Diagnostics:'}
                  </span>
                  <div className="diagnostic-tags">
                    <span className="diag-pill">Stage: {loginDiagnostic.stage}</span>
                    <span className="diag-pill">Category: {loginDiagnostic.category}</span>
                    <span className="diag-pill">Account in DB: {loginDiagnostic.accountFound ? 'Yes' : 'No'}</span>
                  </div>
                  {loginDiagnostic.category === 'ACCOUNT_NOT_FOUND' && authMode === 'login' && (
                    <div className="account-not-found-action">
                      <span>{language === 'ta' ? 'இந்த மின்னஞ்சலில் புதிய கணக்கை உருவாக்க விரும்புகிறீர்களா?' : 'No account exists for this email.'}</span>
                      <button
                        type="button"
                        className="btn-create-account-inline"
                        onClick={() => handleToggleMode('register')}
                      >
                        ➕ {language === 'ta' ? 'புதிய கணக்கை உருவாக்கவும்' : 'Switch to Create Account'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="login-alert-success" role="status">
              <span className="alert-icon">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actual Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name for Registration */}
            {authMode === 'register' && (
              <div className="input-field-group">
                <label htmlFor="auth-name">
                  {language === 'ta' ? 'முழு பெயர் *' : 'Full Name *'}
                </label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder={
                      selectedRole === 'doctor'
                        ? (language === 'ta' ? 'எ.கா: டாக்டர் சாரா லின், MD' : 'e.g. Dr. Sarah Lin, MD')
                        : (language === 'ta' ? 'எ.கா: அலெக்ஸ் மோர்கன்' : 'e.g. Alex Morgan')
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="input-field-group">
              <label htmlFor="auth-email">
                {t('emailLabel', language)} *
              </label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@medilens.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Option */}
            <div className="input-field-group">
              <div className="label-row">
                <label htmlFor="auth-password">{t('passwordLabel', language)} *</label>
                {authMode === 'register' && (
                  <span className="pwd-hint">
                    {language === 'ta' ? 'குறைந்தது 8 எழுத்துக்கள்' : 'Min. 8 characters'}
                  </span>
                )}
              </div>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password (Registration Only) */}
            {authMode === 'register' && (
              <div className="input-field-group">
                <label htmlFor="auth-confirm-password">
                  {language === 'ta' ? 'கடவுச்சொல்லை உறுதிப்படுத்தவும் *' : 'Confirm Password *'}
                </label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {/* Extra Options Row */}
            {authMode === 'login' && (
              <div className="form-extra-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t('rememberMeLabel', language)}</span>
                </label>
                <span className="server-secure-tag">
                  🛡️ {language === 'ta' ? 'சர்வர் அங்கீகாரம்' : 'Verified Auth'}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-login-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  <span>
                    {authMode === 'register'
                      ? (language === 'ta' ? 'பதிவு செய்யப்படுகிறது...' : 'Creating Account...')
                      : (language === 'ta' ? 'சரிபார்க்கிறது...' : 'Authenticating...')}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === 'register'
                      ? (language === 'ta' ? 'கணக்கை உருவாக்கு' : 'Create Healthcare Account')
                      : `${t('signInSubmitBtn', language)} →`}
                  </span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
