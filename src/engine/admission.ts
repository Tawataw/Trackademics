import { SubjectResult } from '../types';

export interface AdmissionParams {
  group: 'SCIENCE' | 'HUMANITIES' | 'COMMERCE' | 'ARTS';
  sscGpa: number;
  sscGpaNo4th: number;
  hscOverallResult: {
    finalGpa: number;
    mainSubjectsGpaSum: number;
    mainSubjectsCount: number;
  };
  hscSubjectResults: SubjectResult[];
  sscSubjectGpas?: {
    math?: number;
    physics?: number;
    chemistry?: number;
  };
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
}

interface Condition {
  passed: boolean;
  en: string;
  bn: string;
}

const helpers = {
  group: (allowed: string[], current: string): Condition => {
    const isAllowed = allowed.includes(current) || (current === 'ARTS' && allowed.includes('HUMANITIES'));
    return {
      passed: isAllowed,
      en: `Group requirement: ${allowed.join(', ')} - ${isAllowed ? 'satisfied' : 'not satisfied'}. Selected: ${current}`,
      bn: `বিভাগীয় যোগ্যতা: ${allowed.join(', ')} — ${isAllowed ? 'সন্তুষ্ট' : 'সন্তুষ্ট নয়'}`,
    };
  },
  totalGpa: (min: number, current: number, inc4th: boolean): Condition => ({
    passed: current >= min,
    en: `Combined GPA ${inc4th ? 'including' : 'excluding'} 4th subject: ${current.toFixed(2)}, required minimum ${min.toFixed(2)}`,
    bn: `৪র্থ বিষয় ${inc4th ? 'সহ' : 'ছাড়া'} মোট জিপিএ: ${current.toFixed(2)}, ন্যূনতম প্রয়োজন ${min.toFixed(2)}`,
  }),
  indivGpa: (minSsc: number, minHsc: number, curSsc: number, curHsc: number, inc4th: boolean): Condition => ({
    passed: curSsc >= minSsc && curHsc >= minHsc,
    en: `SSC GPA (${curSsc.toFixed(2)}) ≥ ${minSsc.toFixed(2)} & HSC GPA (${curHsc.toFixed(2)}) ≥ ${minHsc.toFixed(2)} ${inc4th ? 'including' : 'excluding'} 4th subject`,
    bn: `এসএসসি জিপিএ (${curSsc.toFixed(2)}) ≥ ${minSsc.toFixed(2)} ও এইচএসসি জিপিএ (${curHsc.toFixed(2)}) ≥ ${minHsc.toFixed(2)} ৪র্থ বিষয় ${inc4th ? 'সহ' : 'ছাড়া'}`,
  }),
  subj: (results: SubjectResult[], keywords: string[], minGpa: number, nameEn: string): Condition => {
    const found = results.find(r => keywords.some(kw => r.id.toLowerCase().includes(kw.toLowerCase())));
    if (!found) {
      return { passed: false, en: `Required subject missing or not entered: ${nameEn}`, bn: `আবশ্যক বিষয় দেওয়া হয়নি: ${nameEn}` };
    }
    return {
      passed: found.gpa >= minGpa,
      en: `HSC ${nameEn} GPA: ${found.gpa.toFixed(2)}, required minimum: ${minGpa.toFixed(2)}`,
      bn: `এইচএসসি ${nameEn} জিপিএ: ${found.gpa.toFixed(2)}, ন্যূনতম প্রয়োজন: ${minGpa.toFixed(2)}`
    };
  },
  subjGrade: (results: SubjectResult[], keywords: string[], minGrade: string, nameEn: string): Condition => {
    const grades = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];
    const minIndex = grades.indexOf(minGrade);
    
    const found = results.find(r => keywords.some(kw => r.id.toLowerCase().includes(kw.toLowerCase())));
    if (!found) {
      return { passed: false, en: `Required subject missing or not entered: ${nameEn}`, bn: `আবশ্যক বিষয় দেওয়া হয়নি: ${nameEn}` };
    }
    const curIndex = grades.indexOf(found.grade);
    const passed = curIndex >= 0 && curIndex <= minIndex;
    return {
      passed,
      en: `HSC ${nameEn} Grade: ${found.grade}, required minimum: ${minGrade}`,
      bn: `এইচএসসি ${nameEn} গ্রেড: ${found.grade}, ন্যূনতম প্রয়োজন: ${minGrade}`
    };
  }
};

const ROUTES = [
  // MEDICAL & DENTAL
  {
    id: "med",
    university: "Medical & Dental",
    unit: "Medical & Dental",
    category: "Medical & Dental",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(8.50, p.sscGpa + p.hscOverallResult.finalGpa, true),
        helpers.subj(p.hscSubjectResults, ["bio"], 3.50, "Biology")
      ];
    },
  },
  {
    id: "afmc",
    university: "AFMC / AMC / Navy Medical",
    unit: "AFMC / AMC / Navy Medical",
    category: "Medical & Dental",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(8.50, p.sscGpa + p.hscOverallResult.finalGpa, true),
        helpers.subj(p.hscSubjectResults, ["bio"], 3.50, "Biology")
      ];
    },
  },

  // ENGINEERING & TECHNOLOGY
  {
    id: "buet",
    university: "BUET",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      
      const sscMath = p.sscSubjectGpas?.math || 0;
      const sscPhys = p.sscSubjectGpas?.physics || 0;
      const sscChem = p.sscSubjectGpas?.chemistry || 0;
      const hasSscSubjects = sscMath >= 1.0 && sscPhys >= 1.0 && sscChem >= 1.0;

      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        { passed: hasSscSubjects, en: "Must have passed Mathematics, Physics and Chemistry in SSC", bn: "এসএসসিতে গণিত, পদার্থ ও রসায়ন থাকতে হবে" },
        { passed: p.hscOverallResult.finalGpa >= 5.00, en: "HSC minimum GPA 5.00 required", bn: "এইচএসসি ন্যূনতম জিপিএ ৫.০০ প্রয়োজন" },
        helpers.subj(p.hscSubjectResults, ["math"], 5.00, "Higher Mathematics"),
        helpers.subj(p.hscSubjectResults, ["phys"], 5.00, "Physics"),
        helpers.subj(p.hscSubjectResults, ["chem"], 5.00, "Chemistry")
      ];
    },
  },
  {
    id: "ruet",
    university: "RUET",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      const m = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("math"))?.gpa || 0;
      const ph = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("phys"))?.gpa || 0;
      const ch = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("chem"))?.gpa || 0;
      const sum = m + ph + ch;
      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        { passed: sum >= 14.00, en: `HSC Math + Physics + Chemistry GPA sum: ${sum.toFixed(2)}, required minimum 14.00`, bn: `এইচএসসি গণিত + পদার্থ + রসায়ন জিপিএ যোগফল: ${sum.toFixed(2)}, ন্যূনতম ১৪.০০` }
      ];
    },
  },
  {
    id: "kuet",
    university: "KUET",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      const m = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("math"))?.gpa || 0;
      const ph = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("phys"))?.gpa || 0;
      const ch = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("chem"))?.gpa || 0;
      const eng = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("eng"))?.gpa || 0;
      const sum = m + ph + ch + eng;
      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        helpers.subj(p.hscSubjectResults, ["math"], 4.00, "Higher Mathematics"),
        helpers.subj(p.hscSubjectResults, ["phys"], 4.00, "Physics"),
        helpers.subj(p.hscSubjectResults, ["chem"], 4.00, "Chemistry"),
        { passed: sum >= 18.00, en: `HSC Math+Phy+Chem+Eng GPA sum: ${sum.toFixed(2)}, required minimum 18.00`, bn: `এইচএসসি গণিত+পদার্থ+রসায়ন+ইংরেজি জিপিএ যোগফল: ${sum.toFixed(2)}, ন্যূনতম ১৮.০০` }
      ];
    },
  },
  {
    id: "cuet",
    university: "CUET",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      const m = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("math"))?.gpa || 0;
      const ph = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("phys"))?.gpa || 0;
      const ch = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("chem"))?.gpa || 0;
      const sum = m + ph + ch;
      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        { passed: sum >= 14.00, en: `HSC Math + Physics + Chemistry GPA sum: ${sum.toFixed(2)}, required minimum 14.00`, bn: `এইচএসসি গণিত + পদার্থ + রসায়ন জিপিএ যোগফল: ${sum.toFixed(2)}, ন্যূনতম ১৪.০০` },
        helpers.subjGrade(p.hscSubjectResults, ["eng"], "B", "English")
      ];
    },
  },
  {
    id: "butex",
    university: "BUTEX",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      const m = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("math"))?.gpa || 0;
      const ph = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("phys"))?.gpa || 0;
      const ch = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("chem"))?.gpa || 0;
      const eng = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("eng"))?.gpa || 0;
      const sum = m + ph + ch + eng;
      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 4.00, en: "HSC minimum GPA 4.00 required", bn: "এইচএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        helpers.subj(p.hscSubjectResults, ["math"], 3.50, "Higher Mathematics"),
        helpers.subj(p.hscSubjectResults, ["phys"], 3.50, "Physics"),
        helpers.subj(p.hscSubjectResults, ["chem"], 3.50, "Chemistry"),
        helpers.subj(p.hscSubjectResults, ["eng"], 3.50, "English"),
        { passed: sum >= 17.50, en: `HSC Math+Phy+Chem+Eng GPA sum: ${sum.toFixed(2)}, required minimum 17.50`, bn: `এইচএসসি গণিত+পদার্থ+রসায়ন+ইংরেজি জিপিএ যোগফল: ${sum.toFixed(2)}, ন্যূনতম ১৭.৫০` }
      ];
    },
  },
  {
    id: "iut",
    university: "IUT",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 4.50, en: "SSC minimum GPA 4.50 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.৫০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 4.50, en: "HSC minimum GPA 4.50 required", bn: "এইচএসসি ন্যূনতম জিপিএ ৪.৫০ প্রয়োজন" },
        helpers.subjGrade(p.hscSubjectResults, ["math"], "A+", "Higher Mathematics"),
        helpers.subjGrade(p.hscSubjectResults, ["phys"], "A+", "Physics"),
        helpers.subjGrade(p.hscSubjectResults, ["chem"], "A+", "Chemistry"),
        helpers.subjGrade(p.hscSubjectResults, ["eng"], "A", "English")
      ];
    },
  },
  {
    id: "mist",
    university: "MIST",
    unit: "Engineering",
    category: "Engineering & Technology",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      const m = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("math"))?.gpa || 0;
      const ph = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("phys"))?.gpa || 0;
      const ch = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("chem"))?.gpa || 0;
      const eng = p.hscSubjectResults.find(r => r.id.toLowerCase().includes("eng"))?.gpa || 0;
      const sum = m + ph + ch + eng;
      return [
        g,
        { passed: p.sscGpaNo4th >= 4.00, en: `SSC GPA excluding 4th subject: ${p.sscGpaNo4th.toFixed(2)}, required minimum 4.00`, bn: `এসএসসি ৪র্থ বিষয় ছাড়া জিপিএ: ${p.sscGpaNo4th.toFixed(2)}, ন্যূনতম ৪.০০ প্রয়োজন` },
        helpers.subj(p.hscSubjectResults, ["math"], 4.00, "Mathematics"),
        helpers.subj(p.hscSubjectResults, ["phys"], 4.00, "Physics"),
        helpers.subj(p.hscSubjectResults, ["chem"], 4.00, "Chemistry"),
        { passed: sum >= 18.00, en: `HSC Math+Phy+Chem+Eng GPA sum: ${sum.toFixed(2)}, required minimum 18.00`, bn: `এইচএসসি গণিত+পদার্থ+রসায়ন+ইংরেজি জিপিএ যোগফল: ${sum.toFixed(2)}, ন্যূনতম ১৮.০০` }
      ];
    },
  },

  // SCIENCE / A-TYPE
  {
    id: "sust_a",
    university: "SUST",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true),
        helpers.subj(p.hscSubjectResults, ["math"], 3.00, "Mathematics")
      ];
    },
  },
  {
    id: "du_ka",
    university: "DU",
    unit: "KA Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ju_a",
    university: "JU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(4.00, 4.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(8.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ju_d",
    university: "JU",
    unit: "D Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(4.00, 4.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(9.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "jnu_a",
    university: "JnU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.25, 3.25, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ru_c",
    university: "RU",
    unit: "C Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cu_a",
    university: "CU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 4.00, en: "SSC minimum GPA 4.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৪.০০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 3.00, en: "HSC minimum GPA 3.00 required", bn: "এইচএসসি ন্যূনতম জিপিএ ৩.০০ প্রয়োজন" },
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "bup_fst",
    university: "BUP",
    unit: "FST",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(9.00, p.sscGpa + p.hscOverallResult.finalGpa, true),
        helpers.subjGrade(p.hscSubjectResults, ["phys"], "A", "Physics"),
        helpers.subjGrade(p.hscSubjectResults, ["chem"], "A", "Chemistry"),
        helpers.subjGrade(p.hscSubjectResults, ["bio"], "A", "Biology"),
        helpers.subjGrade(p.hscSubjectResults, ["eng"], "A-", "English")
      ];
    },
  },
  {
    id: "gst_a",
    university: "GST Cluster",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.25, 3.25, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ku_a",
    university: "KU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ku_b",
    university: "KU",
    unit: "B Unit",
    category: "Science / A-Type Units", 
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cou_a",
    university: "CoU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "agri",
    university: "Agriculture Cluster",
    unit: "Admission",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      
      const hscNo4th = (p.hscOverallResult.mainSubjectsGpaSum) / (p.hscOverallResult.mainSubjectsCount || 1);
      
      const hasSubjects = ["bio", "chem", "phys", "math"].every(sub => p.hscSubjectResults.some(r => r.id.toLowerCase().includes(sub) && r.gpa >= 1.0));
      
      return [
        g,
        { passed: hasSubjects, en: "Must have passed Biology, Chemistry, Physics and Math", bn: "জীববিজ্ঞান, রসায়ন, পদার্থবিজ্ঞান ও গণিত বিষয়সহ উত্তীর্ণ হতে হবে" },
        helpers.indivGpa(4.00, 4.00, p.sscGpaNo4th, hscNo4th, false),
        helpers.totalGpa(8.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "hstu_b",
    university: "HSTU",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "hstu_a",
    university: "HSTU",
    unit: "A Unit",
    category: "Science / A-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },

  // GENERAL / B-TYPE
  {
    id: "du_kha",
    university: "DU",
    unit: "KHA Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ju_b",
    university: "JU",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ju_c",
    university: "JU",
    unit: "C Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.50, 3.50, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "jnu_b",
    university: "JnU",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "jnu_d",
    university: "JnU",
    unit: "D Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ru_a",
    university: "RU",
    unit: "A Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(7.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cu_b",
    university: "CU",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 3.00, en: "SSC minimum GPA 3.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৩.০০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 2.50, en: "HSC minimum GPA 2.50 required", bn: "এইচএসসি ন্যূনতম জিপিএ ২.৫০ প্রয়োজন" },
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cu_b1",
    university: "CU",
    unit: "B1 Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 3.00, en: "SSC minimum GPA 3.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৩.০০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 2.50, en: "HSC minimum GPA 2.50 required", bn: "এইচএসসি ন্যূনতম জিপিএ ২.৫০ প্রয়োজন" },
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cu_b2",
    university: "CU",
    unit: "B2 Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 3.00, en: "SSC minimum GPA 3.00 required", bn: "এসএসসি ন্যূনতম জিপিএ ৩.০০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 2.50, en: "HSC minimum GPA 2.50 required", bn: "এইচএসসি ন্যূনতম জিপিএ ২.৫০ প্রয়োজন" },
        helpers.totalGpa(6.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cu_d",
    university: "CU",
    unit: "D Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        { passed: p.sscGpa >= 3.50, en: "SSC minimum GPA 3.50 required", bn: "এসএসসি ন্যূনতম জিপিএ ৩.৫০ প্রয়োজন" },
        { passed: p.hscOverallResult.finalGpa >= 3.00, en: "HSC minimum GPA 3.00 required", bn: "এইচএসসি ন্যূনতম জিপিএ ৩.০০ প্রয়োজন" },
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "bup_fass",
    university: "BUP",
    unit: "FASS",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(7.50, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "bup_fsss",
    university: "BUP",
    unit: "FSSS",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(8.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "gst_b",
    university: "GST Cluster",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "ku_c",
    university: "KU",
    unit: "C Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.totalGpa(7.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "sust_b",
    university: "SUST",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "cou_b",
    university: "CoU",
    unit: "B Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  },
  {
    id: "hstu_d",
    university: "HSTU",
    unit: "D Unit",
    category: "General / B-Type Units",
    evaluate: (p: AdmissionParams) => {
      const g = helpers.group(["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"], p.group);
      if (!g.passed) return [g];
      return [
        g,
        helpers.indivGpa(3.00, 3.00, p.sscGpa, p.hscOverallResult.finalGpa, true),
        helpers.totalGpa(6.00, p.sscGpa + p.hscOverallResult.finalGpa, true)
      ];
    },
  }
];

export function checkAdmissionEligibility(
  params: AdmissionParams
): EligibilityResult[] {
  const results: EligibilityResult[] = [];
  
  for (const route of ROUTES) {
    const conditions = route.evaluate(params);
    const isEligible = conditions.every((c) => c.passed);
    
    results.push({
      university: route.university,
      unit: route.unit,
      category: route.category,
      isEligible,
      reasons: conditions.map((c) => ({
        passed: c.passed,
        textEn: c.en,
        textBn: c.bn,
      })),
    });
  }
  
  return results;
}
