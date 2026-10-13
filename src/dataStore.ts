import type { Appointment } from './types'

const APPOINTMENTS_STORAGE_KEY = 'medilens_demo_appointments'

export const INITIAL_DEMO_APPOINTMENTS: Appointment[] = [
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
]

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // fallback to initial
  }
  return INITIAL_DEMO_APPOINTMENTS
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments))
  } catch {
    // ignore quota error
  }
}
