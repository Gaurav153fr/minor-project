// Student Profile localStorage Store

import { StudentProfile, SemesterProfile, CSVTU_CSE_SEMESTERS } from '@/types/profile';

const PROFILE_KEY = 'studygenius_profile';

export function getProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === 'undefined') return;
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('studygenius-profile-updated'));
}

export function deleteProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event('studygenius-profile-updated'));
}

export function isOnboardingComplete(): boolean {
  const profile = getProfile();
  return profile?.onboardingComplete === true;
}

export function getActiveSemester(profile: StudentProfile): SemesterProfile | undefined {
  return profile.semesters.find(s => s.number === profile.currentSemester);
}

export function buildStudentContext(profile: StudentProfile): string {
  const sem = getActiveSemester(profile);
  const subjectNames = sem?.subjects.map(s => s.name).join(', ') || 'Not specified';
  return [
    `Student: ${profile.name}`,
    `University: ${profile.university}`,
    `Program: ${profile.degree} in ${profile.branch}`,
    `Current Semester: ${profile.currentSemester}`,
    `Active Subjects: ${subjectNames}`,
    sem?.syllabusText ? `Syllabus Highlights: ${sem.syllabusText.slice(0, 500)}` : '',
  ].filter(Boolean).join('\n');
}

export function createDefaultProfile(
  name: string,
  university: string,
  degree: string,
  branch: string,
  currentSemester: number
): StudentProfile {
  // Clone default semesters and set status
  const semesters: SemesterProfile[] = CSVTU_CSE_SEMESTERS.map(s => ({
    ...s,
    subjects: s.subjects.map(sub => ({ ...sub, units: [...sub.units] })),
    status: s.number < currentSemester ? 'completed' : s.number === currentSemester ? 'active' : 'upcoming',
  }));

  return {
    name,
    university,
    degree,
    branch,
    currentSemester,
    onboardingComplete: false,
    semesters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
