import { create } from 'zustand';
import { dbApi } from '../lib/db';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GroupType, MarksState, SubjectResult, OverallResult, SubjectConfig, Language } from '../types';
import { COMMON_SUBJECTS, SCIENCE_SUBJECTS, COMMERCE_SUBJECTS, COMMERCE_OPTIONAL_SUBJECTS, ARTS_MAIN_SUBJECTS, ARTS_OPTIONAL_SUBJECTS } from '../config/subjects';
import { calculatePaperTotal, calculateSubjectTotal, calculateGradeAndGPA, calculateOptionalBonus } from '../engine/calculator';

interface TrackerState {
  language: Language;
  group: GroupType;
  mainSubjects: string[];
  optionalSubject: string | null;
  marks: MarksState;
  targetGpa: number | null;
  
  setLanguage: (lang: Language) => void;
  setGroup: (group: GroupType) => void;
  setMainSubjects: (subjects: string[]) => void;
  setOptionalSubject: (subject: string | null) => void;
  setMarks: (subjectId: string, paper: 'paper1' | 'paper2', component: string, value: number) => void;
  setTargetGpa: (gpa: number | null) => void;
  resetAll: () => void;
  getAvailableMainSubjects: () => SubjectConfig[];
  getAvailableOptionalSubjects: () => SubjectConfig[];
  getResults: () => { subjectResults: SubjectResult[], overallResult: OverallResult };
}

const initialState = {
  language: 'EN' as Language,
  group: 'SCIENCE' as GroupType,
  mainSubjects: [] as string[],
  optionalSubject: null,
  marks: {},
  targetGpa: null,
};

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setLanguage: (language) => set({ language }),
      setGroup: (group) => set({ group, mainSubjects: [], optionalSubject: null, marks: {} }),

      
      setMainSubjects: (subjects) => set({ mainSubjects: subjects }),
      
      setOptionalSubject: (subject) => set({ optionalSubject: subject }),
      
      setMarks: (subjectId, paper, component, value) => set((state) => {
        const newMarks = { ...state.marks };
        if (!newMarks[subjectId]) newMarks[subjectId] = {};
        if (!newMarks[subjectId][paper]) newMarks[subjectId][paper] = {};
        newMarks[subjectId][paper] = { ...newMarks[subjectId][paper], [component]: value };
        return { marks: newMarks };
      }),

      setTargetGpa: (gpa) => set({ targetGpa: gpa }),

      resetAll: () => set(initialState),

      getAvailableMainSubjects: () => {
        const { group } = get();
        if (group === 'SCIENCE') return SCIENCE_SUBJECTS;
        if (group === 'COMMERCE') return COMMERCE_SUBJECTS;
        return ARTS_MAIN_SUBJECTS;
      },

      getAvailableOptionalSubjects: () => {
        const { group, mainSubjects } = get();
        if (group === 'SCIENCE') return SCIENCE_SUBJECTS.filter(s => !mainSubjects.includes(s.id));
        if (group === 'COMMERCE') return [...COMMERCE_SUBJECTS, ...COMMERCE_OPTIONAL_SUBJECTS].filter(s => !mainSubjects.includes(s.id));
        return [...ARTS_MAIN_SUBJECTS, ...ARTS_OPTIONAL_SUBJECTS].filter(s => !mainSubjects.includes(s.id));
      },

      getResults: () => {
        const { group, mainSubjects, optionalSubject, marks } = get();
        
        const allMainSubjectConfigs = [...COMMON_SUBJECTS];
        const availableMain = get().getAvailableMainSubjects();
        mainSubjects.forEach(id => {
          const conf = availableMain.find(s => s.id === id);
          if (conf) allMainSubjectConfigs.push(conf);
        });

        const availableOptional = get().getAvailableOptionalSubjects();
        const optionalConf = optionalSubject ? availableOptional.find(s => s.id === optionalSubject) : null;

        const subjectResults: SubjectResult[] = [];
        let totalMarks = 0;
        let maxMarksTotal = 0;
        let mainGpaSum = 0;
        const failedSubjects: string[] = [];

        // Calculate Main Subjects
        allMainSubjectConfigs.forEach(conf => {
          const sMarks = marks[conf.id] || {};
          const p1Total = calculatePaperTotal(sMarks.paper1);
          const p2Total = calculatePaperTotal(sMarks.paper2);
          const sTotal = calculateSubjectTotal(p1Total, p2Total);
          
          let maxMarks = 200;
          let evaluationTotal = sTotal;
          if (conf.id === 'ict') {
             maxMarks = 100;
             evaluationTotal = sTotal * 2;
          }
          
          const gradeInfo = calculateGradeAndGPA(evaluationTotal);
          if (gradeInfo.gpa === 0) {
            failedSubjects.push(conf.name);
          }
          
          mainGpaSum += gradeInfo.gpa;
          totalMarks += sTotal;
          maxMarksTotal += maxMarks;

          subjectResults.push({
            id: conf.id,
            name: conf.name,
            totalMarks: sTotal,
            maxMarks,
            percentage: (sTotal / maxMarks) * 100,
            grade: gradeInfo.grade,
            gpa: gradeInfo.gpa,
            paper1Total: conf.papers.length > 0 ? p1Total : undefined,
            paper2Total: conf.papers.length > 1 ? p2Total : undefined,
            paper1Max: conf.papers.length > 0 ? 100 : undefined,
            paper2Max: conf.papers.length > 1 ? 100 : undefined,
          });
        });

        // Calculate Optional Subject
        let optionalSubjectGpa = 0;
        let optionalBonus = 0;
        if (optionalConf) {
          const sMarks = marks[optionalConf.id] || {};
          const p1Total = calculatePaperTotal(sMarks.paper1);
          const p2Total = calculatePaperTotal(sMarks.paper2);
          const sTotal = calculateSubjectTotal(p1Total, p2Total);
          
          const gradeInfo = calculateGradeAndGPA(sTotal);
          optionalSubjectGpa = gradeInfo.gpa;
          optionalBonus = calculateOptionalBonus(optionalSubjectGpa);
          
          totalMarks += sTotal;
          maxMarksTotal += 200;

          subjectResults.push({
            id: optionalConf.id,
            name: `${optionalConf.name} (Optional)`,
            totalMarks: sTotal,
            maxMarks: 200,
            percentage: (sTotal / 200) * 100,
            grade: gradeInfo.grade,
            gpa: gradeInfo.gpa,
            paper1Total: p1Total,
            paper2Total: p2Total,
            paper1Max: 100,
            paper2Max: 100,
          });
        }

        const finalGpaRaw = (mainGpaSum + optionalBonus) / 6;
        const finalGpa = Math.min(finalGpaRaw, 5.00);
        const isPass = failedSubjects.length === 0;

        return {
          subjectResults,
          overallResult: {
            totalMarks,
            maxMarks: maxMarksTotal,
            percentage: maxMarksTotal > 0 ? (totalMarks / maxMarksTotal) * 100 : 0,
            mainSubjectsGpaSum: mainGpaSum,
            mainSubjectsCount: 6,
            optionalSubjectGpa,
            optionalBonus,
            finalGpa: isPass ? finalGpa : 0,
            isPass,
            failedSubjects
          }
        };
      }
    }),
    {
      name: 'hsc-tracker-storage',
      storage: createJSONStorage(() => {
        let timeout: any;
        return {
          getItem: async (name) => {
            try {
              const state = await dbApi.getCalculatorState();
              if (state) return JSON.stringify({ state, version: 0 });
            } catch (e) {}
            return localStorage.getItem(name);
          },
          setItem: (name, value) => {
            localStorage.setItem(name, value);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              try {
                const parsed = JSON.parse(value);
                dbApi.saveCalculatorState(parsed.state);
              } catch (e) {}
            }, 2000);
          },
          removeItem: (name) => localStorage.removeItem(name)
        };
      })
    }
  )
);
