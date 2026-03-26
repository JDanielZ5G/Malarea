export enum Urgency {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface PatientReport {
  id: string;
  chvId: string;
  patientId: string; // Added for history tracking
  patientName: string;
  age: number;
  gender: "male" | "female" | "other";
  symptoms: string[];
  description: string;
  location: {
    lat: number;
    lng: number;
    district: string;
  };
  aiDiagnosis?: {
    possibleConditions: string[];
    urgency: Urgency;
    recommendation: string;
  };
  malnutritionScan?: {
    status: "normal" | "at_risk" | "severe";
    confidence: number;
    notes: string;
  };
  timestamp: number;
}

export interface OutbreakAlert {
  id: string;
  district: string;
  condition: string;
  severity: Urgency;
  affectedCount: number;
  aiAnalysis: string;
  timestamp: number;
  isResolved: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: "chv" | "official";
  name: string;
  district: string;
}
