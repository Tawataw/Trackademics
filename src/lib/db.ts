import { db, auth } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

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

export interface UserProfileData {
  name?: string;
  class?: string;
  group?: string;
  email?: string;
  uid?: string;
  createdAt?: number;
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
  async syncLocalDataToFirestore(uid: string, initialProfile?: { name?: string; email?: string; class?: string; group?: string; createdAt?: number }) {
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
        const resolvedCreatedAt = remote.createdAt || initialProfile?.createdAt || remote.updatedAt || Date.now();

        const updatedLocal: UserProfileData = {
          ...localData,
          name: resolvedName,
          class: resolvedClass,
          group: resolvedGroup,
          email: resolvedEmail,
          createdAt: resolvedCreatedAt,
          uid,
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
          updatedAt: Date.now(),
          ...(resolvedClass ? { class: resolvedClass } : {}),
          ...(resolvedGroup ? { group: resolvedGroup } : {}),
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
        const initialData: UserProfileData = {
          uid,
          name: initialProfile?.name || 'Student',
          email: initialProfile?.email || '',
          class: initialClass,
          group: initialGroup,
          createdAt: initialCreatedAt,
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
          updatedAt: Date.now(),
          exams: [],
          syllabusProgress: [],
          studySessions: [],
          goals: []
        };
        if (initialClass) firestorePayload.class = initialClass;
        if (initialGroup) firestorePayload.group = initialGroup;

        await setDoc(userDocRef, firestorePayload, { merge: true });
        saveProfileData(initialData);
        return initialData;
      }
    } catch (err) {
      console.warn('Could not sync with Firestore during login, using local data:', err);
      return getProfileData();
    }
  },

  async updateUserProfile(uid: string, profile: { name?: string; class?: string; group?: string }): Promise<UserProfileData> {
    const effectiveUid = getEffectiveUid(uid);
    const current = getProfileData();
    if (profile.name !== undefined) current.name = profile.name;
    if (profile.class !== undefined) current.class = profile.class;
    if (profile.group !== undefined) current.group = profile.group;
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
  }
};
