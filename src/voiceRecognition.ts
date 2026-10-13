// Web Speech Recognition & Audio Level Monitoring Service for MediLens AI

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

export function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(getSpeechRecognitionConstructor())
}

export interface VoiceSessionHandlers {
  onStart?: () => void
  onTranscriptChange: (text: string, isFinal: boolean) => void
  onAudioLevel?: (level: number) => void // 0 to 100
  onError?: (errorType: string, message: string) => void
  onEnd?: () => void
}

export class VoiceRecognitionSession {
  private recognition: SpeechRecognitionInstance | null = null
  private audioStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private animFrameId: number | null = null
  private handlers: VoiceSessionHandlers
  private lang: string
  private isActive = false
  private accumulatedFinalText = ''
  private silenceTimer: number | null = null

  constructor(lang: string, handlers: VoiceSessionHandlers) {
    this.lang = lang
    this.handlers = handlers
  }

  public setLanguage(newLang: string) {
    this.lang = newLang
    if (this.recognition && this.isActive) {
      this.recognition.lang = newLang
    }
  }

  public async start(): Promise<boolean> {
    const SpeechConstructor = getSpeechRecognitionConstructor()
    if (!SpeechConstructor) {
      this.handlers.onError?.(
        'not_supported',
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
      )
      return false
    }

    // 1. Explicitly request microphone access to ensure the browser prompts the user if not allowed yet
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        this.startAudioLevelAnalyzer(this.audioStream)
      }
    } catch (err: unknown) {
      const errName = (err as Error)?.name || ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        this.handlers.onError?.(
          'permission_denied',
          'Microphone permission was denied. Please allow microphone access in your browser address bar.'
        )
      } else {
        this.handlers.onError?.(
          'mic_unavailable',
          'Could not access microphone. Please check your microphone connection.'
        )
      }
      return false
    }

    // 2. Initialize SpeechRecognition instance
    try {
      const rec = new SpeechConstructor()
      this.recognition = rec
      rec.lang = this.lang
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onstart = () => {
        this.isActive = true
        this.handlers.onStart?.()
      }

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        this.resetSilenceTimer()
        let finalChunk = ''
        let interimChunk = ''

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalChunk += item[0].transcript + ' '
          } else {
            interimChunk += item[0].transcript
          }
        }

        const fullText = (finalChunk + interimChunk).trim()
        if (fullText) {
          this.accumulatedFinalText = fullText
          this.handlers.onTranscriptChange(fullText, interimChunk.length === 0)
        }
      }

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        // 'no-speech' is triggered when the user pauses. Do not treat as fatal error!
        if (event.error === 'no-speech') {
          return
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.handlers.onError?.(
            'permission_denied',
            'Microphone access denied. Please click the lock icon in the address bar and allow microphone permissions.'
          )
          this.stop()
        } else if (event.error === 'network') {
          this.handlers.onError?.(
            'network',
            'Speech recognition network timeout. Switching or checking connection.'
          )
        } else if (event.error !== 'aborted') {
          this.handlers.onError?.(
            event.error,
            `Voice recognition encountered an issue (${event.error}).`
          )
        }
      }

      rec.onend = () => {
        // If it ended prematurely while still marked active (e.g. browser speech engine restarted),
        // we can finish cleanly or notify handler
        this.cleanUpAudio()
        this.isActive = false
        this.handlers.onEnd?.()
      }

      rec.start()
      return true
    } catch (err: unknown) {
      this.cleanUpAudio()
      this.handlers.onError?.(
        'init_failed',
        `Failed to start speech recognition: ${(err as Error)?.message || 'Unknown error'}`
      )
      return false
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) {
      window.clearTimeout(this.silenceTimer)
    }
    // Auto-complete after 4.5 seconds of silence if user has already spoken text
    this.silenceTimer = window.setTimeout(() => {
      if (this.isActive && this.accumulatedFinalText.trim().length > 0) {
        this.stop()
      }
    }, 4500)
  }

  private startAudioLevelAnalyzer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      this.audioContext = new AudioCtx()
      const source = this.audioContext.createMediaStreamSource(stream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 64
      this.analyser.smoothingTimeConstant = 0.5
      source.connect(this.analyser)

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount)

      const tick = () => {
        if (!this.analyser || !this.isActive) return
        this.analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const level = Math.min(100, Math.round((avg / 128) * 100))
        this.handlers.onAudioLevel?.(level)
        this.animFrameId = requestAnimationFrame(tick)
      }

      this.animFrameId = requestAnimationFrame(tick)
    } catch {
      // Audio level visualizer is an optional enhancement; ignore if restricted
    }
  }

  public stop() {
    this.isActive = false
    if (this.silenceTimer) {
      window.clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }

    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        try {
          this.recognition.abort()
        } catch {
          // ignore
        }
      }
      this.recognition = null
    }

    this.cleanUpAudio()
    this.handlers.onEnd?.()
  }

  private cleanUpAudio() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop())
      this.audioStream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close()
      } catch {
        // ignore
      }
      this.audioContext = null
    }
  }
}
