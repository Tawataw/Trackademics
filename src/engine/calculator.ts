import { GradeResult, PaperMarks } from '../types';

export function calculateGradeAndGPA(marks200: number): GradeResult {
  if (marks200 >= 160) return { grade: 'A+', gpa: 5.00 };
  if (marks200 >= 140) return { grade: 'A', gpa: 4.00 };
  if (marks200 >= 120) return { grade: 'A-', gpa: 3.50 };
  if (marks200 >= 100) return { grade: 'B', gpa: 3.00 };
  if (marks200 >= 80) return { grade: 'C', gpa: 2.00 };
  if (marks200 >= 66) return { grade: 'D', gpa: 1.00 };
  return { grade: 'F', gpa: 0.00 };
}

export function calculatePaperTotal(marks?: PaperMarks): number {
  if (!marks) return 0;
  return (marks.cq || 0) + (marks.mcq || 0) + (marks.practical || 0) + (marks.written || 0);
}

export function calculateSubjectTotal(paper1Total: number, paper2Total: number = 0): number {
  return paper1Total + paper2Total;
}

export function calculateOptionalBonus(gpa: number): number {
  return Math.max(gpa - 2.00, 0);
}

export function getMarksNeededForNextGrade(marks200: number): { nextGrade: string, needed: number } {
  if (marks200 >= 160) return { nextGrade: 'A+', needed: 0 };
  if (marks200 >= 140) return { nextGrade: 'A+', needed: 160 - marks200 };
  if (marks200 >= 120) return { nextGrade: 'A', needed: 140 - marks200 };
  if (marks200 >= 100) return { nextGrade: 'A-', needed: 120 - marks200 };
  if (marks200 >= 80) return { nextGrade: 'B', needed: 100 - marks200 };
  if (marks200 >= 66) return { nextGrade: 'C', needed: 80 - marks200 };
  return { nextGrade: 'D', needed: 66 - marks200 };
}
