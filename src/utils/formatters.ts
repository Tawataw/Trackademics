import { GroupType } from '../types';

export function normalizeClass(c?: string): '11' | '12' | 'HSC Candidate' | '' {
  if (!c) return '';
  const trimmed = c.trim();
  if (trimmed === '11' || trimmed === 'Class 11') return '11';
  if (trimmed === '12' || trimmed === 'Class 12') return '12';
  if (trimmed.toLowerCase().includes('candidate')) return 'HSC Candidate';
  return '';
}

export function formatClassName(c?: string): string {
  if (!c) return 'Class 12';
  const trimmed = c.trim();
  if (trimmed === '11' || trimmed === 'Class 11') return 'Class 11';
  if (trimmed === '12' || trimmed === 'Class 12') return 'Class 12';
  if (trimmed.toLowerCase().includes('candidate')) return 'HSC Candidate';
  return trimmed;
}

export function normalizeGroup(g?: string): GroupType {
  if (!g) return 'SCIENCE';
  const upper = g.trim().toUpperCase();
  if (upper === 'COMMERCE') return 'COMMERCE';
  if (upper === 'ARTS') return 'ARTS';
  return 'SCIENCE';
}

export function formatGroupName(g?: string): string {
  if (!g) return 'Science';
  const upper = g.trim().toUpperCase();
  if (upper === 'COMMERCE') return 'Commerce';
  if (upper === 'ARTS') return 'Arts';
  return 'Science';
}
