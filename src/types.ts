export const ADMIN_EMAIL = 'jumaqulovbehruz831@gmail.com';
export const OFFICIAL_YOUTUBE_URL = 'https://www.youtube.com/@FC_UZB-67b';
export const FOUNDER_PORTRAIT_URL = '';

export const WHEEL_PRIZE_VALUES = [10, 20, 5, 15, 25, 60, 30, 35] as const;

export type RankClass = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export const RANK_CLASS_LIST: RankClass[] = [
  'F',
  'E',
  'D',
  'C',
  'B',
  'A',
  'S',
  'SS',
  'SSS',
];

export const RANK_CLASS_META: Record<
  RankClass,
  { title: string; colorClass: string; bgClass: string }
> = {
  F: {
    title: 'Boshlovchi',
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-800/80 border-slate-700',
  },
  E: {
    title: 'Shogird',
    colorClass: 'text-zinc-200',
    bgClass: 'bg-zinc-800/80 border-zinc-600',
  },
  D: {
    title: 'Izlanuvchi',
    colorClass: 'text-emerald-300',
    bgClass: 'bg-emerald-950/60 border-emerald-500/40',
  },
  C: {
    title: 'Bilimdon',
    colorClass: 'text-teal-300',
    bgClass: 'bg-teal-950/60 border-teal-500/40',
  },
  B: {
    title: 'Tajribali',
    colorClass: 'text-sky-300',
    bgClass: 'bg-sky-950/60 border-sky-500/40',
  },
  A: {
    title: 'Usta',
    colorClass: 'text-indigo-300',
    bgClass: 'bg-indigo-950/60 border-indigo-500/50',
  },
  S: {
    title: 'Elita',
    colorClass: 'text-purple-300',
    bgClass: 'bg-purple-950/60 border-purple-500/50',
  },
  SS: {
    title: 'Grossmeyster',
    colorClass: 'text-amber-300',
    bgClass: 'bg-amber-950/60 border-amber-500/50',
  },
  SSS: {
    title: 'Mutlaq Afsona',
    colorClass: 'text-rose-300',
    bgClass: 'bg-gradient-to-r from-rose-950/80 via-fuchsia-950/80 to-amber-950/80 border-amber-400/70',
  },
};

export function computeRankClass(
  score: number = 0,
  manualClass?: RankClass
): RankClass {
  if (manualClass && RANK_CLASS_LIST.includes(manualClass)) return manualClass;
  if (score >= 1000) return 'SSS';
  if (score >= 600) return 'SS';
  if (score >= 350) return 'S';
  if (score >= 200) return 'A';
  if (score >= 120) return 'B';
  if (score >= 60) return 'C';
  if (score >= 25) return 'D';
  if (score >= 10) return 'E';
  return 'F';
}

export type WheelPrizeType =
  | 'points'
  | 'coins'
  | 'stars'
  | 'certificate'
  | 'premium';

export interface WheelPrizeSegment {
  id: string;
  label: string;
  type: WheelPrizeType;
  amount: number;
}

export const DEFAULT_WHEEL_SEGMENTS: WheelPrizeSegment[] = [
  { id: 'seg_1', label: '+10 Ball', type: 'points', amount: 10 },
  { id: 'seg_2', label: '+25 Tanga 🪙', type: 'coins', amount: 25 },
  { id: 'seg_3', label: '+5 Yulduz ⭐', type: 'stars', amount: 5 },
  { id: 'seg_4', label: '+20 Ball', type: 'points', amount: 20 },
  { id: 'seg_5', label: '+50 Tanga 🪙', type: 'coins', amount: 50 },
  { id: 'seg_6', label: 'JACKPOT +60 Ball', type: 'points', amount: 60 },
  { id: 'seg_7', label: '+10 Yulduz ⭐', type: 'stars', amount: 10 },
  { id: 'seg_8', label: 'Maxsus Sertifikat 🏅', type: 'certificate', amount: 35 },
];

export type CelestialRank = 'moon' | 'sun' | 'star';

export interface CelestialRankInfo {
  id: CelestialRank;
  label: string;
  symbol: string;
  multiplier: number;
  color: string;
  bgClass: string;
  borderClass: string;
}

export const CELESTIAL_RANKS: Record<CelestialRank, CelestialRankInfo> = {
  moon: {
    id: 'moon',
    label: 'Hilol Oy',
    symbol: '🌙',
    multiplier: 1.5,
    color: '#38bdf8',
    bgClass: 'bg-sky-500/15 text-sky-400',
    borderClass: 'border-sky-400/40',
  },
  sun: {
    id: 'sun',
    label: 'Quyosh Radiatsiyasi',
    symbol: '☀️',
    multiplier: 2.0,
    color: '#f59e0b',
    bgClass: 'bg-amber-500/15 text-amber-400',
    borderClass: 'border-amber-400/40',
  },
  star: {
    id: 'star',
    label: 'Yulduzlar Qiroli',
    symbol: '',
    multiplier: 3.0,
    color: '#ec4899',
    bgClass: 'bg-pink-500/15 text-pink-400',
    borderClass: 'border-pink-400/40',
  },
};

export interface PlatformSecurityConfig {
  screenshotProtectionEnabled: boolean;
  storeEnabled?: boolean;
  gameballCostPoints?: number;
  duelAdminBetPoints?: number;
  promoVideoUrl?: string;
  updatedAt?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  avatarEmoji?: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  memberIds: string[];
  pinnedMessageId?: string;
  mutedUserIds?: string[];
  createdAt: string;
}

export type UserRole = 'admin' | 'creator' | 'user';

export interface UserNoteItem {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
}

export type StudyNoteItem = UserNoteItem;

export interface UserPurchasedCertificate {
  id: string;
  userId: string;
  userName: string;
  username: string;
  storeCertificateId: string;
  title: string;
  subject: string;
  description?: string;
  costPoints: number;
  imageUrl: string;
  serialNumber: string;
  purchasedAt: string;
  acquiredVia?: 'points_purchase' | 'perfect_100' | 'admin_award' | 'points_store' | 'wheel_win';
  region?: string;
  district?: string;
  institution?: string;
}

export interface StoreCertificate {
  id: string;
  title: string;
  subject: string;
  description: string;
  requiredPoints: number;
  costPoints?: number;
  imageUrl: string;
  videoUrl?: string;
  badgeText?: string;
  createdBy: string;
  createdAt: string;
  purchasedCount?: number;
}

export interface WheelSpinRecord {
  id: string;
  userId: string;
  userName: string;
  username: string;
  wonPoints: number;
  prizeLabel?: string;
  prizeType?: WheelPrizeType;
  amount?: number;
  spunAt: string;
}

export interface PlatformWheelConfig {
  globalEnabled: boolean;
  globalWheelEnabled?: boolean;
  defaultSpinsPerGrant?: number;
  segments?: WheelPrizeSegment[];
  recentSpins: WheelSpinRecord[];
  updatedAt?: string;
}

export type StarColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

export const STAR_COLOR_META: Record<
  StarColor,
  {
    name: string;
    label: string;
    rankTitle: string;
    multiplier: number;
    hex: string;
    badgeClass: string;
    bgClass: string;
    colorClass: string;
    starEmoji: string;
    coinsCost: number;
  }
> = {
  blue: {
    name: "Ko'k Yulduz",
    label: "Ko'k Yulduz",
    rankTitle: 'Noob',
    multiplier: 1,
    hex: '#38bdf8',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
    bgClass: 'bg-sky-950/40 border-sky-500/30',
    colorClass: 'text-sky-300',
    starEmoji: '💙⭐',
    coinsCost: 0,
  },
  green: {
    name: 'Yashil Yulduz',
    label: 'Yashil Yulduz',
    rankTitle: 'Amateur',
    multiplier: 2,
    hex: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    bgClass: 'bg-emerald-950/40 border-emerald-500/30',
    colorClass: 'text-emerald-300',
    starEmoji: '💚⭐',
    coinsCost: 50,
  },
  yellow: {
    name: 'Sariq Yulduz',
    label: 'Sariq Yulduz',
    rankTitle: 'Pro',
    multiplier: 3,
    hex: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    bgClass: 'bg-amber-950/40 border-amber-500/30',
    colorClass: 'text-amber-300',
    starEmoji: '💛⭐',
    coinsCost: 100,
  },
  red: {
    name: 'Qizil Yulduz',
    label: 'Qizil Yulduz',
    rankTitle: 'Expert',
    multiplier: 4,
    hex: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/50',
    bgClass: 'bg-rose-950/40 border-rose-500/30',
    colorClass: 'text-rose-300',
    starEmoji: '❤️⭐',
    coinsCost: 200,
  },
  purple: {
    name: 'Binafsha Yulduz',
    label: 'Binafsha Yulduz',
    rankTitle: 'Legend',
    multiplier: 5,
    hex: '#a855f7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
    bgClass: 'bg-purple-950/40 border-purple-500/30',
    colorClass: 'text-purple-300',
    starEmoji: '💜⭐',
    coinsCost: 350,
  },
};

export interface StoreShopItem {
  id: string;
  title: string;
  description: string;
  category: 'star_rank' | 'wheel_spin' | 'coins_pack' | 'certificate';
  starColor?: StarColor;
  rankTitle?: string;
  rankClassGrant?: RankClass;
  scoreMultiplier?: number;
  multiplier?: number;
  wheelSpinsGrant?: number;
  coinsGrant?: number;
  costCoins: number;
  costPoints?: number;
  createdBy: string;
  createdAt: string;
}

export interface Book3DPage {
  pageNumber: number;
  title: string;
  content: string;
  formulaOrHighlight?: string;
}

export interface Book3DItem {
  id: string;
  title: string;
  subject: string;
  authorName: string;
  authorEmail: string;
  coverColor: string;
  coverSubtitle: string;
  description: string;
  pages: Book3DPage[];
  viewsCount: number;
  likesUserIds: string[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  rawPassword?: string;
  role: UserRole;
  rating: number;
  ratingTitle: string;
  solvedCount: number;
  totalScore: number;
  coins?: number;
  stars?: number;
  starColor?: StarColor;
  starRankTitle?: string;
  scoreMultiplier?: number;
  celestialRank?: CelestialRank;
  celestialMultiplier?: number;
  rankClass?: RankClass;
  rank: number;
  joinedAt?: string;
  createdAt?: string;
  region?: string;
  district?: string;
  institution?: string;
  school?: string;
  grade?: string;
  telegram?: string;
  bio?: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  customBadge?: string;
  isPremium?: boolean;
  premiumUntil?: string;
  premiumPaymentMethod?: 'card' | 'points';
  premiumDailyLastClaimed?: string;
  gameballPlayTimeSeconds?: number;
  faceIdEnabled?: boolean;
  faceIdDataUrl?: string;
  faceDescriptor?: number[];
  isIncognito?: boolean;
  creatorRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  creatorRequestNote?: string;
  creatorRequestedAt?: string;
  wheelSpinAllowed?: boolean;
  wheelSpinsLeft?: number;
  wheelRequestStatus?: 'none' | 'pending' | 'approved';
  lastWheelWonPoints?: number;
  screenshotAllowed?: boolean;
  chatMuted?: boolean;
  purchasedCertificates?: UserPurchasedCertificate[];
  followersUserIds?: string[];
  followingUserIds?: string[];
  claimedMissions?: string[];
  claimedRewards?: string[];
  savedNotes?: UserNoteItem[];
  studyNotes?: UserNoteItem[];
  permissions?: UserPermissions;
}

export type Difficulty = 'Oson' | "O'rta" | 'Qiyin' | 'Olimpiada';

export interface QuizQuestion {
  id: string;
  text: string;
  codeSnippet?: string;
  imageUrl?: string;
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
  durationMinutes: number;
  passingPercent: number;
  totalPoints: number;
  description: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  questions: QuizQuestion[];
  totalAttempts: number;
  passedAttempts: number;
  acceptanceRate: number;
  shuffleQuestions?: boolean;
  showExplanations?: boolean;
}

export type Verdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Time Limit Exceeded';

export interface QuestionBreakdownItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  points: number;
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
  verdict: Verdict;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  earnedPoints: number;
  score?: number;
  maxPoints: number;
  percentage: number;
  grade: string;
  submittedReason: 'manual' | 'timeout' | 'zoom_exit';
  submittedAt: string;
  timeSpentSeconds: number;
  warningsCount: number;
  addedPoints?: number;
  attemptNumber?: number;
  isFirstAttempt?: boolean;
  updatedUserScore?: number;
  questionBreakdown?: QuestionBreakdownItem[];
  questionResults: any[];
}

export interface CertificateData {
  serialNumber: string;
  recipientName: string;
  recipientUsername: string;
  region?: string;
  district?: string;
  institution?: string;
  testId: string;
  testTitle: string;
  subject: string;
  percentage: number;
  earnedPoints: number;
  maxPoints: number;
  grade: string;
  issuedAt: string;
  customImageUrl?: string;
  costPoints?: number;
  isSpecialAward?: boolean;
  acquiredVia?: 'perfect_100' | 'points_store' | 'points_purchase' | 'admin_award' | 'wheel_win';
}

export interface Contest {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  durationMinutes: number;
  status: 'Active' | 'Upcoming' | 'Finished';
  participantsCount: number;
  registeredUserIds: string[];
  testIds: string[];
  description?: string;
  createdBy?: string;
  authorName?: string;
}

export type VideoSizePreset = 'sm' | 'md' | 'lg' | 'full' | 'custom';

export interface CourseLessonPart {
  id: string;
  partNumber: number;
  title: string;
  videoUrl: string;
  videoSizePreset: VideoSizePreset;
  customWidthPx?: number;
  aspectRatio?: '16:9' | '4:3' | '21:9' | '9:16';
  authorMessage: string;
  attachedTestId?: string;
  inlineQuestions?: QuizQuestion[];
}

export interface CourseItem {
  id: string;
  title: string;
  subject: string;
  description: string;
  coverColor?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  createdAt: string;
  lessons: CourseLessonPart[];
  attachedTestId?: string;
  viewsCount: number;
  completedUserIds: string[];
  requiresApproval?: boolean;
  enrolledUserIds?: string[];
  pendingEnrollmentUserIds?: string[];
  pendingUserIds?: string[];
  comments: any[];
}

export interface StudyPlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type: 'test' | 'course' | 'algorithm' | 'practice';
  linkedTestId?: string;
  linkedCourseId?: string;
  targetPoints: number;
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  level: Difficulty;
  durationWeeks: number;
  description: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  steps: StudyPlanStep[];
  enrolledUserIds: string[];
  completedStepMap: Record<string, string[]>;
}

export interface AlgorithmTopic {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
  content: string;
  formulaOrCode: string;
  exampleSteps: string[];
  linkedTestId?: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  learnedUserIds: string[];
}

export interface Classroom {
  id: string;
  joinCode: string;
  name: string;
  subject: string;
  gradeLevel: string;
  description: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  studentUserIds: string[];
  assignedTestIds: string[];
  assignedCourseIds: string[];
  announcements: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface BlogComment {
  id: string;
  userId: string;
  userName: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorEmail: string;
  authorRole: UserRole;
  authorAvatarUrl?: string;
  likesUserIds: string[];
  viewsCount: number;
  comments: BlogComment[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  username: string;
  roleTitle: string;
  badge: string;
  bio: string;
  email?: string;
  telegram?: string;
  youtubeUrl?: string;
  avatarUrl: string;
  skills: string[];
  isFounder?: boolean;
  order: number;
}

export type AiMoodType = 'friendly' | 'motivator' | 'professor' | 'cyber';

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: UserRole | 'ai';
  senderAvatarUrl?: string;
  senderEmoji?: string;
  senderColor?: string;
  senderBadge?: string;
  senderCustomBadge?: string;
  senderScore?: number;
  senderRegion?: string;
  isPremium?: boolean;
  isAi?: boolean;
  aiMood?: AiMoodType;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  imageUrl?: string;
  audioDataUrl?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  recipientId: string;
  text: string;
  sharedTestId?: string;
  sharedTestTitle?: string;
  reactions?: Record<string, string[]>;
  createdAt: string;
}

export interface UserPermissions {
  canCreateTests?: boolean;
  canHostMajlis?: boolean;
  canModerateChat?: boolean;
  canUploadCourses?: boolean;
  canTakeScreenshots?: boolean;
}

export interface OnlinePresenceUser {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  region?: string;
  rating: number;
  totalScore: number;
  avatarUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  customBadge?: string;
  isPremium?: boolean;
  lastSeenAt: number;
  currentTab?: string;
  currentActivity?: string;
  deviceLabel?: string;
  inMajlis?: boolean;
  cameraOn?: boolean;
  micOn?: boolean;
  adminAlertMessage?: string;
}

export interface MajlisParticipant {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  avatarEmoji?: string;
  region?: string;
  cameraOn: boolean;
  micOn: boolean;
  screenSharing?: boolean;
  handRaised?: boolean;
  isSpeaking?: boolean;
  speaking?: boolean;
  frameDataUrl?: string;
  frameData?: string;
  statusText?: string;
  reaction?: string;
  joinedAt: string;
  lastUpdatedAt: number;
}

export interface MajlisChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: UserRole;
  text: string;
  userId?: string;
  name?: string;
  role?: UserRole;
  createdAt: string;
}

export interface MajlisRoomState {
  isActive: boolean;
  title: string;
  topic: string;
  hostName: string;
  hostId: string;
  startedAt: string;
  spotlightUserId?: string;
  pinnedUserId?: string;
  participants: MajlisParticipant[];
  messages: MajlisChatMessage[];
}

// ==========================================
// GAMEBALL 3D MULTIPLAYER TYPES
// ==========================================
export type GameballMode = 'hypershot' | 'memory' | 'iq';

export interface GameballPlayer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  score: number;
  health: number;
  kills: number;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  color: string;
  isCurrentUser?: boolean;
  isRealUser?: boolean;
}

export interface GameballMatchState {
  matchId: string;
  mode: GameballMode;
  timeLeftSeconds: number;
  isActive: boolean;
  players: GameballPlayer[];
  winnerPlayerId?: string;
}


