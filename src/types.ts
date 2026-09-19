export type GroupType = 'SCIENCE' | 'COMMERCE' | 'ARTS';
export type Language = 'EN' | 'BN';

export interface ComponentConfig {
  cq?: number;
  mcq?: number;
  practical?: number;
  written?: number;
}
export interface PaperConfig {
  name: string;
  components: ComponentConfig;
}
export interface SubjectConfig {
  id: string;
  name: string;
  isPractical: boolean;
  papers: PaperConfig[];
}
export interface PaperMarks {
  cq?: number;
  mcq?: number;
  practical?: number;
  written?: number;
}
export interface SubjectMarks {
  paper1?: PaperMarks;
  paper2?: PaperMarks;
}
export type MarksState = Record<string, SubjectMarks>;

export interface GradeResult {
  grade: string;
  gpa: number;
}

export interface SubjectResult {
  id: string;
  name: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gpa: number;
  paper1Total?: number;
  paper2Total?: number;
  paper1Max?: number;
  paper2Max?: number;
}

export interface OverallResult {
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  mainSubjectsGpaSum: number;
  mainSubjectsCount: number;
  optionalSubjectGpa: number;
  optionalBonus: number;
  finalGpa: number;
  isPass: boolean;
  failedSubjects: string[];
}

export interface EligibilityResult {
  university: string;
  unit: string;
  category: string;
  isEligible: boolean;
  reasons: {
    passed: boolean;
    textEn: string;
    textBn: string;
  }[];
  examInfo?: {
    textEn: string;
    textBn: string;
  };
}

export interface DailyTaskItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface DailyTaskHistoryDay {
  date: string; // YYYY-MM-DD
  tasks: DailyTaskItem[];
  completedCount: number;
  totalCount: number;
  archivedAt: number;
}

export interface DailyTasksDoc {
  date: string;
  tasks: DailyTaskItem[];
  history: DailyTaskHistoryDay[];
  updatedAt: number;
}

export interface LeaderboardUserRecord {
  uid: string;
  name: string;
  collegeName?: string;
  class?: string;
  group?: string;
  email?: string;
  createdAt: number;
  studyPoints: number;
  totalStudyMinutes?: number;
}

export interface EventItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  createdAt: number;
}

