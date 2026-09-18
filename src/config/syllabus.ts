export type SyllabusChapter = {
  id: string;
  name: string;
  paper?: '1st' | '2nd';
  isNumeric?: boolean;
  maxCount?: number;
};

export type CountBasedSyllabus = {
  type: 'count';
  totalItems: number;
  itemName: string;
};

export type ChapterBasedSyllabus = {
  type: 'chapters';
  chapters: SyllabusChapter[];
};

export type SyllabusSubjectConfig = {
  id: string;
  name: string;
  group: 'COMMON' | 'SCIENCE' | 'COMMERCE' | 'ARTS';
  paper1: CountBasedSyllabus | ChapterBasedSyllabus;
  paper2?: CountBasedSyllabus | ChapterBasedSyllabus;
};

export const SYLLABUS_DATA: SyllabusSubjectConfig[] = [
  {
    id: 'ict',
    name: 'ICT',
    group: 'COMMON',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ict_1', name: '১. তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত' },
        { id: 'ict_2', name: '২. কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং' },
        { id: 'ict_3', name: '৩. সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস' },
        { id: 'ict_4', name: '৪. ওয়েব ডিজাইন পরিচিতি এবং HTML' },
        { id: 'ict_5', name: '৫. প্রোগ্রামিং ভাষা (C)' },
        { id: 'ict_6', name: '৬. ডেটাবেজ ম্যানেজমেন্ট সিস্টেম' }
      ]
    }
  },
  {
    id: 'bangla',
    name: 'Bangla',
    group: 'COMMON',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'bn1_1', name: 'NCTB Prose: 12', isNumeric: true, maxCount: 12 },
        { id: 'bn1_2', name: 'NCTB Poetry: 12', isNumeric: true, maxCount: 12 },
        { id: 'bn1_3', name: 'লালসালু' },
        { id: 'bn1_4', name: 'সিরাজউদ্দৌলা' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'bn2_g1', name: 'বাংলা উচ্চারণের নিয়ম' },
        { id: 'bn2_g2', name: 'বাংলা বানানের নিয়ম' },
        { id: 'bn2_g3', name: 'বাংলা ভাষার ব্যাকরণিক শব্দশ্রেণি' },
        { id: 'bn2_g4', name: 'বাংলা শব্দগঠন (উপসর্গ ও সমাস)' },
        { id: 'bn2_g5', name: 'বাক্যতত্ত্ব' },
        { id: 'bn2_g6', name: 'বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ' },
        { id: 'bn2_c1', name: 'পারিভাষিক শব্দ ও অনুবাদ' },
        { id: 'bn2_c2', name: 'দিনলিপি লিখন ও অভিজ্ঞতা বর্ণন' },
        { id: 'bn2_c3', name: 'প্রতিবেদন রচনা' },
        { id: 'bn2_c4', name: 'বৈদ্যুতিন চিঠি ও খুদে বার্তা' },
        { id: 'bn2_c5', name: 'সারাংশ, সারমর্ম ও ভাবসম্প্রসারণ' },
        { id: 'bn2_c6', name: 'সংলাপ রচনা ও খুদে গল্প রচনা' },
        { id: 'bn2_c7', name: 'প্রবন্ধ রচনা' }
      ]
    }
  },
  {
    id: 'english',
    name: 'English',
    group: 'COMMON',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'en1_1', name: 'Reading Units: 1–15', isNumeric: true, maxCount: 15 },
        { id: 'en1_w1', name: 'Paragraph' },
        { id: 'en1_w2', name: 'Completing Story' },
        { id: 'en1_w3', name: 'Informal Letter/Email' },
        { id: 'en1_w4', name: 'Maps/Graphs/Charts' },
        { id: 'en1_w5', name: 'Theme Writing' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'en2_g1', name: 'Articles' },
        { id: 'en2_g2', name: 'Prepositions' },
        { id: 'en2_g3', name: 'Special uses of some phrases/words' },
        { id: 'en2_g4', name: 'Completing sentences' },
        { id: 'en2_g5', name: 'Right forms of verbs' },
        { id: 'en2_g6', name: 'Changing sentences' },
        { id: 'en2_g7', name: 'Narrative style' },
        { id: 'en2_g8', name: 'Pronoun reference' },
        { id: 'en2_g9', name: 'Modifiers' },
        { id: 'en2_g10', name: 'Sentence connectors' },
        { id: 'en2_g11', name: 'Synonym and Antonym' },
        { id: 'en2_g12', name: 'Punctuation' },
        { id: 'en2_c1', name: 'Formal Letter/Email' },
        { id: 'en2_c2', name: 'Report writing for newspapers' },
        { id: 'en2_c3', name: 'Paragraph writing (Listing/Description)' },
        { id: 'en2_c4', name: 'Short composition' }
      ]
    }
  },
  {
    id: 'physics',
    name: 'Physics',
    group: 'SCIENCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'p1_1', name: '1. Physical World and Measurement' },
        { id: 'p1_2', name: '2. Vector' },
        { id: 'p1_3', name: '3. Dynamics' },
        { id: 'p1_4', name: '4. Newtonian Mechanics' },
        { id: 'p1_5', name: '5. Work, Energy and Power' },
        { id: 'p1_6', name: '6. Gravitation and Gravity' },
        { id: 'p1_7', name: '7. Structural Properties of Matter' },
        { id: 'p1_8', name: '8. Periodic Motion' },
        { id: 'p1_9', name: '9. Waves' },
        { id: 'p1_10', name: '10. Ideal Gas and Kinetic Theory of Gases' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'p2_1', name: '1. Thermodynamics' },
        { id: 'p2_2', name: '2. Static Electricity' },
        { id: 'p2_3', name: '3. Current Electricity' },
        { id: 'p2_4', name: '4. Magnetic Effect of Electric Current and Magnetism' },
        { id: 'p2_5', name: '5. Electromagnetic Induction and Alternating Current' },
        { id: 'p2_6', name: '6. Geometrical Optics' },
        { id: 'p2_7', name: '7. Physical Optics' },
        { id: 'p2_8', name: '8. Introduction to Modern Physics' },
        { id: 'p2_9', name: '9. Atomic Model and Nuclear Physics' },
        { id: 'p2_10', name: '10. Semiconductor and Electronics' },
        { id: 'p2_11', name: '11. Astronomy' }
      ]
    }
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    group: 'SCIENCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'c1_1', name: '1. Safe Use of Laboratory' },
        { id: 'c1_2', name: '2. Qualitative Chemistry' },
        { id: 'c1_3', name: '3. Periodic Properties and Chemical Bonding' },
        { id: 'c1_4', name: '4. Chemical Changes' },
        { id: 'c1_5', name: '5. Economic/Vocational Chemistry' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'c2_1', name: '1. Environmental Chemistry' },
        { id: 'c2_2', name: '2. Organic Chemistry' },
        { id: 'c2_3', name: '3. Quantitative Chemistry' },
        { id: 'c2_4', name: '4. Electrochemistry' },
        { id: 'c2_5', name: '5. Economic Chemistry' }
      ]
    }
  },
  {
    id: 'higher_math',
    name: 'Higher Mathematics',
    group: 'SCIENCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'hm1_1', name: '1. Matrices and Determinants' },
        { id: 'hm1_2', name: '2. Vectors' },
        { id: 'hm1_3', name: '3. Straight Lines' },
        { id: 'hm1_4', name: '4. Circles' },
        { id: 'hm1_5', name: '5. Permutations and Combinations' },
        { id: 'hm1_6', name: '6. Trigonometric Ratios' },
        { id: 'hm1_7', name: '7. Associated Angles Trigonometric Ratios' },
        { id: 'hm1_8', name: '8. Function and Graph of Function' },
        { id: 'hm1_9', name: '9. Differentiation' },
        { id: 'hm1_10', name: '10. Integration' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'hm2_1', name: '1. Real Numbers and Inequalities' },
        { id: 'hm2_2', name: '2. Linear Programming' },
        { id: 'hm2_3', name: '3. Complex Numbers' },
        { id: 'hm2_4', name: '4. Polynomials and Polynomial Equations' },
        { id: 'hm2_5', name: '5. Binomial Expansion' },
        { id: 'hm2_6', name: '6. Conics' },
        { id: 'hm2_7', name: '7. Inverse Trigonometric Functions and Equations' },
        { id: 'hm2_8', name: '8. Statics' },
        { id: 'hm2_9', name: '9. Dynamics' },
        { id: 'hm2_10', name: '10. Measure of Dispersion and Probability' }
      ]
    }
  },
  {
    id: 'biology',
    name: 'Biology',
    group: 'SCIENCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'b1_1', name: '1. Cell and its Structure' },
        { id: 'b1_2', name: '2. Cell Division' },
        { id: 'b1_3', name: '3. Cell Chemistry' },
        { id: 'b1_4', name: '4. Microorganisms' },
        { id: 'b1_5', name: '5. Algae and Fungi' },
        { id: 'b1_6', name: '6. Bryophyta and Pteridophyta' },
        { id: 'b1_7', name: '7. Gymnosperms and Angiosperms' },
        { id: 'b1_8', name: '8. Tissue and Tissue System' },
        { id: 'b1_9', name: '9. Plant Physiology' },
        { id: 'b1_10', name: '10. Plant Reproduction' },
        { id: 'b1_11', name: '11. Biotechnology' },
        { id: 'b1_12', name: '12. Organisms and Environment' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'b2_1', name: '1. Animal Diversity and Classification' },
        { id: 'b2_2', name: '2. Introduction to Animal (Hydra, grasshopper, rohu)' },
        { id: 'b2_3', name: '3. Human Physiology: Digestion and Absorption' },
        { id: 'b2_4', name: '4. Blood and Circulation' },
        { id: 'b2_5', name: '5. Breathing and Respiration' },
        { id: 'b2_6', name: '6. Waste and Excretion' },
        { id: 'b2_7', name: '7. Locomotion and Movement' },
        { id: 'b2_8', name: '8. Coordination and Control' },
        { id: 'b2_9', name: '9. Continuity of Human Life' },
        { id: 'b2_10', name: '10. Immunity' },
        { id: 'b2_11', name: '11. Genetics and Evolution' },
        { id: 'b2_12', name: '12. Animal Behaviour' }
      ]
    }
  },
  {
    id: 'accounting',
    name: 'Accounting',
    group: 'COMMERCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ac1_1', name: '1. Introduction to Accounting' },
        { id: 'ac1_2', name: '2. Books of Accounts' },
        { id: 'ac1_3', name: '3. Bank Reconciliation Statement' },
        { id: 'ac1_4', name: '4. Trial Balance' },
        { id: 'ac1_5', name: '5. Principles of Accounting' },
        { id: 'ac1_6', name: '6. Accounting for Receivables' },
        { id: 'ac1_7', name: '7. Work Sheet' },
        { id: 'ac1_8', name: '8. Accounting for Tangible and Intangible Assets' },
        { id: 'ac1_9', name: '9. Financial Statements' },
        { id: 'ac1_10', name: '10. Single Entry System' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'ac2_1', name: '1. Accounts of Non-Trading Concerns' },
        { id: 'ac2_2', name: '2. Accounts of Partnership Business' },
        { id: 'ac2_3', name: '3. Cash Flow Statement' },
        { id: 'ac2_4', name: '4. Capital of Joint Stock Company' },
        { id: 'ac2_5', name: '5. Financial Statement of Joint Stock Company' },
        { id: 'ac2_6', name: '6. Financial Statement Analysis' },
        { id: 'ac2_7', name: '7. Cost Accounting' },
        { id: 'ac2_8', name: '8. Wage and Salary' },
        { id: 'ac2_9', name: '9. Cost and Classification of Cost' },
        { id: 'ac2_10', name: '10. Introduction to Management Accounting' }
      ]
    }
  },
  {
    id: 'bom',
    name: 'Business Organization & Management',
    group: 'COMMERCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'bo1_1', name: '1. Basic Concept of Business' },
        { id: 'bo1_2', name: '2. Business Environment' },
        { id: 'bo1_3', name: '3. Sole Proprietorship Business' },
        { id: 'bo1_4', name: '4. Partnership Business' },
        { id: 'bo1_5', name: '5. Joint Stock Business' },
        { id: 'bo1_6', name: '6. Co-operative Society' },
        { id: 'bo1_7', name: '7. State Enterprise' },
        { id: 'bo1_8', name: '8. Legal Aspects of Business' },
        { id: 'bo1_9', name: '9. Supportive Services' },
        { id: 'bo1_10', name: '10. Business Entrepreneurship' },
        { id: 'bo1_11', name: '11. Business Ethics and Social Responsibility' },
        { id: 'bo1_12', name: '12. Biographies of Successful Entrepreneurs' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'bo2_1', name: '1. Concept of Management' },
        { id: 'bo2_2', name: '2. Principles of Management' },
        { id: 'bo2_3', name: '3. Planning and Decision Making' },
        { id: 'bo2_4', name: '4. Organizing' },
        { id: 'bo2_5', name: '5. Staffing' },
        { id: 'bo2_6', name: '6. Leadership' },
        { id: 'bo2_7', name: '7. Motivation' },
        { id: 'bo2_8', name: '8. Communication' },
        { id: 'bo2_9', name: '9. Coordination' },
        { id: 'bo2_10', name: '10. Controlling' }
      ]
    }
  },
  {
    id: 'finance',
    name: 'Finance, Banking & Insurance',
    group: 'COMMERCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'fb1_1', name: '1. Introduction to Finance' },
        { id: 'fb1_2', name: '2. Legal Aspects of Financial Markets' },
        { id: 'fb1_3', name: '3. Time Value of Money' },
        { id: 'fb1_4', name: '4. Financial Analysis' },
        { id: 'fb1_5', name: '5. Short and Medium Term Financing' },
        { id: 'fb1_6', name: '6. Long Term Financing' },
        { id: 'fb1_7', name: '7. Cost of Capital' },
        { id: 'fb1_8', name: '8. Capital Budgeting and Investment Decision' },
        { id: 'fb1_9', name: '9. Risk and Return' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'fb2_1', name: '1. Basic Concept of Banking System' },
        { id: 'fb2_2', name: '2. Central Bank' },
        { id: 'fb2_3', name: '3. Commercial Bank' },
        { id: 'fb2_4', name: '4. Bank Account' },
        { id: 'fb2_5', name: '5. Negotiable Instruments' },
        { id: 'fb2_6', name: '6. Cheque' },
        { id: 'fb2_7', name: '7. Sources and Uses of Bank Funds' },
        { id: 'fb2_8', name: '8. Foreign Exchange and Foreign Currency' },
        { id: 'fb2_9', name: '9. Electronic and Modern Banking' },
        { id: 'fb2_10', name: '10. Basic Concept of Insurance' },
        { id: 'fb2_11', name: '11. Life Insurance' },
        { id: 'fb2_12', name: '12. Marine Insurance' },
        { id: 'fb2_13', name: '13. Fire Insurance' },
        { id: 'fb2_14', name: '14. Miscellaneous Insurance' }
      ]
    }
  },
  {
    id: 'production',
    name: 'Production Management & Marketing',
    group: 'COMMERCE',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'pm1_1', name: '1. Production' },
        { id: 'pm1_2', name: '2. Factors of Production' },
        { id: 'pm1_3', name: '3. Scale of Production' },
        { id: 'pm1_4', name: '4. Production at Macro Level' },
        { id: 'pm1_5', name: '5. Production Management' },
        { id: 'pm1_6', name: '6. Product Design' },
        { id: 'pm1_7', name: '7. Quality Management' },
        { id: 'pm1_8', name: '8. Production Capacity' },
        { id: 'pm1_9', name: '9. Business Location' },
        { id: 'pm1_10', name: '10. Layout' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'pm2_1', name: '1. Introduction to Marketing' },
        { id: 'pm2_2', name: '2. Marketing Environment' },
        { id: 'pm2_3', name: '3. Marketing Functions' },
        { id: 'pm2_4', name: '4. Market Segmentation and Marketing Mix' },
        { id: 'pm2_5', name: '5. Product and Pricing' },
        { id: 'pm2_6', name: '6. Channels of Distribution' },
        { id: 'pm2_7', name: '7. Wholesaling and Retailing' },
        { id: 'pm2_8', name: '8. Sales Promotion and Advertising' },
        { id: 'pm2_9', name: '9. Personal Selling' },
        { id: 'pm2_10', name: '10. Contemporary Issues in Marketing' }
      ]
    }
  },
  {
    id: 'economics',
    name: 'Economics',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ec1_1', name: '1. Basic Economic Problems and Solutions' },
        { id: 'ec1_2', name: '2. Consumer and Producer Behavior' },
        { id: 'ec1_3', name: '3. Production, Production Cost and Revenue' },
        { id: 'ec1_4', name: '4. Market' },
        { id: 'ec1_5', name: '5. Labour Market' },
        { id: 'ec1_6', name: '6. Capital' },
        { id: 'ec1_7', name: '7. Organization' },
        { id: 'ec1_8', name: '8. Rent' },
        { id: 'ec1_9', name: '9. Macroeconomic Income and Expenditure' },
        { id: 'ec1_10', name: '10. Money and Bank' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'ec2_1', name: '1. Introduction to Bangladesh Economy' },
        { id: 'ec2_2', name: '2. Agriculture of Bangladesh' },
        { id: 'ec2_3', name: '3. Industry of Bangladesh' },
        { id: 'ec2_4', name: '4. Population, Human Resources and Self-employment' },
        { id: 'ec2_5', name: '5. Food Security' },
        { id: 'ec2_6', name: '6. Financing' },
        { id: 'ec2_7', name: '7. Inflation' },
        { id: 'ec2_8', name: '8. International Trade' },
        { id: 'ec2_9', name: '9. Public Finance' },
        { id: 'ec2_10', name: '10. Development Planning' }
      ]
    }
  },
  {
    id: 'civics',
    name: 'Civics & Good Governance',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ci1_1', name: '1. Introduction' },
        { id: 'ci1_2', name: '2. Good Governance' },
        { id: 'ci1_3', name: '3. Values/Law/Liberty/Equality' },
        { id: 'ci1_4', name: '4. E-Governance' },
        { id: 'ci1_5', name: '5. Civil Rights/Duties/Human Rights' },
        { id: 'ci1_6', name: '6. Political Party/Leadership' },
        { id: 'ci1_7', name: '7. Government Structure/Organs' },
        { id: 'ci1_8', name: '8. Public Opinion/Political Culture' },
        { id: 'ci1_9', name: '9. Public Service/Bureaucracy' },
        { id: 'ci1_10', name: '10. Patriotism/Nationality' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'ci2_1', name: '1. Development of Representative Government in British India' },
        { id: 'ci2_2', name: '2. Pakistan to Bangladesh 1947–1971' },
        { id: 'ci2_3', name: '3. Political Personalities: Independence of Bangladesh' },
        { id: 'ci2_4', name: '4. Constitution of Bangladesh' },
        { id: 'ci2_5', name: '5. Government and Administrative Structure' },
        { id: 'ci2_6', name: '6. Local Government' },
        { id: 'ci2_7', name: '7. Constitutional Bodies' },
        { id: 'ci2_8', name: '8. Electoral System' },
        { id: 'ci2_9', name: '9. Foreign Policy' },
        { id: 'ci2_10', name: '10. Civil Problems and Duties' }
      ]
    }
  },
  {
    id: 'islamic_history',
    name: 'Islamic History & Culture',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ih1_1', name: '1. Pre-Islamic Arabia' },
        { id: 'ih1_2', name: '2. Hazrat Muhammad SAW' },
        { id: 'ih1_3', name: '3. Khulafa-e-Rashidun' },
        { id: 'ih1_4', name: '4. Umayyad Caliphate' },
        { id: 'ih1_5', name: '5. Abbasid Caliphate' },
        { id: 'ih1_6', name: '6. Umayyad Rule in Spain' },
        { id: 'ih1_7', name: '7. Fatimid Caliphate in North Africa' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'ih2_1', name: '1. Establishment of Muslim Rule in India' },
        { id: 'ih2_2', name: '2. Delhi Sultanate' },
        { id: 'ih2_3', name: '3. Mughal Rule in Indian Subcontinent' },
        { id: 'ih2_4', name: '4. Independent Sultanate Period in Bengal' },
        { id: 'ih2_5', name: '5. Mughal Rule in Bengal' },
        { id: 'ih2_6', name: '6. Emergence of Independent Bangladesh' }
      ]
    }
  },
  {
    id: 'sociology',
    name: 'Sociology',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'so1_1', name: '1. Origin and Development of Sociology' },
        { id: 'so1_2', name: '2. Scientific Status' },
        { id: 'so1_3', name: '3. Theories/Contributions' },
        { id: 'so1_4', name: '4. Basic Concepts' },
        { id: 'so1_5', name: '5. Social Institutions' },
        { id: 'so1_6', name: '6. Social Life/Social Process' },
        { id: 'so1_7', name: '7. Socialization' },
        { id: 'so1_8', name: '8. Social Stratification/Inequality' },
        { id: 'so1_9', name: '9. Social System' },
        { id: 'so1_10', name: '10. Deviance/Crime' },
        { id: 'so1_11', name: '11. Social Change' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'so2_1', name: '1. Practice of Sociology in Bangladesh' },
        { id: 'so2_2', name: '2. Society and Culture of Bangladesh' },
        { id: 'so2_3', name: '3. Society based on Archaeology' },
        { id: 'so2_4', name: '4. Ethnic Minorities' },
        { id: 'so2_5', name: '5. Social Context of Emergence of Bangladesh' },
        { id: 'so2_6', name: '6. Rural and Urban Society' },
        { id: 'so2_7', name: '7. Family/Kinship/Marriage' },
        { id: 'so2_8', name: '8. Social Change' },
        { id: 'so2_9', name: '9. Social Problems' },
        { id: 'so2_10', name: '10. Social Development' }
      ]
    }
  },
  {
    id: 'geography',
    name: 'Geography',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'ge1_1', name: '1. Physical Geography' },
        { id: 'ge1_2', name: '2. Structure of Earth' },
        { id: 'ge1_3', name: '3. Modification of Landforms' },
        { id: 'ge1_4', name: '4. Atmosphere' },
        { id: 'ge1_5', name: '5. Climatic Zones' },
        { id: 'ge1_6', name: '6. Hydrosphere' },
        { id: 'ge1_7', name: '7. Ocean Currents and Tides' },
        { id: 'ge1_8', name: '8. Biosphere' },
        { id: 'ge1_9', name: '9. Practical Geography' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'ge2_1', name: '1. Human Geography' },
        { id: 'ge2_2', name: '2. Population' },
        { id: 'ge2_3', name: '3. Settlement' },
        { id: 'ge2_4', name: '4. Agriculture' },
        { id: 'ge2_5', name: '5. Mineral and Power Resources' },
        { id: 'ge2_6', name: '6. Industry' },
        { id: 'ge2_7', name: '7. Transport and Communication' },
        { id: 'ge2_8', name: '8. Trade' },
        { id: 'ge2_9', name: '9. Disaster and Management' },
        { id: 'ge2_10', name: '10. Practical Geography' }
      ]
    }
  },
  {
    id: 'logic',
    name: 'Logic',
    group: 'ARTS',
    paper1: {
      type: 'chapters',
      chapters: [
        { id: 'lo1_1', name: '1. Introduction to Logic' },
        { id: 'lo1_2', name: '2. Applied Aspects' },
        { id: 'lo1_3', name: '3. Elements of Argument' },
        { id: 'lo1_4', name: '4. Predicables' },
        { id: 'lo1_5', name: '5. Inference' },
        { id: 'lo1_6', name: '6. Deductive Inference' },
        { id: 'lo1_7', name: '7. Inductive Inference' },
        { id: 'lo1_8', name: '8. Symbolic Logic' }
      ]
    },
    paper2: {
      type: 'chapters',
      chapters: [
        { id: 'lo2_1', name: '1. Logical Definition' },
        { id: 'lo2_2', name: '2. Logical Division' },
        { id: 'lo2_3', name: '3. Types of Induction' },
        { id: 'lo2_4', name: '4. Hypothesis' },
        { id: 'lo2_5', name: '5. Methods of Proving Causal Relation' },
        { id: 'lo2_6', name: '6. Explanation' },
        { id: 'lo2_7', name: '7. Classification' },
        { id: 'lo2_8', name: '8. Probability' }
      ]
    }
  }
];

export const getChapterProgressInfo = (
  chap: SyllabusChapter,
  currProg: { completedItems?: string[]; numericCounts?: Record<string, number> } | undefined
) => {
  if (chap.isNumeric && chap.maxCount) {
    const max = chap.maxCount;
    let count = 0;
    if (currProg?.numericCounts && typeof currProg.numericCounts[chap.id] === 'number') {
      count = currProg.numericCounts[chap.id];
    } else if (currProg?.completedItems?.includes(chap.id)) {
      count = max;
    }
    count = Math.max(0, Math.min(max, count));
    const ratio = count / max;
    return {
      isNumeric: true,
      count,
      max,
      ratio,
      isChecked: count === max
    };
  }

  const isChecked = Boolean(currProg?.completedItems?.includes(chap.id));
  return {
    isNumeric: false,
    count: isChecked ? 1 : 0,
    max: 1,
    ratio: isChecked ? 1 : 0,
    isChecked
  };
};

export const calculatePaperProgress = (
  paperConfig: ChapterBasedSyllabus | CountBasedSyllabus | undefined,
  currProg: { completedItems?: string[]; numericCounts?: Record<string, number> } | undefined
) => {
  if (!paperConfig) return { completed: 0, total: 0 };
  if (paperConfig.type === 'chapters') {
    const total = paperConfig.chapters.length;
    let completed = 0;
    paperConfig.chapters.forEach(chap => {
      completed += getChapterProgressInfo(chap, currProg).ratio;
    });
    return { completed, total };
  } else {
    const total = paperConfig.totalItems;
    const completed = currProg?.completedItems ? currProg.completedItems.length : 0;
    return { completed, total };
  }
};

export const calculateOverallSyllabusProgress = (
  group: string | undefined,
  progressInput: Array<{ id?: string; uid?: string; subject?: string; paper?: string; completedItems?: string[]; numericCounts?: Record<string, number>; completedCount?: number }> | Record<string, any>,
  uid?: string
) => {
  const effectiveGroup = group || 'SCIENCE';
  const relevantSubjects = SYLLABUS_DATA.filter(s => s.group === 'COMMON' || s.group === effectiveGroup);

  const pMap: Record<string, any> = {};
  if (Array.isArray(progressInput)) {
    progressInput.forEach(p => {
      if (p.id) pMap[p.id] = p;
      if (p.subject && p.paper) {
        pMap[`${p.subject}_${p.paper}`] = p;
        if (p.uid) pMap[`${p.uid}_${p.subject}_${p.paper}`] = p;
      }
    });
  } else if (progressInput && typeof progressInput === 'object') {
    Object.entries(progressInput).forEach(([k, v]) => {
      pMap[k] = v;
      if (v && typeof v === 'object' && v.subject && v.paper) {
        pMap[`${v.subject}_${v.paper}`] = v;
        if (v.uid) pMap[`${v.uid}_${v.subject}_${v.paper}`] = v;
      }
    });
  }

  let overallCompleted = 0;
  let overallTotal = 0;

  relevantSubjects.forEach(s => {
    if (s.paper1) {
      const prog = (uid ? pMap[`${uid}_${s.id}_paper1`] : null) || pMap[`${s.id}_paper1`];
      const p1Calc = calculatePaperProgress(s.paper1, prog);
      overallTotal += p1Calc.total;
      overallCompleted += p1Calc.completed;
    }
    if (s.paper2) {
      const prog = (uid ? pMap[`${uid}_${s.id}_paper2`] : null) || pMap[`${s.id}_paper2`];
      const p2Calc = calculatePaperProgress(s.paper2, prog);
      overallTotal += p2Calc.total;
      overallCompleted += p2Calc.completed;
    }
  });

  const percent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;
  return {
    overallCompleted,
    overallTotal,
    percent
  };
};
