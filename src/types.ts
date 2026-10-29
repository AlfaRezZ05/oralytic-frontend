export const AppStep = {
  HOME: 'HOME',
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  LANDING: 'LANDING',
  STUNTING_SCREENING: 'STUNTING_SCREENING',
  ORAL_EXAMINATION: 'ORAL_EXAMINATION',
  ANALYZING: 'ANALYZING',
  REPORT: 'REPORT',
  DASHBOARD: 'DASHBOARD',
} as const;

export type AppStep = (typeof AppStep)[keyof typeof AppStep];

export interface PatientData {
  nik: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  weight: string;
  height: string;
  headCircumference: string;
  armCircumference: string;
  maritalStatus?: 'Married' | 'Single' | '';
  pregnancyStatus?: 'Pregnant' | 'Not Pregnant' | '';
}

export interface StuntingScreeningData {
  ageGroup: '0-24' | '>24' | 'Adult' | null;
  // Questions for 0-24 months
  exclusiveBreastfeeding: 'yes' | 'no' | '';
  sugarInFormula: 'yes' | 'no' | '';
  mpasiStartDate: string;
  mpasiMenu: string[];
  mpasiTexture: string;
  snackFrequency: string;
  snackType: string;
  sweetDrinkFrequency: string;
  sleepWithBottle: 'yes' | 'no' | '';
  gumCleaningStartDate: string;
  useSpecialToothpaste: 'yes' | 'no' | '';
  // Questions for >24 months
  mainMealsPerDay: string;
  dailyDietIncludes: string[];
  isPickyEater: 'yes' | 'no' | '';
  pickyEaterFoods: string;
  snackFrequencyOutside: string;
  favoriteSnack: string;
  weeklyConsumption: {
    soda: string;
    packagedSnacks: string;
    sweets: string;
    fastFood: string;
  };
  brushingFrequency: string;
  brushingHabits: string[];
  dentalPain: 'yes' | 'no' | '';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OralIssue {
  diseaseName: string;
  description: string;
  boundingBox: BoundingBox;
}

export interface OralAnalysisResult {
  issues: OralIssue[];
  hygieneAssessment: 'Good' | 'Fair' | 'Poor';
}

export interface OralAnalysis {
  imageFile?: File;
  imagePreview: string;
  analysisResult: OralAnalysisResult | null;
  imageQuality?: 'good' | 'poor' | 'checking';
  qualityReason?: string;
}

export type GrowthStatus = 'Tinggi Badan Sesuai Usia' | 'Perawakan Pendek';

export interface HealthReportData {
    nutritionResult: 'Normal' | 'Needs Monitoring' | 'Needs Referral' | 'Risiko KEK' | 'Bukan Risiko KEK';
    stuntingStatus: string;
    heightForAgeZScore: number | null;
    weightStatus: string;
    weightForAgeZScore: number | null;
    wastingStatus: string;
    wastingZScore: number | null;
    lilaStatus: string;
    growthStatus?: GrowthStatus;
    bmi: number | null;
    bmiStatus: string;
    nutritionReason: string;
    oralResult: 'Healthy' | 'At Risk of Caries' | 'Needs Referral';
    oralReason: string;
    conclusion: string;
    recommendations: string[];
}

export interface ScreeningRecord {
    id: string;
    date: string;
    patientCategory?: 'Anak' | 'Ibu Hamil';
    validationStatus?: 'pending' | 'validated';
    patientData: PatientData;
    stuntingData: StuntingScreeningData;
    oralAnalyses: {
        imageBase64: string; 
        analysisResult: OralAnalysisResult;
    }[];
    healthReport: HealthReportData;
}

// Backend Integration Types
export interface BackendInstitution {
    id: number;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
}

export interface BackendUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role: 'super_admin' | 'institution_admin' | 'nakes';
    role_label: string;
    is_active: boolean;
    institutions?: BackendInstitution[];
}

export interface BackendPatientRegistration {
    medical_record_number?: string | null;
    registered_at?: string | null;
    last_visit_at?: string | null;
}

export interface BackendPatient {
    id: number;
    nik: string | null;
    name: string;
    gender: 'male' | 'female';
    gender_label: string;
    birth_place?: string | null;
    birth_date: string; // YYYY-MM-DD
    age?: number;
    address?: string | null;
    phone?: string | null;
    guardian_name?: string | null;
    satusehat_patient_id?: string | null;
    registration?: BackendPatientRegistration;
}

export interface AuthSession {
    token: string;
    token_type: string;
    expires_at: string;
    user: BackendUser;
    activeInstitution?: BackendInstitution | null;
}
