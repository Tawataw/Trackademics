import { SubjectConfig } from '../types';

export const COMMON_SUBJECTS: SubjectConfig[] = [
  {
    id: 'bangla',
    name: 'Bangla',
    isPractical: false,
    papers: [
      { name: '1st Paper', components: { cq: 70, mcq: 30 } },
      { name: '2nd Paper', components: { written: 100 } },
    ],
  },
  {
    id: 'english',
    name: 'English',
    isPractical: false,
    papers: [
      { name: '1st Paper', components: { written: 100 } },
      { name: '2nd Paper', components: { written: 100 } },
    ],
  },
  {
    id: 'ict',
    name: 'ICT',
    isPractical: true,
    papers: [
      { name: 'Paper', components: { cq: 50, mcq: 25, practical: 25 } },
    ],
  },
];

const sciPaper = { components: { cq: 50, mcq: 25, practical: 25 } };
const sciPapers = [
  { name: '1st Paper', ...sciPaper },
  { name: '2nd Paper', ...sciPaper },
];

export const SCIENCE_SUBJECTS: SubjectConfig[] = [
  { id: 'physics', name: 'Physics', isPractical: true, papers: sciPapers },
  { id: 'chemistry', name: 'Chemistry', isPractical: true, papers: sciPapers },
  { id: 'biology', name: 'Biology', isPractical: true, papers: sciPapers },
  { id: 'higher_math', name: 'Higher Mathematics', isPractical: true, papers: sciPapers },
];

const comPaper = { components: { cq: 70, mcq: 30 } };
const comPapers = [
  { name: '1st Paper', ...comPaper },
  { name: '2nd Paper', ...comPaper },
];

export const COMMERCE_SUBJECTS: SubjectConfig[] = [
  { id: 'accounting', name: 'Accounting', isPractical: false, papers: comPapers },
  { id: 'management', name: 'Management', isPractical: false, papers: comPapers },
  { id: 'finance', name: 'Finance, Banking & Insurance', isPractical: false, papers: comPapers },
  { id: 'production', name: 'Production Management & Marketing', isPractical: false, papers: comPapers },
];

export const COMMERCE_OPTIONAL_SUBJECTS: SubjectConfig[] = [
  { id: 'economics', name: 'Economics', isPractical: false, papers: comPapers },
  { id: 'statistics', name: 'Statistics', isPractical: true, papers: sciPapers },
  { id: 'geography', name: 'Geography', isPractical: true, papers: sciPapers },
  { id: 'home_science', name: 'Home Science', isPractical: true, papers: sciPapers },
];

export const ARTS_MAIN_SUBJECTS: SubjectConfig[] = [
  { id: 'civics', name: 'Civics & Good Governance', isPractical: false, papers: comPapers },
  { id: 'sociology', name: 'Sociology', isPractical: false, papers: comPapers },
  { id: 'social_work', name: 'Social Work', isPractical: false, papers: comPapers },
  { id: 'history', name: 'History', isPractical: false, papers: comPapers },
  { id: 'islamic_history', name: 'Islamic History & Culture', isPractical: false, papers: comPapers },
  { id: 'economics_arts', name: 'Economics', isPractical: false, papers: comPapers },
  { id: 'logic', name: 'Logic', isPractical: false, papers: comPapers },
  { id: 'islamic_studies', name: 'Islamic Studies', isPractical: false, papers: comPapers },
];

export const ARTS_OPTIONAL_SUBJECTS: SubjectConfig[] = [
  { id: 'geography_arts', name: 'Geography', isPractical: true, papers: sciPapers },
  { id: 'psychology', name: 'Psychology', isPractical: true, papers: sciPapers },
  { id: 'home_science_arts', name: 'Home Science', isPractical: true, papers: sciPapers },
];
