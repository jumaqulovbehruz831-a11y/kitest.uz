export const ADMIN_EMAIL = 'jumaqulovbehruz831@gmail.com';

export type UserRole = 'admin' | 'creator' | 'user';

export type Difficulty = 'Oson' | "O'rta" | 'Qiyin' | 'Olimpiada';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  rating: number;
  ratingTitle: string;
  rank: number;
  solvedCount: number;
  submissionsCount: number;
  totalScore: number;
  bio: string;
  region: string;
  institution: string;
  telegram?: string;
  createdAt: string;
  isBanned?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}

export interface TestItem {
  id: string;
  numericId: number;
  title: string;
  subject: string;
  difficulty: Difficulty;
  description: string;
  durationMinutes: number;
  passingPercent: number;
  shuffleQuestions: boolean;
  showExplanations: boolean;
  questions: QuizQuestion[];
  totalPoints: number;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  totalAttempts: number;
  passedAttempts: number;
  acceptanceRate: number;
  contestId?: string;
}

export interface QuestionResultItem {
  questionId: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  explanation?: string;
}

export interface Submission {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  userId: string;
  userName: string;
  username: string;
  earnedPoints: number;
  maxPoints: number;
  percentage: number;
  grade: string;
  verdict: 'Accepted' | 'Failed' | 'Disqualified';
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  warningsCount: number;
  submittedReason: 'manual' | 'timeout' | 'anticheat' | 'zoom_exit';
  addedPoints?: number;
  submittedAt: string;
  questionResults: QuestionResultItem[];
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: 'upcoming' | 'active' | 'finished';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  testIds: string[];
  registeredUserIds: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
}
