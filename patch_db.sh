cat << 'INNER_EOF' > src/lib/db.ts
export interface SyllabusProgress {
  id: string;
  uid: string;
  subject: string;
  paper: string;
  completedItems: string[];
  totalItems: number;
  updatedAt: number;
}
export interface StudySession {
  id: string;
  uid: string;
  date: number;
  durationMinutes: number;
  createdAt: number;
}
export interface Goal {
  id: string;
  uid: string;
  type: 'GPA' | 'SUBJECT' | 'STUDY';
  target: number;
  current: number;
  createdAt: number;
  updatedAt: number;
}
export interface ExamRecord {
  id: string;
  uid: string;
  class: string;
  group: string;
  examType: string;
  date: number;
  subjects: any[];
  totalMarks: number;
  GPA: number;
  status: string;
}

const getProfileData = () => {
  try {
    const raw = localStorage.getItem('profileData');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveProfileData = (data: any) => {
  localStorage.setItem('profileData', JSON.stringify(data));
};

export const dbApi = {
  async getSyllabusProgress(uid: string): Promise<SyllabusProgress[]> {
    const data = getProfileData();
    return data.syllabusProgress || [];
  },
  async saveSyllabusProgress(progress: SyllabusProgress) {
    const data = getProfileData();
    const list = data.syllabusProgress || [];
    const index = list.findIndex((p: any) => p.id === progress.id);
    if (index >= 0) list[index] = progress;
    else list.push(progress);
    data.syllabusProgress = list;
    saveProfileData(data);
  },
  async getStudySessions(uid: string): Promise<StudySession[]> {
    const data = getProfileData();
    return data.studySessions || [];
  },
  async saveStudySession(session: StudySession) {
    const data = getProfileData();
    const list = data.studySessions || [];
    list.push(session);
    data.studySessions = list;
    saveProfileData(data);
  },
  async getGoals(uid: string): Promise<Goal[]> {
    const data = getProfileData();
    return data.goals || [];
  },
  async saveGoal(goal: Goal) {
    const data = getProfileData();
    const list = data.goals || [];
    const index = list.findIndex((g: any) => g.id === goal.id);
    if (index >= 0) list[index] = goal;
    else list.push(goal);
    data.goals = list;
    saveProfileData(data);
  },
  async deleteGoal(id: string) {
    const data = getProfileData();
    data.goals = (data.goals || []).filter((g: any) => g.id !== id);
    saveProfileData(data);
  },
  async getExams(uid: string): Promise<ExamRecord[]> {
    const data = getProfileData();
    return data.exams || [];
  },
  async saveExam(exam: ExamRecord) {
    const data = getProfileData();
    const list = data.exams || [];
    const index = list.findIndex((e: any) => e.id === exam.id);
    if (index >= 0) list[index] = exam;
    else list.push(exam);
    data.exams = list;
    saveProfileData(data);
  },
  async deleteExam(id: string) {
    const data = getProfileData();
    data.exams = (data.exams || []).filter((e: any) => e.id !== id);
    saveProfileData(data);
  },
  async getCalculatorState() { 
    const data = getProfileData(); 
    return data.calculatorState || null; 
  },
  async saveCalculatorState(state: any) { 
    const data = getProfileData(); 
    data.calculatorState = state; 
    saveProfileData(data); 
  },
  async deleteAllUserData() {
    localStorage.removeItem('profileData');
  }
};
INNER_EOF
