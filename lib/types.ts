export type ExaminationStatus = "erstdiagnostik" | "verlaufsdiagnostik";

export interface ExaminationFormData {
  patientName: string; // NUR Browser-State, wird NICHT gespeichert
  examinationDate: string; // ISO date string
  status: ExaminationStatus;
  rassScore: number;
  communication: string;
  hasTracheostomy: boolean;
  procedureDescription: string;
  medicalDiagnosis: string;
  dysphagia_question: string;
  medicalHistory: string;
}

// Was in die DB gespeichert wird — KEIN Patientenname
export type ExaminationInsert = Omit<ExaminationFormData, "patientName">;
