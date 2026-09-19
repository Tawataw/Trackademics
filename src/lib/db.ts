import { db, auth } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

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

export interface EventItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  createdAt: number;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: number;
  category?: string;
  [key: string]: any;
}

export interface StudySubject {
  id: string;
  uid: string;
  name: string;
  color: string;
  createdAt: number;
  [key: string]: any;
}

export interface SyllabusProgress {
  id: string;
  uid: string;
  subject: string;
  paper: string;
  completedItems: string[];
  numericCounts?: Record<string, number>;
  completedCount?: number;
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

export interface StudyResource {
  id: string;
  uid: string;
  platformName: string;
  url: string;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Strict scoring formula: 60 minutes of study = 20 points
 * Formula: Points = Math.floor((totalStudyMinutes / 60) * 20)
 */
export function calculateStudyPoints(totalStudyMinutes: number): number {
  if (!totalStudyMinutes || totalStudyMinutes <= 0) return 0;
  return Math.floor((totalStudyMinutes / 60) * 20);
}

/**
 * Converts total study minutes into human-readable format like "12h 30m" or "0h 0m"
 */
export function formatStudyTime(totalMinutes?: number): string {
  const mins = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export interface UserProfileData {
  name?: string;
  class?: string;
  group?: string;
  collegeName?: string;
  email?: string;
  uid?: string;
  createdAt?: number;
  studyPoints?: number;
  totalStudyMinutes?: number;
  syllabusProgress?: SyllabusProgress[];
  studySessions?: StudySession[];
  goals?: Goal[];
  exams?: ExamRecord[];
  calculatorState?: any;
  updatedAt?: number;
}

export interface AdminUserRecord {
  uid: string;
  name: string;
  email: string;
  class: string;
  createdAt: number;
}

// Clear legacy exams from localStorage to prevent data ghosting
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('exams');
    const stored = localStorage.getItem('profileData');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && 'exams' in parsed) {
        delete parsed.exams;
        localStorage.setItem('profileData', JSON.stringify(parsed));
      }
    }
  } catch (e) {}
}

const getProfileData = (): UserProfileData => {
  try {
    const raw = localStorage.getItem('profileData');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    delete parsed.exams; // Omit exams from local storage
    return parsed;
  } catch (e) {
    return {};
  }
};

const saveProfileData = (data: UserProfileData) => {
  try {
    const toSave = { ...data };
    delete toSave.exams; // Never persist exams in localStorage
    localStorage.setItem('profileData', JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const getEffectiveUid = (uid?: string): string | null => {
  if (uid && uid !== 'admin-user' && uid !== 'student-user') return uid;
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  const stored = localStorage.getItem('current_uid');
  if (stored && stored !== 'admin-user' && stored !== 'student-user') return stored;
  return null;
};

// Write to Firestore with fallback
async function syncFieldToFirestore(field: string, value: any, explicitUid?: string) {
  const uid = getEffectiveUid(explicitUid);
  if (!uid) return;

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      [field]: value,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn(`Firestore sync for ${field} deferred/failed, saved to local cache:`, error);
  }
}

export const dbApi = {
  // Sync all local data into Firestore when student signs in
  async syncLocalDataToFirestore(uid: string, initialProfile?: { name?: string; email?: string; class?: string; group?: string; collegeName?: string; createdAt?: number }) {
    if (!uid || uid === 'admin-user') return;
    localStorage.setItem('current_uid', uid);

    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);

      const localData = getProfileData();
      let localCalcState = null;
      try {
        const storedCalc = localStorage.getItem('hsc-tracker-storage');
        if (storedCalc) {
          const parsed = JSON.parse(storedCalc);
          localCalcState = parsed.state || parsed;
        }
      } catch (e) {}

      if (snap.exists()) {
        const remote = snap.data() as UserProfileData;
        
        const mergedSyllabus = (remote.syllabusProgress && remote.syllabusProgress.length > 0) ? remote.syllabusProgress : (localData.syllabusProgress || []);
        const mergedSessions = (remote.studySessions && remote.studySessions.length > 0) ? remote.studySessions : (localData.studySessions || []);
        const mergedGoals = (remote.goals && remote.goals.length > 0) ? remote.goals : (localData.goals || []);
        const mergedCalcState = remote.calculatorState || localCalcState || localData.calculatorState || null;

        const resolvedName = remote.name || initialProfile?.name || localData.name || 'Student';
        const resolvedEmail = remote.email || initialProfile?.email || localData.email || '';
        const resolvedClass = remote.class || initialProfile?.class || '';
        const resolvedGroup = remote.group || initialProfile?.group || '';
        const resolvedCollege = remote.collegeName || initialProfile?.collegeName || localData.collegeName || '';
        const resolvedCreatedAt = remote.createdAt || initialProfile?.createdAt || remote.updatedAt || Date.now();

        const sessionMins = mergedSessions.reduce((acc: number, s: any) => acc + (Number(s.durationMinutes) || 0), 0);
        const totalMinutes = Math.max(Number(remote.totalStudyMinutes) || 0, sessionMins);
        const calculatedPoints = calculateStudyPoints(totalMinutes);

        const updatedLocal: UserProfileData = {
          ...localData,
          name: resolvedName,
          class: resolvedClass,
          group: resolvedGroup,
          collegeName: resolvedCollege,
          email: resolvedEmail,
          createdAt: resolvedCreatedAt,
          uid,
          totalStudyMinutes: totalMinutes,
          studyPoints: calculatedPoints,
          syllabusProgress: mergedSyllabus,
          studySessions: mergedSessions,
          goals: mergedGoals,
          calculatorState: mergedCalcState,
          updatedAt: Date.now()
        };

        saveProfileData(updatedLocal);

        // Save/merge into Firestore without injecting default Science/Class 12 if missing
        await setDoc(userDocRef, {
          name: resolvedName,
          email: resolvedEmail,
          createdAt: resolvedCreatedAt,
          totalStudyMinutes: totalMinutes,
          studyPoints: calculatedPoints,
          updatedAt: Date.now(),
          ...(resolvedClass ? { class: resolvedClass } : {}),
          ...(resolvedGroup ? { group: resolvedGroup } : {}),
          ...(resolvedCollege ? { collegeName: resolvedCollege } : {}),
          ...(mergedSyllabus.length > 0 && !remote.syllabusProgress ? { syllabusProgress: mergedSyllabus } : {}),
          ...(mergedSessions.length > 0 && !remote.studySessions ? { studySessions: mergedSessions } : {}),
          ...(mergedGoals.length > 0 && !remote.goals ? { goals: mergedGoals } : {}),
          ...(mergedCalcState && !remote.calculatorState ? { calculatorState: mergedCalcState } : {})
        }, { merge: true });

        return updatedLocal;
      } else {
        // Document does not exist in Firestore yet: initialize clean document
        const initialCreatedAt = initialProfile?.createdAt || Date.now();
        const initialClass = initialProfile?.class || '';
        const initialGroup = initialProfile?.group || '';
        const initialCollege = initialProfile?.collegeName || '';
        const initialData: UserProfileData = {
          uid,
          name: initialProfile?.name || 'Student',
          email: initialProfile?.email || '',
          class: initialClass,
          group: initialGroup,
          collegeName: initialCollege,
          createdAt: initialCreatedAt,
          totalStudyMinutes: 0,
          studyPoints: 0,
          exams: [],
          syllabusProgress: [],
          studySessions: [],
          goals: [],
          calculatorState: null,
          updatedAt: Date.now()
        };

        const firestorePayload: Record<string, any> = {
          name: initialData.name,
          email: initialData.email,
          createdAt: initialCreatedAt,
          totalStudyMinutes: 0,
          studyPoints: 0,
          updatedAt: Date.now(),
          exams: [],
          syllabusProgress: [],
          studySessions: [],
          goals: []
        };
        if (initialClass) firestorePayload.class = initialClass;
        if (initialGroup) firestorePayload.group = initialGroup;
        if (initialCollege) firestorePayload.collegeName = initialCollege;

        await setDoc(userDocRef, firestorePayload, { merge: true });
        saveProfileData(initialData);
        return initialData;
      }
    } catch (err) {
      console.warn('Could not sync with Firestore during login, using local data:', err);
      return getProfileData();
    }
  },

  async updateUserProfile(uid: string, profile: { name?: string; class?: string; group?: string; collegeName?: string; totalStudyMinutes?: number; studyPoints?: number }): Promise<UserProfileData> {
    const effectiveUid = getEffectiveUid(uid);
    const current = getProfileData();
    if (profile.name !== undefined) current.name = profile.name;
    if (profile.class !== undefined) current.class = profile.class;
    if (profile.group !== undefined) current.group = profile.group;
    if (profile.collegeName !== undefined) current.collegeName = profile.collegeName;
    if (profile.totalStudyMinutes !== undefined) current.totalStudyMinutes = profile.totalStudyMinutes;
    if (profile.studyPoints !== undefined) current.studyPoints = profile.studyPoints;
    current.updatedAt = Date.now();
    saveProfileData(current);

    if (effectiveUid) {
      try {
        const userDocRef = doc(db, 'users', effectiveUid);
        const updatePayload: Record<string, any> = {
          updatedAt: Date.now()
        };
        if (profile.name !== undefined) updatePayload.name = profile.name;
        if (profile.class !== undefined) updatePayload.class = profile.class;
        if (profile.group !== undefined) updatePayload.group = profile.group;
        if (profile.collegeName !== undefined) updatePayload.collegeName = profile.collegeName;
        if (profile.totalStudyMinutes !== undefined) updatePayload.totalStudyMinutes = profile.totalStudyMinutes;
        if (profile.studyPoints !== undefined) updatePayload.studyPoints = profile.studyPoints;

        await setDoc(userDocRef, updatePayload, { merge: true });
      } catch (err) {
        console.error('Failed to update user profile in Firestore:', err);
        throw err;
      }
    }
    return current;
  },

  async getSyllabusProgress(uid: string): Promise<SyllabusProgress[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (effectiveUid) {
      try {
        const snap = await getDoc(doc(db, 'users', effectiveUid));
        if (snap.exists()) {
          const remoteList = snap.data()?.syllabusProgress;
          if (Array.isArray(remoteList)) {
            const current = getProfileData();
            current.syllabusProgress = remoteList;
            saveProfileData(current);
            return remoteList;
          }
        }
      } catch (e) {
        console.warn('Firestore fetch syllabusProgress failed, falling back to local cache:', e);
      }
    }
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

    await syncFieldToFirestore('syllabusProgress', list, progress.uid);
  },

  async getStudySessions(uid: string): Promise<StudySession[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (effectiveUid) {
      try {
        const snap = await getDoc(doc(db, 'users', effectiveUid));
        if (snap.exists()) {
          const remoteList = snap.data()?.studySessions;
          if (Array.isArray(remoteList)) {
            const current = getProfileData();
            current.studySessions = remoteList;
            saveProfileData(current);
            return remoteList;
          }
        }
      } catch (e) {
        console.warn('Firestore fetch studySessions failed, falling back to local cache:', e);
      }
    }
    const data = getProfileData();
    return data.studySessions || [];
  },

  async saveStudySession(session: StudySession) {
    const data = getProfileData();
    const list = data.studySessions || [];
    list.push(session);
    data.studySessions = list;
    saveProfileData(data);

    await syncFieldToFirestore('studySessions', list, session.uid);
  },

  /**
   * Adds study minutes to the user's totalStudyMinutes in Firestore users/{uid},
   * calculates studyPoints using Math.floor((totalStudyMinutes / 60) * 20),
   * and synchronizes local storage caches immediately.
   */
  async addStudyMinutes(uid: string, minutesToAdd: number): Promise<{ totalStudyMinutes: number; studyPoints: number }> {
    const effectiveUid = getEffectiveUid(uid);
    let currentMinutes = 0;

    if (effectiveUid) {
      try {
        const userDocRef = doc(db, 'users', effectiveUid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.totalStudyMinutes === 'number') {
            currentMinutes = data.totalStudyMinutes;
          } else if (Array.isArray(data.studySessions)) {
            currentMinutes = data.studySessions.reduce((acc: number, s: any) => acc + (Number(s.durationMinutes) || 0), 0);
          }
        }
      } catch (err) {
        console.warn('Failed to query existing totalStudyMinutes from Firestore, falling back:', err);
      }
    }

    if (!currentMinutes) {
      const local = getProfileData();
      currentMinutes = Number(local.totalStudyMinutes) || (
        Array.isArray(local.studySessions)
          ? local.studySessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0)
          : 0
      );
    }

    const newTotalMinutes = Math.max(0, currentMinutes + minutesToAdd);
    const newStudyPoints = calculateStudyPoints(newTotalMinutes);

    // Update in Firestore users/{uid}
    if (effectiveUid) {
      try {
        const userDocRef = doc(db, 'users', effectiveUid);
        await setDoc(userDocRef, {
          totalStudyMinutes: newTotalMinutes,
          studyPoints: newStudyPoints,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to update totalStudyMinutes and studyPoints in Firestore:', err);
      }
    }

    // Update local profile data
    const local = getProfileData();
    local.totalStudyMinutes = newTotalMinutes;
    local.studyPoints = newStudyPoints;
    saveProfileData(local);

    // Update student_user in localStorage if present
    try {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.totalStudyMinutes = newTotalMinutes;
        parsed.studyPoints = newStudyPoints;
        localStorage.setItem('student_user', JSON.stringify(parsed));
      }
    } catch (e) {}

    return { totalStudyMinutes: newTotalMinutes, studyPoints: newStudyPoints };
  },

  /**
   * Retroactive Data Sync Fix:
   * Checks if totalStudyMinutes in the users/{uid} document matches the actual total
   * time from the user's study logs (both Firestore and local storage).
   * If missing, 0, or out of sync, recalculates total minutes, writes totalStudyMinutes,
   * and forcefully recalculates studyPoints using Math.floor((totalStudyMinutes / 60) * 20) in Firestore.
   */
  async syncUserStudyTimeAndPoints(uid: string): Promise<{ totalStudyMinutes: number; studyPoints: number }> {
    const effectiveUid = getEffectiveUid(uid);
    const local = getProfileData();
    const localSessions: StudySession[] = Array.isArray(local.studySessions) ? local.studySessions : [];
    
    let remoteSessions: StudySession[] = [];
    let remoteTotalMinutes = 0;
    let remoteStudyPoints = 0;
    let remoteExists = false;

    if (effectiveUid) {
      try {
        const userDocRef = doc(db, 'users', effectiveUid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          remoteExists = true;
          const data = snap.data();
          if (Array.isArray(data.studySessions)) {
            remoteSessions = data.studySessions;
          }
          if (typeof data.totalStudyMinutes === 'number') {
            remoteTotalMinutes = Math.max(0, data.totalStudyMinutes);
          }
          if (typeof data.studyPoints === 'number') {
            remoteStudyPoints = Math.max(0, data.studyPoints);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user from Firestore in syncUserStudyTimeAndPoints:', err);
      }
    }

    // Merge sessions from local and remote by unique key
    const sessionMap = new Map<string, StudySession>();
    localSessions.forEach((s) => {
      if (s) {
        const key = s.id || `${s.date || 0}_${s.durationMinutes || 0}`;
        sessionMap.set(key, s);
      }
    });
    remoteSessions.forEach((s) => {
      if (s) {
        const key = s.id || `${s.date || 0}_${s.durationMinutes || 0}`;
        sessionMap.set(key, s);
      }
    });
    const mergedSessions = Array.from(sessionMap.values());

    // Calculate actual total study minutes from all logged sessions
    const sessionsTotalMinutes = mergedSessions.reduce((acc, s) => {
      return acc + (Math.max(0, Number(s.durationMinutes)) || 0);
    }, 0);

    const localTotalMinutes = Math.max(0, Number(local.totalStudyMinutes) || 0);

    // True total study minutes is the maximum of session logs, remote record, and local record
    const finalTotalMinutes = Math.max(sessionsTotalMinutes, remoteTotalMinutes, localTotalMinutes);
    const finalStudyPoints = calculateStudyPoints(finalTotalMinutes);

    // If out of sync in Firestore or local
    const needsFirestoreUpdate = !remoteExists || (
      remoteTotalMinutes !== finalTotalMinutes ||
      remoteStudyPoints !== finalStudyPoints ||
      (remoteSessions.length < mergedSessions.length)
    );

    if (effectiveUid && needsFirestoreUpdate) {
      try {
        const userDocRef = doc(db, 'users', effectiveUid);
        await setDoc(userDocRef, {
          totalStudyMinutes: finalTotalMinutes,
          studyPoints: finalStudyPoints,
          studySessions: mergedSessions,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to update synced study time and points in Firestore:', err);
      }
    }

    // Update local cache
    local.studySessions = mergedSessions;
    local.totalStudyMinutes = finalTotalMinutes;
    local.studyPoints = finalStudyPoints;
    saveProfileData(local);

    try {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.totalStudyMinutes = finalTotalMinutes;
        parsed.studyPoints = finalStudyPoints;
        localStorage.setItem('student_user', JSON.stringify(parsed));
      }
    } catch (e) {}

    return { totalStudyMinutes: finalTotalMinutes, studyPoints: finalStudyPoints };
  },

  async getGoals(uid: string): Promise<Goal[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (effectiveUid) {
      try {
        const snap = await getDoc(doc(db, 'users', effectiveUid));
        if (snap.exists()) {
          const remoteList = snap.data()?.goals;
          if (Array.isArray(remoteList)) {
            const current = getProfileData();
            current.goals = remoteList;
            saveProfileData(current);
            return remoteList;
          }
        }
      } catch (e) {
        console.warn('Firestore fetch goals failed, falling back to local cache:', e);
      }
    }
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

    await syncFieldToFirestore('goals', list, goal.uid);
  },

  async deleteGoal(id: string) {
    const data = getProfileData();
    data.goals = (data.goals || []).filter((g: any) => g.id !== id);
    saveProfileData(data);

    await syncFieldToFirestore('goals', data.goals);
  },

  async getExams(uid?: string): Promise<ExamRecord[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) {
      return [];
    }
    try {
      const snap = await getDoc(doc(db, 'users', effectiveUid));
      if (snap.exists()) {
        const remoteList = snap.data()?.exams;
        if (Array.isArray(remoteList)) {
          return [...remoteList].sort((a, b) => (b.date || 0) - (a.date || 0));
        }
      }
      return [];
    } catch (e) {
      console.error('Firestore fetch exams failed:', e);
      return [];
    }
  },

  async saveExam(exam: ExamRecord): Promise<ExamRecord[]> {
    const effectiveUid = getEffectiveUid(exam.uid);
    if (!effectiveUid) {
      console.error('Cannot save exam: User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      const userDocRef = doc(db, 'users', effectiveUid);
      const snap = await getDoc(userDocRef);
      let currentExams: ExamRecord[] = [];

      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.exams)) {
          currentExams = data.exams;
        }
      }

      const index = currentExams.findIndex(e => e.id === exam.id);
      let updatedExams: ExamRecord[];
      if (index >= 0) {
        updatedExams = [...currentExams];
        updatedExams[index] = exam;
      } else {
        updatedExams = [exam, ...currentExams];
      }

      updatedExams.sort((a, b) => (b.date || 0) - (a.date || 0));

      await setDoc(userDocRef, {
        exams: updatedExams,
        updatedAt: Date.now()
      }, { merge: true });

      return updatedExams;
    } catch (error) {
      console.error('Failed to save exam to Firestore:', error);
      throw error;
    }
  },

  async addExam(exam: ExamRecord): Promise<ExamRecord[]> {
    return this.saveExam(exam);
  },

  async deleteExam(id: string, uid?: string): Promise<ExamRecord[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) {
      console.error('Cannot delete exam: User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      const userDocRef = doc(db, 'users', effectiveUid);
      const snap = await getDoc(userDocRef);
      let currentExams: ExamRecord[] = [];

      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.exams)) {
          currentExams = data.exams;
        }
      }

      const updatedExams = currentExams.filter(e => e.id !== id);

      await setDoc(userDocRef, {
        exams: updatedExams,
        updatedAt: Date.now()
      }, { merge: true });

      return updatedExams;
    } catch (error) {
      console.error('Failed to delete exam from Firestore:', error);
      throw error;
    }
  },

  async getCalculatorState() {
    const effectiveUid = getEffectiveUid();
    if (effectiveUid) {
      try {
        const snap = await getDoc(doc(db, 'users', effectiveUid));
        if (snap.exists()) {
          const remoteState = snap.data()?.calculatorState;
          if (remoteState) {
            const current = getProfileData();
            current.calculatorState = remoteState;
            saveProfileData(current);
            return remoteState;
          }
        }
      } catch (e) {
        console.warn('Firestore fetch calculatorState failed, falling back to local cache:', e);
      }
    }
    const data = getProfileData(); 
    return data.calculatorState || null; 
  },

  async saveCalculatorState(state: any) { 
    const data = getProfileData(); 
    data.calculatorState = state; 
    saveProfileData(data);

    await syncFieldToFirestore('calculatorState', state);
  },

  async deleteUserAccountAndData(uid?: string): Promise<void> {
    const effectiveUid = getEffectiveUid(uid);
    localStorage.removeItem('profileData');
    localStorage.removeItem('hsc-tracker-storage');
    localStorage.removeItem('student_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_uid');
    localStorage.removeItem('is_admin');

    if (effectiveUid && effectiveUid !== 'admin-user' && effectiveUid !== 'student-user') {
      try {
        // Clean up studySubjects subcollection
        try {
          const subjectsSnap = await getDocs(collection(db, 'users', effectiveUid, 'studySubjects'));
          for (const sDoc of subjectsSnap.docs) {
            await deleteDoc(sDoc.ref);
          }
        } catch (subErr) {
          console.warn('Could not clean up studySubjects subcollection:', subErr);
        }

        const userDocRef = doc(db, 'users', effectiveUid);
        await deleteDoc(userDocRef);
        console.log(`Successfully deleted user document from Firestore: users/${effectiveUid}`);
      } catch (e) {
        console.error('Failed to delete user document in Firestore:', e);
        throw e;
      }
    }
  },

  async deleteAllUserData() {
    await this.deleteUserAccountAndData();
  },

  // Task 2 & Task 3: Fetch users for Admin Panel (Privacy compliant: ONLY Name, Email, Creation Date, Class)
  async getAdminUsers(): Promise<AdminUserRecord[]> {
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      const userList: AdminUserRecord[] = [];

      snap.forEach((docSnap) => {
        // Skip mock/admin placeholders
        if (docSnap.id === 'admin-user' || docSnap.id === 'student-user') return;
        const data = docSnap.data();

        // Strict privacy rule: ONLY extract Name, Email, Account Creation Date, and Class
        const createdAtVal = typeof data.createdAt === 'number'
          ? data.createdAt
          : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());

        userList.push({
          uid: docSnap.id,
          name: data.name || 'Student',
          email: data.email || 'N/A',
          class: data.class || 'Class 12',
          createdAt: createdAtVal
        });
      });

      return userList.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error('Failed to fetch user list from Firestore:', err);
      return [];
    }
  },

  // Task 1: Submit feedback to Firestore 'feedbacks' collection
  async submitFeedback(data: {
    userId: string;
    userEmail: string;
    message: string;
    category?: string;
  }): Promise<string> {
    try {
      const feedbacksCol = collection(db, 'feedbacks');
      const docRef = await addDoc(feedbacksCol, {
        userId: data.userId,
        userEmail: data.userEmail,
        message: data.message.trim(),
        status: 'unread',
        createdAt: serverTimestamp(),
        category: data.category || 'General'
      });
      return docRef.id;
    } catch (err) {
      console.error('Failed to write to feedbacks collection in Firestore:', err);
      throw err;
    }
  },

  // Task 2: Real-time listener on 'feedbacks' collection ordered by createdAt descending
  subscribeToFeedbacks(
    onData: (feedbacks: FeedbackRecord[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const feedbacksCol = collection(db, 'feedbacks');
    const q = query(feedbacksCol, orderBy('createdAt', 'desc'));

    const mapDocs = (snapshot: any): FeedbackRecord[] => {
      const list: FeedbackRecord[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();
        if (rawCreated?.toMillis) {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated?.seconds) {
          createdAtMs = rawCreated.seconds * 1000;
        } else if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        }

        list.push({
          id: docSnap.id,
          userId: data.userId || data.uid || '',
          userEmail: data.userEmail || data.email || 'Anonymous',
          message: data.message || '',
          status: data.status === 'read' ? 'read' : 'unread',
          createdAt: createdAtMs,
          category: data.category || 'General'
        });
      });
      return list;
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = mapDocs(snapshot);
        onData(list);
      },
      (err) => {
        console.warn('orderBy("createdAt", "desc") query error, falling back to unordered listener:', err);
        // Fallback: listen without orderBy in case any existing document lacks createdAt
        const fallbackUnsub = onSnapshot(
          feedbacksCol,
          (snapshot) => {
            const list = mapDocs(snapshot);
            list.sort((a, b) => b.createdAt - a.createdAt);
            onData(list);
          },
          (fallbackErr) => {
            console.error('Failed to listen to feedbacks collection:', fallbackErr);
            if (onError) onError(fallbackErr);
          }
        );
        return fallbackUnsub;
      }
    );

    return unsubscribe;
  },

  // Update feedback status to read
  async markFeedbackRead(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'feedbacks', id);
      await updateDoc(docRef, { status: 'read' });
    } catch (e) {
      console.error('Failed to update feedback status in Firestore:', e);
      const docRef = doc(db, 'feedbacks', id);
      await setDoc(docRef, { status: 'read' }, { merge: true });
    }
  },

  // Task 5: Study Lab - studySubjects subcollection for users/{uid}/studySubjects
  async addStudySubject(uid: string, data: { name: string; color: string }): Promise<string> {
    try {
      const subCol = collection(db, 'users', uid, 'studySubjects');
      const docRef = await addDoc(subCol, {
        uid,
        name: data.name.trim(),
        color: data.color,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Failed to add study subject in Firestore:', err);
      throw err;
    }
  },

  async deleteStudySubject(uid: string, subjectId: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid, 'studySubjects', subjectId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Failed to delete study subject in Firestore:', err);
      throw err;
    }
  },

  subscribeToStudySubjects(
    uid: string,
    onData: (subjects: StudySubject[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!uid) {
      onData([]);
      return () => {};
    }

    const subCol = collection(db, 'users', uid, 'studySubjects');
    const q = query(subCol, orderBy('createdAt', 'desc'));

    const mapDocs = (snapshot: any): StudySubject[] => {
      const list: StudySubject[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();
        if (rawCreated?.toMillis) {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated?.seconds) {
          createdAtMs = rawCreated.seconds * 1000;
        } else if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        }

        list.push({
          id: docSnap.id,
          uid: data.uid || uid,
          name: data.name || 'Untitled Subject',
          color: data.color || 'purple',
          createdAt: createdAtMs
        });
      });
      return list;
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = mapDocs(snapshot);
        onData(list);
      },
      (err) => {
        console.warn('orderBy("createdAt", "desc") on studySubjects query error, falling back to unordered listener:', err);
        const fallbackUnsub = onSnapshot(
          subCol,
          (snapshot) => {
            const list = mapDocs(snapshot);
            list.sort((a, b) => b.createdAt - a.createdAt);
            onData(list);
          },
          (fallbackErr) => {
            console.error('Failed to listen to studySubjects collection:', fallbackErr);
            if (onError) onError(fallbackErr);
          }
        );
        return fallbackUnsub;
      }
    );

    return unsubscribe;
  },

  // ==================== STUDY HUB (studyResources) ====================
  async addStudyResource(uid: string, data: { platformName: string; url: string }): Promise<string> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) throw new Error('User not authenticated');
    try {
      const subCol = collection(db, 'users', effectiveUid, 'studyResources');
      const docRef = await addDoc(subCol, {
        uid: effectiveUid,
        platformName: data.platformName.trim(),
        url: data.url.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Failed to add study resource in Firestore:', err);
      throw err;
    }
  },

  async updateStudyResource(uid: string, resourceId: string, data: { platformName: string; url: string }): Promise<void> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) throw new Error('User not authenticated');
    try {
      const docRef = doc(db, 'users', effectiveUid, 'studyResources', resourceId);
      await updateDoc(docRef, {
        platformName: data.platformName.trim(),
        url: data.url.trim(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to update study resource in Firestore:', err);
      throw err;
    }
  },

  async deleteStudyResource(uid: string, resourceId: string): Promise<void> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) throw new Error('User not authenticated');
    try {
      const docRef = doc(db, 'users', effectiveUid, 'studyResources', resourceId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Failed to delete study resource in Firestore:', err);
      throw err;
    }
  },

  async getStudyResources(uid: string): Promise<StudyResource[]> {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) return [];
    try {
      const subCol = collection(db, 'users', effectiveUid, 'studyResources');
      const snap = await getDocs(subCol);
      const list: StudyResource[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();
        if (rawCreated?.toMillis) {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated?.seconds) {
          createdAtMs = rawCreated.seconds * 1000;
        } else if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        }

        list.push({
          id: docSnap.id,
          uid: data.uid || effectiveUid,
          platformName: data.platformName || 'Resource',
          url: data.url || '',
          createdAt: createdAtMs,
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : data.updatedAt)
        });
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    } catch (err) {
      console.error('Failed to fetch study resources:', err);
      return [];
    }
  },

  subscribeToStudyResources(
    uid: string,
    onData: (resources: StudyResource[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const effectiveUid = getEffectiveUid(uid);
    if (!effectiveUid) {
      onData([]);
      return () => {};
    }

    const subCol = collection(db, 'users', effectiveUid, 'studyResources');
    const q = query(subCol, orderBy('createdAt', 'desc'));

    const mapDocs = (snapshot: any): StudyResource[] => {
      const list: StudyResource[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();
        if (rawCreated?.toMillis) {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated?.seconds) {
          createdAtMs = rawCreated.seconds * 1000;
        } else if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        }

        list.push({
          id: docSnap.id,
          uid: data.uid || effectiveUid,
          platformName: data.platformName || 'Resource',
          url: data.url || '',
          createdAt: createdAtMs,
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : data.updatedAt)
        });
      });
      return list;
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = mapDocs(snapshot);
        onData(list);
      },
      (err) => {
        console.warn('orderBy("createdAt", "desc") on studyResources query error, falling back to unordered listener:', err);
        const fallbackUnsub = onSnapshot(
          subCol,
          (snapshot) => {
            const list = mapDocs(snapshot);
            list.sort((a, b) => b.createdAt - a.createdAt);
            onData(list);
          },
          (fallbackErr) => {
            console.error('Failed to listen to studyResources collection:', fallbackErr);
            if (onError) onError(fallbackErr);
          }
        );
        return fallbackUnsub;
      }
    );

    return unsubscribe;
  },

  // ==================== DAILY TASKS & MIDNIGHT RESET ====================
  getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async getAndSyncDailyTasks(uid: string): Promise<DailyTasksDoc> {
    if (!uid) {
      return {
        date: this.getTodayDateString(),
        tasks: [],
        history: [],
        updatedAt: Date.now()
      };
    }

    const today = this.getTodayDateString();
    const taskDocRef = doc(db, 'users', uid, 'dailyTasks', 'current');
    
    try {
      const snap = await getDoc(taskDocRef);

      if (!snap.exists()) {
        const initial: DailyTasksDoc = {
          date: today,
          tasks: [],
          history: [],
          updatedAt: Date.now()
        };
        await setDoc(taskDocRef, initial);
        return initial;
      }

      const data = snap.data() as Partial<DailyTasksDoc>;
      const existingDate = data.date || today;

      // Midnight Reset Logic (Lazy Evaluation)
      if (existingDate !== today) {
        const prevTasks = data.tasks || [];
        let newHistory = data.history || [];

        // Archive existing tasks if there are any recorded tasks
        if (prevTasks.length > 0) {
          const completedCount = prevTasks.filter(t => t.isCompleted).length;
          const archivedEntry: DailyTaskHistoryDay = {
            date: existingDate,
            tasks: prevTasks,
            completedCount,
            totalCount: prevTasks.length,
            archivedAt: Date.now()
          };
          // Prepend and keep strictly the last 7 entries
          newHistory = [archivedEntry, ...newHistory.filter(h => h.date !== existingDate)].slice(0, 7);
        }

        const resetDoc: DailyTasksDoc = {
          date: today,
          tasks: [],
          history: newHistory,
          updatedAt: Date.now()
        };

        await setDoc(taskDocRef, resetDoc);
        return resetDoc;
      }

      return {
        date: existingDate,
        tasks: data.tasks || [],
        history: (data.history || []).slice(0, 7),
        updatedAt: data.updatedAt || Date.now()
      };
    } catch (err) {
      console.error('Failed to sync daily tasks with Firestore:', err);
      return {
        date: today,
        tasks: [],
        history: [],
        updatedAt: Date.now()
      };
    }
  },

  async addDailyTask(uid: string, text: string): Promise<DailyTaskItem> {
    if (!uid) throw new Error('User not authenticated');
    const current = await this.getAndSyncDailyTasks(uid);
    const newTask: DailyTaskItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      isCompleted: false,
      createdAt: Date.now()
    };

    const updatedTasks = [...current.tasks, newTask];
    const taskDocRef = doc(db, 'users', uid, 'dailyTasks', 'current');
    await updateDoc(taskDocRef, {
      tasks: updatedTasks,
      updatedAt: Date.now()
    });

    return newTask;
  },

  async toggleDailyTask(uid: string, taskId: string): Promise<void> {
    if (!uid) throw new Error('User not authenticated');
    const current = await this.getAndSyncDailyTasks(uid);
    const updatedTasks = current.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );

    const taskDocRef = doc(db, 'users', uid, 'dailyTasks', 'current');
    await updateDoc(taskDocRef, {
      tasks: updatedTasks,
      updatedAt: Date.now()
    });
  },

  async deleteDailyTask(uid: string, taskId: string): Promise<void> {
    if (!uid) throw new Error('User not authenticated');
    const current = await this.getAndSyncDailyTasks(uid);
    const updatedTasks = current.tasks.filter(t => t.id !== taskId);

    const taskDocRef = doc(db, 'users', uid, 'dailyTasks', 'current');
    await updateDoc(taskDocRef, {
      tasks: updatedTasks,
      updatedAt: Date.now()
    });
  },

  subscribeToDailyTasks(
    uid: string,
    onData: (data: DailyTasksDoc) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!uid) {
      onData({
        date: this.getTodayDateString(),
        tasks: [],
        history: [],
        updatedAt: Date.now()
      });
      return () => {};
    }

    const taskDocRef = doc(db, 'users', uid, 'dailyTasks', 'current');
    return onSnapshot(
      taskDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<DailyTasksDoc>;
          onData({
            date: data.date || this.getTodayDateString(),
            tasks: data.tasks || [],
            history: (data.history || []).slice(0, 7),
            updatedAt: data.updatedAt || Date.now()
          });
        }
      },
      (err) => {
        console.error('Failed to subscribe to dailyTasks:', err);
        if (onError) onError(err);
      }
    );
  },

  // ==================== LEADERBOARD ====================
  async getLeaderboardUsers(): Promise<Array<{
    uid: string;
    name: string;
    collegeName: string;
    class: string;
    group: string;
    email?: string;
    createdAt: number;
    studyPoints: number;
    totalStudyMinutes: number;
  }>> {
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      const userList: Array<{
        uid: string;
        name: string;
        collegeName: string;
        class: string;
        group: string;
        email?: string;
        createdAt: number;
        studyPoints: number;
        totalStudyMinutes: number;
      }> = [];

      snap.forEach((docSnap) => {
        if (docSnap.id === 'admin-user' || docSnap.id === 'student-user') return;
        const data = docSnap.data();

        const rawCreated = data.createdAt;
        let createdAtMs = Date.now();
        if (rawCreated?.toMillis) {
          createdAtMs = rawCreated.toMillis();
        } else if (rawCreated?.seconds) {
          createdAtMs = rawCreated.seconds * 1000;
        } else if (typeof rawCreated === 'number') {
          createdAtMs = rawCreated;
        } else if (typeof data.updatedAt === 'number') {
          createdAtMs = data.updatedAt;
        }

        // Calculate study duration from recorded totalStudyMinutes and studySessions logs
        const recordedMinutes = typeof data.totalStudyMinutes === 'number' ? Math.max(0, data.totalStudyMinutes) : 0;
        const sessionMinutes = Array.isArray(data.studySessions)
          ? data.studySessions.reduce((acc: number, s: any) => acc + (Math.max(0, Number(s.durationMinutes)) || 0), 0)
          : 0;
        const totalMinutes = Math.max(recordedMinutes, sessionMinutes);

        // Strict scoring formula: 60 minutes of study = 20 points
        // Formula: Points = Math.floor((totalStudyMinutes / 60) * 20)
        const points = calculateStudyPoints(totalMinutes);

        userList.push({
          uid: docSnap.id,
          name: data.name || 'HSC Student',
          collegeName: data.collegeName?.trim() || 'College / Institution Not Specified',
          class: data.class || 'Class 12',
          group: data.group || 'Science',
          email: data.email || '',
          createdAt: createdAtMs,
          studyPoints: points,
          totalStudyMinutes: totalMinutes
        });
      });

      // Sort strictly by studyPoints in DESCENDING order (highest points = Rank 1)
      return userList.sort((a, b) => {
        if (b.studyPoints !== a.studyPoints) return b.studyPoints - a.studyPoints;
        if (b.totalStudyMinutes !== a.totalStudyMinutes) return b.totalStudyMinutes - a.totalStudyMinutes;
        return a.createdAt - b.createdAt;
      });
    } catch (err) {
      console.error('Failed to fetch leaderboard users:', err);
      return [];
    }
  },

  subscribeToLeaderboardUsers(
    onData: (users: Array<{
      uid: string;
      name: string;
      collegeName: string;
      class: string;
      group: string;
      email?: string;
      createdAt: number;
      studyPoints: number;
      totalStudyMinutes: number;
    }>) => void,
    onError?: (err: any) => void
  ): () => void {
    const usersCol = collection(db, 'users');
    return onSnapshot(
      usersCol,
      (snap) => {
        const userList: Array<{
          uid: string;
          name: string;
          collegeName: string;
          class: string;
          group: string;
          email?: string;
          createdAt: number;
          studyPoints: number;
          totalStudyMinutes: number;
        }> = [];

        snap.forEach((docSnap) => {
          if (docSnap.id === 'admin-user' || docSnap.id === 'student-user') return;
          const data = docSnap.data();

          const rawCreated = data.createdAt;
          let createdAtMs = Date.now();
          if (rawCreated?.toMillis) {
            createdAtMs = rawCreated.toMillis();
          } else if (rawCreated?.seconds) {
            createdAtMs = rawCreated.seconds * 1000;
          } else if (typeof rawCreated === 'number') {
            createdAtMs = rawCreated;
          } else if (typeof data.updatedAt === 'number') {
            createdAtMs = data.updatedAt;
          }

          // Calculate study duration from recorded totalStudyMinutes and studySessions logs
          const recordedMinutes = typeof data.totalStudyMinutes === 'number' ? Math.max(0, data.totalStudyMinutes) : 0;
          const sessionMinutes = Array.isArray(data.studySessions)
            ? data.studySessions.reduce((acc: number, s: any) => acc + (Math.max(0, Number(s.durationMinutes)) || 0), 0)
            : 0;
          const totalMinutes = Math.max(recordedMinutes, sessionMinutes);

          // Strict scoring formula: 60 minutes = 20 points
          const points = calculateStudyPoints(totalMinutes);

          userList.push({
            uid: docSnap.id,
            name: data.name || 'HSC Student',
            collegeName: data.collegeName?.trim() || 'College / Institution Not Specified',
            class: data.class || 'Class 12',
            group: data.group || 'Science',
            email: data.email || '',
            createdAt: createdAtMs,
            studyPoints: points,
            totalStudyMinutes: totalMinutes
          });
        });

        // Sort strictly by studyPoints in DESCENDING order (highest points = Rank 1)
        userList.sort((a, b) => {
          if (b.studyPoints !== a.studyPoints) return b.studyPoints - a.studyPoints;
          if (b.totalStudyMinutes !== a.totalStudyMinutes) return b.totalStudyMinutes - a.totalStudyMinutes;
          return a.createdAt - b.createdAt;
        });
        onData(userList);
      },
      (err) => {
        console.error('Leaderboard snapshot error:', err);
        if (onError) onError(err);
      }
    );
  },

  // ==================== EVENT TRACKER ====================
  async getEvents(uid: string): Promise<EventItem[]> {
    if (!uid || uid === 'admin-user') {
      try {
        const local = localStorage.getItem('local_events');
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }

    try {
      const eventsCol = collection(db, 'users', uid, 'events');
      const snap = await getDocs(eventsCol);
      const list: EventItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          date: data.date || '',
          time: data.time || undefined,
          location: data.location || undefined,
          notes: data.notes || undefined,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
        });
      });
      localStorage.setItem('local_events', JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('Failed to fetch events from Firestore, using local cache:', err);
      try {
        const local = localStorage.getItem('local_events');
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
  },

  async addEvent(uid: string, eventData: Omit<EventItem, 'id' | 'createdAt'>): Promise<EventItem> {
    const newEvent: EventItem = {
      id: 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: eventData.name.trim(),
      date: eventData.date,
      time: eventData.time?.trim() || undefined,
      location: eventData.location?.trim() || undefined,
      notes: eventData.notes?.trim() || undefined,
      createdAt: Date.now()
    };

    if (uid && uid !== 'admin-user') {
      try {
        const eventsCol = collection(db, 'users', uid, 'events');
        const docRef = await addDoc(eventsCol, {
          name: newEvent.name,
          date: newEvent.date,
          ...(newEvent.time ? { time: newEvent.time } : {}),
          ...(newEvent.location ? { location: newEvent.location } : {}),
          ...(newEvent.notes ? { notes: newEvent.notes } : {}),
          createdAt: newEvent.createdAt
        });
        newEvent.id = docRef.id;
      } catch (err) {
        console.warn('Failed to add event to Firestore, saved locally:', err);
      }
    }

    try {
      const existing = localStorage.getItem('local_events');
      const list: EventItem[] = existing ? JSON.parse(existing) : [];
      list.push(newEvent);
      localStorage.setItem('local_events', JSON.stringify(list));
    } catch (e) {}

    return newEvent;
  },

  async deleteEvent(uid: string, eventId: string): Promise<void> {
    if (uid && uid !== 'admin-user') {
      try {
        const eventDocRef = doc(db, 'users', uid, 'events', eventId);
        await deleteDoc(eventDocRef);
      } catch (err) {
        console.warn('Failed to delete event from Firestore:', err);
      }
    }

    try {
      const existing = localStorage.getItem('local_events');
      if (existing) {
        const list: EventItem[] = JSON.parse(existing);
        const filtered = list.filter(e => e.id !== eventId);
        localStorage.setItem('local_events', JSON.stringify(filtered));
      }
    } catch (e) {}
  },

  subscribeToEvents(
    uid: string,
    onData: (events: EventItem[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!uid || uid === 'admin-user') {
      try {
        const local = localStorage.getItem('local_events');
        onData(local ? JSON.parse(local) : []);
      } catch (e) {
        onData([]);
      }
      return () => {};
    }

    const eventsCol = collection(db, 'users', uid, 'events');
    return onSnapshot(
      eventsCol,
      (snap) => {
        const list: EventItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            date: data.date || '',
            time: data.time || undefined,
            location: data.location || undefined,
            notes: data.notes || undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
          });
        });
        localStorage.setItem('local_events', JSON.stringify(list));
        onData(list);
      },
      (err) => {
        console.error('Events subscription error:', err);
        try {
          const local = localStorage.getItem('local_events');
          if (local) onData(JSON.parse(local));
        } catch (e) {}
        if (onError) onError(err);
      }
    );
  }
};

export const dbService = dbApi;

