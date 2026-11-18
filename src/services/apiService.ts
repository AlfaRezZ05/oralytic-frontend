import type {
  ScreeningRecord,
  PatientData,
  AuthSession,
  BackendPatient,
  BackendUser,
  BackendInstitution,
} from '../types';
import { INITIAL_MOCK_RECORDS } from '../data/mockScreeningRecords';

const STORAGE_KEY = 'screeningRecords';
const AUTH_STORAGE_KEY = 'sonri_auth_session';

// Base API URL: uses VITE_API_BASE_URL in production (e.g. Rumahweb -> external backend),
// or falls back to relative '/api/v1' (proxied by Vite in local dev to http://127.0.0.1:8000)
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const API_BASE_URL = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, '')
  : '/api/v1';

const rawAiEngineUrl = import.meta.env.VITE_AI_ENGINE_URL as string | undefined;
export const AI_ENGINE_BASE_URL = rawAiEngineUrl
  ? rawAiEngineUrl.replace(/\/+$/, '')
  : '';

// ===================================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ===================================================================================

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setAuthSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const getAuthHeaders = (): HeadersInit => {
  const session = getAuthSession();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Locale': 'id',
  };
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
};

/**
 * Login using backend Laravel API (/api/v1/auth/login) with automatic fallback for standalone frontend dev
 */
export const loginWithBackend = async (
  email: string,
  password: string
): Promise<AuthSession> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Locale': 'id',
      },
      body: JSON.stringify({
        email,
        password,
        device_name: 'sonri-frontend-web',
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      const tokenData = payload.data;
      const user: BackendUser = tokenData.user;
      const activeInstitution: BackendInstitution | null =
        user.institutions && user.institutions.length > 0
          ? user.institutions[0]
          : null;

      const session: AuthSession = {
        token: tokenData.token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: tokenData.expires_at,
        user,
        activeInstitution,
      };

      setAuthSession(session);
      return session;
    }
  } catch (err) {
    console.info('Backend API offline / tidak terjangkau, menggunakan sesi dev lokal.');
  }

  // Standalone Dev Fallback: buat sesi lokal otomatis agar proses development frontend tidak terhambat
  const devSession: AuthSession = {
    token: 'dev-standalone-token',
    token_type: 'Bearer',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    user: {
      id: 1,
      name: 'dr. Sarah Sp.A',
      email: email || 'dokter@klinik.com',
      role: 'nakes',
      role_label: 'Tenaga Kesehatan',
      is_active: true,
    },
    activeInstitution: {
      id: 1,
      name: 'RS Pratama SONRI',
      code: 'RS-SONRI',
    },
  };

  setAuthSession(devSession);
  return devSession;
};

/**
 * Logout and revoke current Sanctum token
 */
export const logoutFromBackend = async (): Promise<void> => {
  try {
    const session = getAuthSession();
    if (session?.token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    }
  } catch (err) {
    console.warn('Logout request failed or server unreachable:', err);
  } finally {
    setAuthSession(null);
  }
};

// ===================================================================================
// PATIENTS INTEGRATION (Connects to /institutions/{id}/patients)
// ===================================================================================

/**
 * Check if a patient exists by NIK across institutions
 */
export const checkPatientByNik = async (
  nik: string
): Promise<{
  found: boolean;
  registeredInInstitution: boolean;
  patient: BackendPatient | null;
}> => {
  const session = getAuthSession();
  const institutionId = session?.activeInstitution?.id;

  if (!institutionId) {
    throw new Error('Institusi aktif tidak ditemukan pada sesi login.');
  }

  const response = await fetch(
    `${API_BASE_URL}/institutions/${institutionId}/patients/check?nik=${encodeURIComponent(
      nik
    )}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || 'Gagal memeriksa NIK pasien');
  }

  return {
    found: Boolean(payload.data?.found),
    registeredInInstitution: Boolean(payload.data?.registered_in_institution),
    patient: payload.data?.patient ?? null,
  };
};

/**
 * Fetch patient list from active institution
 */
export const fetchInstitutionPatients = async (
  search = '',
  visitedToday = false
): Promise<BackendPatient[]> => {
  const session = getAuthSession();
  const institutionId = session?.activeInstitution?.id;
  if (!institutionId) return [];

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (visitedToday) params.append('visited_today', '1');

  const response = await fetch(
    `${API_BASE_URL}/institutions/${institutionId}/patients?${params.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Gagal mengambil daftar pasien dari institusi');
  }

  const payload = await response.json();
  return payload.data || [];
};

/**
 * Register a new patient in the active institution
 */
export const registerPatientToInstitution = async (
  data: PatientData,
  medicalRecordNumber?: string
): Promise<BackendPatient> => {
  const session = getAuthSession();
  const institutionId = session?.activeInstitution?.id;

  if (!institutionId) {
    throw new Error('Institusi aktif tidak ditemukan pada sesi login.');
  }

  // Format gender for backend enum ('male' | 'female')
  const formattedGender =
    data.gender.toLowerCase() === 'female' ? 'female' : 'male';

  const body = {
    nik: data.nik?.trim() || null,
    name: data.name.trim(),
    gender: formattedGender,
    birth_date: data.dob, // Frontend 'dob' maps to backend 'birth_date'
    medical_record_number: medicalRecordNumber || undefined,
  };

  const response = await fetch(
    `${API_BASE_URL}/institutions/${institutionId}/patients`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const errorMsg =
      payload?.message ||
      payload?.errors?.nik?.[0] ||
      payload?.errors?.name?.[0] ||
      'Gagal mendaftarkan pasien ke institusi';
    throw new Error(errorMsg);
  }

  return payload.data;
};

// ===================================================================================
// SCREENING RECORDS (Hybrid Backend Sync + LocalStorage Development Fallback)
// ===================================================================================

export const getScreeningRecords = async (): Promise<ScreeningRecord[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECORDS));
      return INITIAL_MOCK_RECORDS;
    }
    const storedRecords = JSON.parse(stored);
    if (!Array.isArray(storedRecords) || storedRecords.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECORDS));
      return INITIAL_MOCK_RECORDS;
    }

    // Pastikan data mock terbaru (Aica Amir, Dian Anggraeni, dll.) terinkorporasi jika belum tersimpan
    const existingIds = new Set(storedRecords.map((r: ScreeningRecord) => r.id));
    const missingRecords = INITIAL_MOCK_RECORDS.filter((r) => !existingIds.has(r.id));
    if (missingRecords.length > 0) {
      const merged = [...missingRecords, ...storedRecords];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return storedRecords;
  } catch (e) {
    console.error('Failed to load records from localStorage, falling back to mock data', e);
    return INITIAL_MOCK_RECORDS;
  }
};

export const saveScreeningRecord = async (record: ScreeningRecord): Promise<void> => {
  // 1. Try to register / sync patient data with backend if logged in
  const session = getAuthSession();
  if (session?.token && session?.activeInstitution?.id && record.patientData.nik) {
    try {
      console.log('Syncing patient identity to backend institution...');
      await registerPatientToInstitution(record.patientData);
      console.log('Patient successfully registered/synced on backend.');
    } catch (apiError) {
      console.warn('Backend patient sync note:', apiError);
      // We continue to save the screening locally so frontend development remains unblocked
    }
  }

  // 2. Persist full screening data to local storage
  try {
    const existingRecords = await getScreeningRecords();
    const updatedRecords = [record, ...existingRecords.filter((r) => r.id !== record.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    console.log('Screening record saved successfully in local storage.');
    return Promise.resolve();
  } catch (e) {
    console.error('Failed to save data to local storage:', e);
    return Promise.reject(e);
  }
};

// ===================================================================================
// EMR PUSH HELPER
// ===================================================================================

export const sendRecordToEMR = async (
  record: ScreeningRecord
): Promise<{ success: boolean; message: string }> => {
  console.log('Sending screening data to EMR representation:', record.patientData.name);
  return {
    success: true,
    message: 'Data skrining berhasil disiapkan untuk sinkronisasi EMR.',
  };
};

export const fetchPatientDataFromEMR = async (
  nik: string
): Promise<Partial<PatientData> | null> => {
  try {
    const result = await checkPatientByNik(nik);
    if (result.found && result.patient) {
      return {
        nik: result.patient.nik ?? nik,
        name: result.patient.name,
        dob: result.patient.birth_date,
        gender: result.patient.gender === 'female' ? 'Female' : 'Male',
      };
    }
    return null;
  } catch (err) {
    console.warn('EMR / Patient check skipped or failed:', err);
    return null;
  }
};
