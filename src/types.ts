export enum Urgency {
  MODERATE = "moderate",
  SERIOUS = "serious",
  CRITICAL = "critical",
  HIGH = "critical", // Alias for backward compatibility
}

export enum IncidentStatus {
  RECEIVED = "received",
  DISPATCHED = "dispatched",
  EN_ROUTE = "en_route",
  ARRIVED = "arrived",
  COMPLETED = "completed",
}

export enum UserRole {
  REPORTER = "reporter",
  NURSE = "nurse",
  DOCTOR = "doctor",
  DRIVER = "driver",
  BODA_COORDINATOR = "boda_coordinator",
  BODA_RIDER = "boda_rider",
}

export interface SOSIncident {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  symptoms: string[];
  severity: Urgency;
  description: string;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
    campusZone: string;
    specificLocation?: string;
  };
  status: IncidentStatus;
  assignedResource?: {
    type: "ambulance" | "boda";
    id: string;
    name: string;
    phone: string;
  };
  timestamp: number;
  auditTrail: {
    status: IncidentStatus;
    timestamp: number;
    note?: string;
  }[];
}

export interface ResourceStatus {
  id: string;
  type: "ambulance" | "boda" | "staff";
  name: string;
  status: "available" | "on_call" | "off_duty" | "maintenance" | "busy";
  lastUpdated: number;
  metadata?: {
    fuelLevel?: number;
    oxygenLevel?: string;
    equipmentStatus?: string;
  };
}

export interface VoiceMessage {
  id: string;
  incidentId: string;
  senderId: string;
  senderRole: UserRole;
  text: string; // Transcription
  audioUrl?: string;
  timestamp: number;
  language: "en" | "lg";
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
}
