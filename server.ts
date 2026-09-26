import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
export const ADMIN_EMAIL = "jumaqulovbehruz831@gmail.com";

app.use(express.json({ limit: "10mb" }));

// ==========================================
// PERSISTENT REAL DATABASE (100% EMPTY INITIAL STATE)
// ==========================================
const DB_FILE_PATH = path.join(process.cwd(), "robocontest-clean-db.json");

export type UserRole = "admin" | "creator" | "user";

export interface StoredUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
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

export interface StoredTest {
  id: string; // e.g., "0001"
  numericId: number;
  title: string;
  subject: string;
  difficulty: "Oson" | "O'rta" | "Qiyin" | "Olimpiada";
  description: string;
  durationMinutes: number; // CHSB timer in minutes
  passingPercent: number; // e.g., 60
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

export interface StoredSubmission {
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
  grade: string; // CHSB grade: "5 (A'lo)", "4 (Yaxshi)", "3 (Qoniqarli)", "2 (Qoniqarsiz)"
  verdict: "Accepted" | "Failed" | "Disqualified";
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  warningsCount: number; // CHSB anti-cheat warnings
  submittedReason: "manual" | "timeout" | "anticheat" | "zoom_exit";
  addedPoints?: number;
  submittedAt: string;
  questionResults: QuestionResultItem[];
}

export interface StoredContest {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: "upcoming" | "active" | "finished";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  testIds: string[];
  registeredUserIds: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface PlatformDatabase {
  users: StoredUser[];
  creatorEmails: string[]; // Emails authorized by Admin (jumaqulovbehruz831@gmail.com) as Creators
  tests: StoredTest[];
  submissions: StoredSubmission[];
  contests: StoredContest[];
}

function getInitialEmptyDb(): PlatformDatabase {
  return {
    users: [],
    creatorEmails: [ADMIN_EMAIL],
    tests: [],
    submissions: [],
    contests: [],
  };
}

let db: PlatformDatabase = getInitialEmptyDb();

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      db = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        creatorEmails: Array.isArray(parsed.creatorEmails)
          ? Array.from(new Set([ADMIN_EMAIL, ...parsed.creatorEmails.map((e: string) => e.toLowerCase())]))
          : [ADMIN_EMAIL],
        tests: Array.isArray(parsed.tests) ? parsed.tests : [],
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        contests: Array.isArray(parsed.contests) ? parsed.contests : [],
      };
    } else {
      db = getInitialEmptyDb();
      saveDb();
    }
  } catch (err) {
    console.error("Failed to load DB, initializing empty DB:", err);
    db = getInitialEmptyDb();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save DB:", err);
  }
}

loadDb();

function computeRatingTitle(rating: number): string {
  if (rating >= 2400) return "Grandmaster";
  if (rating >= 2100) return "Master";
  if (rating >= 1800) return "Candidate Master";
  if (rating >= 1500) return "Expert";
  if (rating >= 1300) return "Specialist";
  if (rating >= 1100) return "Pupil";
  return "Newbie";
}

function recalculateRanksAndRoles() {
  // Ensure roles match admin & creatorEmails rules
  for (const u of db.users) {
    const emailNorm = u.email.trim().toLowerCase();
    if (emailNorm === ADMIN_EMAIL) {
      u.role = "admin";
    } else if (db.creatorEmails.includes(emailNorm)) {
      u.role = "creator";
    } else if (u.role === "admin") {
      // Nobody else can ever be admin
      u.role = "user";
    }
    u.ratingTitle = computeRatingTitle(u.rating);
  }

  // Sort by rating desc, then totalScore desc, then solvedCount desc
  const sorted = [...db.users].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.solvedCount - a.solvedCount;
  });

  sorted.forEach((u, idx) => {
    const target = db.users.find((item) => item.id === u.id);
    if (target) {
      target.rank = idx + 1;
    }
  });
}

function sanitizeUser(u: StoredUser) {
  const { password: _, ...safe } = u;
  return safe;
}

// ==========================================
// PUBLIC & STATE ENDPOINTS
// ==========================================

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/state", (_req, res) => {
  recalculateRanksAndRoles();
  const safeUsers = db.users
    .map(sanitizeUser)
    .sort((a, b) => a.rank - b.rank);

  res.json({
    users: safeUsers,
    tests: db.tests,
    submissions: db.submissions,
    contests: db.contests,
    creatorEmails: db.creatorEmails,
  });
});

// ==========================================
// AUTHENTICATION ENDPOINTS (REAL USERS ONLY)
// ==========================================

app.post("/api/auth/register", (req, res) => {
  const { name, username, email, password, region, institution, bio, telegram } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Ism, username, email va parol kiritilishi shart!" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim().toLowerCase().replace(/\s+/g, "_");

  if (password.length < 4) {
    return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lishi kerak!" });
  }

  const existingByEmail = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingByEmail) {
    return res.status(409).json({ error: "Ushbu email orqali allaqachon ro'yxatdan o'tilgan!" });
  }

  const existingByUsername = db.users.find((u) => u.username.toLowerCase() === normalizedUsername);
  if (existingByUsername) {
    return res.status(409).json({ error: "Ushbu username band, boshqa username tanlang!" });
  }

  const isOwnerAdmin = normalizedEmail === ADMIN_EMAIL;
  const isCreator = isOwnerAdmin || db.creatorEmails.includes(normalizedEmail);

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: String(password),
    role: isOwnerAdmin ? "admin" : isCreator ? "creator" : "user",
    rating: 1200,
    ratingTitle: computeRatingTitle(1200),
    rank: db.users.length + 1,
    solvedCount: 0,
    submissionsCount: 0,
    totalScore: 0,
    bio: bio ? String(bio).trim() : "",
    region: region ? String(region).trim() : "Toshkent shahri",
    institution: institution ? String(institution).trim() : "",
    telegram: telegram ? String(telegram).trim() : "",
    createdAt: new Date().toISOString(),
    isBanned: false,
  };

  db.users.push(newUser);
  recalculateRanksAndRoles();
  saveDb();

  res.status(201).json({
    success: true,
    user: sanitizeUser(newUser),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Email/Username va parolni kiriting!" });
  }

  const normalizedLogin = String(login).trim().toLowerCase();

  let user = db.users.find(
    (u) => u.email.toLowerCase() === normalizedLogin || u.username.toLowerCase() === normalizedLogin
  );

  // If the owner admin (jumaqulovbehruz831@gmail.com) logs in for the very first time on an empty DB,
  // automatically bootstrap their admin account with the password they entered.
  if (!user && normalizedLogin === ADMIN_EMAIL) {
    user = {
      id: `usr_admin_${Date.now()}`,
      name: "Behruz Jumaqulov",
      username: "behruz_admin",
      email: ADMIN_EMAIL,
      password: String(password),
      role: "admin",
      rating: 1500,
      ratingTitle: computeRatingTitle(1500),
      rank: 1,
      solvedCount: 0,
      submissionsCount: 0,
      totalScore: 0,
      bio: "Platforma Bosh Admini",
      region: "Toshkent shahri",
      institution: "RoboContest UZ",
      createdAt: new Date().toISOString(),
      isBanned: false,
    };
    db.users.push(user);
    recalculateRanksAndRoles();
    saveDb();
    return res.json({ success: true, user: sanitizeUser(user) });
  }

  if (!user) {
    return res.status(404).json({ error: "Bunday foydalanuvchi topilmadi. Avval ro'yxatdan o'ting!" });
  }

  if (user.isBanned && user.email.toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Sizning profilingiz admin tomonidan bloklangan!" });
  }

  if (user.password !== String(password)) {
    return res.status(401).json({ error: "Parol noto'g'ri!" });
  }

  recalculateRanksAndRoles();
  saveDb();

  res.json({ success: true, user: sanitizeUser(user) });
});

app.put("/api/auth/profile/:id", (req, res) => {
  const { id } = req.params;
  const { name, username, region, institution, bio, telegram, newPassword } = req.body;

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi!" });
  }

  if (username && String(username).trim().toLowerCase() !== user.username.toLowerCase()) {
    const cleanUsername = String(username).trim().toLowerCase().replace(/\s+/g, "_");
    const taken = db.users.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername);
    if (taken) {
      return res.status(409).json({ error: "Ushbu username allaqachon band!" });
    }
    user.username = cleanUsername;
  }

  if (name) user.name = String(name).trim();
  if (region !== undefined) user.region = String(region).trim();
  if (institution !== undefined) user.institution = String(institution).trim();
  if (bio !== undefined) user.bio = String(bio).trim();
  if (telegram !== undefined) user.telegram = String(telegram).trim();
  if (newPassword && String(newPassword).trim().length >= 4) {
    user.password = String(newPassword).trim();
  }

  recalculateRanksAndRoles();
  saveDb();

  res.json({ success: true, user: sanitizeUser(user) });
});

// ==========================================
// ADMIN PANEL ENDPOINTS (STRICTLY jumaqulovbehruz831@gmail.com ONLY)
// ==========================================

function verifyAdmin(req: express.Request, res: express.Response): StoredUser | null {
  const adminEmailHeader = String(req.headers["x-user-email"] || req.body?.adminEmail || "").trim().toLowerCase();
  if (adminEmailHeader !== ADMIN_EMAIL) {
    res.status(403).json({
      error: "Ruxsat rad etildi! Admin panel faqat jumaqulovbehruz831@gmail.com uchun ochiq.",
    });
    return null;
  }
  const adminUser = db.users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL) || null;
  return adminUser;
}

// Add a Creator (either existing user by email, or create a new Creator account directly, or whitelist email)
app.post("/api/admin/creators", (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const { email, name, username, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Yaratuvchi email manzilini kiriting!" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!db.creatorEmails.includes(normalizedEmail)) {
    db.creatorEmails.push(normalizedEmail);
  }

  let existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    if (existingUser.email.toLowerCase() !== ADMIN_EMAIL) {
      existingUser.role = "creator";
    }
    if (name) existingUser.name = String(name).trim();
    if (password && String(password).trim().length >= 4) {
      existingUser.password = String(password).trim();
    }
  } else if (name && password) {
    // Admin provided name and password to create the Creator's account directly
    const baseUsername = username
      ? String(username).trim().toLowerCase().replace(/\s+/g, "_")
      : normalizedEmail.split("@")[0].replace(/[^a-z0-9_]/g, "_");
    const uniqueUsername = db.users.some((u) => u.username === baseUsername)
      ? `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`
      : baseUsername;

    existingUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      username: uniqueUsername,
      email: normalizedEmail,
      password: String(password),
      role: normalizedEmail === ADMIN_EMAIL ? "admin" : "creator",
      rating: 1200,
      ratingTitle: computeRatingTitle(1200),
      rank: db.users.length + 1,
      solvedCount: 0,
      submissionsCount: 0,
      totalScore: 0,
      bio: "Rasmiy Test Yaratuvchi (Creator)",
      region: "Toshkent shahri",
      institution: "",
      createdAt: new Date().toISOString(),
      isBanned: false,
    };
    db.users.push(existingUser);
  }

  recalculateRanksAndRoles();
  saveDb();

  res.json({
    success: true,
    message: existingUser
      ? `${existingUser.name} (${normalizedEmail}) yaratuvchilar ro'yxatiga qo'shildi!`
      : `${normalizedEmail} yaratuvchi sifatida tasdiqlandi! Ushbu email bilan kirgan foydalanuvchi avtomatik Yaratuvchi bo'ladi.`,
    creatorEmails: db.creatorEmails,
    users: db.users.map(sanitizeUser),
  });
});

// Remove Creator status
app.delete("/api/admin/creators/:email", (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const targetEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
  if (targetEmail === ADMIN_EMAIL) {
    return res.status(400).json({ error: "Bosh adminni yaratuvchilar ro'yxatidan o'chirib bo'lmaydi!" });
  }

  db.creatorEmails = db.creatorEmails.filter((e) => e.toLowerCase() !== targetEmail);
  const user = db.users.find((u) => u.email.toLowerCase() === targetEmail);
  if (user && user.email.toLowerCase() !== ADMIN_EMAIL) {
    user.role = "user";
  }

  recalculateRanksAndRoles();
  saveDb();

  res.json({
    success: true,
    message: `${targetEmail} yaratuvchi huquqidan mahrum qilindi.`,
    creatorEmails: db.creatorEmails,
    users: db.users.map(sanitizeUser),
  });
});

// Toggle role for an existing registered user
app.patch("/api/admin/users/:id/role", (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const { id } = req.params;
  const { role } = req.body; // 'creator' | 'user'

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi!" });
  }

  if (user.email.toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: "Bosh admin rolini o'zgartirib bo'lmaydi!" });
  }

  const emailLower = user.email.toLowerCase();
  if (role === "creator") {
    user.role = "creator";
    if (!db.creatorEmails.includes(emailLower)) {
      db.creatorEmails.push(emailLower);
    }
  } else {
    user.role = "user";
    db.creatorEmails = db.creatorEmails.filter((e) => e !== emailLower);
  }

  recalculateRanksAndRoles();
  saveDb();

  res.json({
    success: true,
    user: sanitizeUser(user),
    creatorEmails: db.creatorEmails,
  });
});

// Ban or unban a user
app.patch("/api/admin/users/:id/ban", (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi!" });
  }
  if (user.email.toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: "Bosh adminni bloklash mumkin emas!" });
  }

  user.isBanned = !user.isBanned;
  saveDb();

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// Delete a user
app.delete("/api/admin/users/:id", (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi!" });
  }
  if (user.email.toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: "Bosh adminni o'chirish mumkin emas!" });
  }

  db.users = db.users.filter((u) => u.id !== id);
  recalculateRanksAndRoles();
  saveDb();

  res.json({
    success: true,
    users: db.users.map(sanitizeUser),
  });
});

// ==========================================
// TEST CREATION ENDPOINTS (TELEGRAM QUIZ STYLE - ONLY CREATORS & ADMIN)
// ==========================================

function verifyCreatorOrAdmin(req: express.Request, res: express.Response): StoredUser | null {
  const emailHeader = String(req.headers["x-user-email"] || req.body?.authorEmail || "").trim().toLowerCase();
  if (!emailHeader) {
    res.status(401).json({ error: "Avval tizimga kiring!" });
    return null;
  }

  const user = db.users.find((u) => u.email.toLowerCase() === emailHeader);
  const isAuthorized =
    emailHeader === ADMIN_EMAIL ||
    db.creatorEmails.includes(emailHeader) ||
    (user && (user.role === "admin" || user.role === "creator"));

  if (!isAuthorized) {
    res.status(403).json({
      error: "Test yaratish huquqi faqat Admin tomonidan tasdiqlangan Yaratuvchilarga (Creator) berilgan!",
    });
    return null;
  }

  return user || null;
}

app.post("/api/tests", (req, res) => {
  const creator = verifyCreatorOrAdmin(req, res);
  if (!creator && String(req.headers["x-user-email"] || "").toLowerCase() !== ADMIN_EMAIL) return;

  const {
    title,
    subject,
    difficulty,
    description,
    durationMinutes,
    passingPercent,
    shuffleQuestions,
    showExplanations,
    questions,
    contestId,
  } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      error: "Test nomi va kamida 1 ta quiz savoli kiritilishi shart!",
    });
  }

  // Validate each question in Telegram Quiz format
  const sanitizedQuestions: QuizQuestion[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const cleanOptions = Array.isArray(q.options)
      ? q.options.map((opt: any) => String(opt).trim()).filter((opt: string) => opt.length > 0)
      : [];

    if (!q.text || String(q.text).trim().length === 0) {
      return res.status(400).json({ error: `${i + 1}-savol matni bo'sh bo'lishi mumkin emas!` });
    }
    if (cleanOptions.length < 2) {
      return res.status(400).json({ error: `${i + 1}-savolda kamida 2 ta javob varianti bo'lishi shart!` });
    }
    const correctIdx = Number(q.correctOptionIndex);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= cleanOptions.length) {
      return res.status(400).json({ error: `${i + 1}-savolda to'g'ri javob varianti belgilanmagan!` });
    }

    sanitizedQuestions.push({
      id: q.id || `q_${Date.now()}_${i + 1}`,
      text: String(q.text).trim(),
      codeSnippet: q.codeSnippet ? String(q.codeSnippet).trim() : undefined,
      options: cleanOptions,
      correctOptionIndex: correctIdx,
      explanation: q.explanation ? String(q.explanation).trim() : undefined,
      points: Math.max(1, Number(q.points) || 2),
    });
  }

  const nextNumericId = db.tests.length > 0 ? Math.max(...db.tests.map((t) => t.numericId)) + 1 : 1;
  const formattedId = String(nextNumericId).padStart(4, "0");
  const totalPoints = sanitizedQuestions.reduce((acc, q) => acc + q.points, 0);

  const newTest: StoredTest = {
    id: formattedId,
    numericId: nextNumericId,
    title: String(title).trim(),
    subject: subject ? String(subject).trim() : "Informatika va Algoritmlar",
    difficulty: difficulty || "O'rta",
    description: description ? String(description).trim() : "",
    durationMinutes: Math.max(1, Number(durationMinutes) || 30),
    passingPercent: Math.min(100, Math.max(10, Number(passingPercent) || 60)),
    shuffleQuestions: Boolean(shuffleQuestions),
    showExplanations: showExplanations !== undefined ? Boolean(showExplanations) : true,
    questions: sanitizedQuestions,
    totalPoints,
    authorId: creator?.id || "admin",
    authorName: creator?.name || "Admin",
    authorEmail: creator?.email || ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
    totalAttempts: 0,
    passedAttempts: 0,
    acceptanceRate: 0,
    contestId: contestId || undefined,
  };

  db.tests.push(newTest);
  saveDb();

  res.status(201).json({
    success: true,
    test: newTest,
  });
});

app.delete("/api/tests/:id", (req, res) => {
  const caller = verifyCreatorOrAdmin(req, res);
  if (!caller && String(req.headers["x-user-email"] || "").toLowerCase() !== ADMIN_EMAIL) return;

  const { id } = req.params;
  const test = db.tests.find((t) => t.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test topilmadi!" });
  }

  const callerEmail = String(req.headers["x-user-email"] || "").trim().toLowerCase();
  if (callerEmail !== ADMIN_EMAIL && test.authorEmail.toLowerCase() !== callerEmail) {
    return res.status(403).json({ error: "Siz faqat o'zingiz yaratgan testni o'chira olasiz!" });
  }

  db.tests = db.tests.filter((t) => t.id !== id);
  saveDb();

  res.json({ success: true, tests: db.tests });
});

// ==========================================
// CONTESTS / OLYMPIADS ENDPOINTS (ROBOCONTEST STYLE)
// ==========================================

app.post("/api/contests", (req, res) => {
  const creator = verifyCreatorOrAdmin(req, res);
  if (!creator && String(req.headers["x-user-email"] || "").toLowerCase() !== ADMIN_EMAIL) return;

  const { title, description, subject, startTime, durationMinutes, testIds } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Olimpiada nomini kiriting!" });
  }

  const start = startTime ? new Date(startTime) : new Date();
  const dur = Math.max(10, Number(durationMinutes) || 60);
  const end = new Date(start.getTime() + dur * 60000);

  const newContest: StoredContest = {
    id: `cnt_${Date.now()}`,
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    subject: subject ? String(subject).trim() : "Umumiy fanlar",
    status: "active",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: dur,
    testIds: Array.isArray(testIds) ? testIds : [],
    registeredUserIds: [],
    authorId: creator?.id || "admin",
    authorName: creator?.name || "Admin",
    createdAt: new Date().toISOString(),
  };

  db.contests.unshift(newContest);
  saveDb();

  res.status(201).json({ success: true, contest: newContest });
});

app.post("/api/contests/:id/register", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const contest = db.contests.find((c) => c.id === id);
  if (!contest) {
    return res.status(404).json({ error: "Olimpiada topilmadi!" });
  }

  if (userId && !contest.registeredUserIds.includes(userId)) {
    contest.registeredUserIds.push(userId);
    saveDb();
  }

  res.json({ success: true, contest });
});

app.delete("/api/contests/:id", (req, res) => {
  const caller = verifyCreatorOrAdmin(req, res);
  if (!caller && String(req.headers["x-user-email"] || "").toLowerCase() !== ADMIN_EMAIL) return;

  const { id } = req.params;
  db.contests = db.contests.filter((c) => c.id !== id);
  saveDb();

  res.json({ success: true, contests: db.contests });
});

// ==========================================
// CHSB EXAM SUBMISSION & GRADING ENGINE
// ==========================================

function calculateChsbGrade(percentage: number): string {
  if (percentage >= 86) return "5 (A'lo)";
  if (percentage >= 71) return "4 (Yaxshi)";
  if (percentage >= 56) return "3 (Qoniqarli)";
  return "2 (Qoniqarsiz)";
}

app.post("/api/tests/:id/submit", (req, res) => {
  const { id } = req.params;
  const { userId, answers, timeSpentSeconds, warningsCount, submittedReason } = req.body;

  const test = db.tests.find((t) => t.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test topilmadi!" });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Test topshirish uchun tizimga kiring!" });
  }

  const answerMap: Record<string, number> = answers && typeof answers === "object" ? answers : {};

  let earnedPoints = 0;
  let maxPoints = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const questionResults: QuestionResultItem[] = test.questions.map((q) => {
    maxPoints += q.points;
    const rawSelected = answerMap[q.id];
    const selectedOptionIndex =
      rawSelected !== undefined && rawSelected !== null && rawSelected !== -1 ? Number(rawSelected) : null;

    if (selectedOptionIndex === null || isNaN(selectedOptionIndex)) {
      unansweredCount++;
      return {
        questionId: q.id,
        selectedOptionIndex: null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect: false,
        earnedPoints: 0,
        maxPoints: q.points,
        explanation: test.showExplanations ? q.explanation : undefined,
      };
    }

    const isCorrect = selectedOptionIndex === q.correctOptionIndex;
    if (isCorrect) {
      correctCount++;
      earnedPoints += q.points;
    } else {
      wrongCount++;
    }

    return {
      questionId: q.id,
      selectedOptionIndex,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
      earnedPoints: isCorrect ? q.points : 0,
      maxPoints: q.points,
      explanation: test.showExplanations ? q.explanation : undefined,
    };
  });

  const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 1000) / 10 : 0;
  const grade = calculateChsbGrade(percentage);
  const isPassed = percentage >= test.passingPercent;

  // Check if user had already solved this test before
  const alreadySolvedBefore = db.submissions.some(
    (s) => s.userId === user.id && s.testId === test.id && s.earnedPoints > 0
  );

  // Previous best score on this test by this user
  const prevBestSubmission = db.submissions
    .filter((s) => s.userId === user.id && s.testId === test.id)
    .reduce((max, s) => Math.max(max, s.earnedPoints), 0);

  const addedPoints = Math.max(0, earnedPoints - prevBestSubmission);

  const submission: StoredSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    testId: test.id,
    testTitle: test.title,
    subject: test.subject,
    userId: user.id,
    userName: user.name,
    username: user.username,
    earnedPoints,
    maxPoints,
    percentage,
    grade,
    verdict: isPassed ? "Accepted" : "Failed",
    correctCount,
    wrongCount,
    unansweredCount,
    totalQuestions: test.questions.length,
    timeSpentSeconds: Math.max(1, Number(timeSpentSeconds) || 0),
    warningsCount: Number(warningsCount) || 0,
    submittedReason: submittedReason || "manual",
    addedPoints,
    submittedAt: new Date().toISOString(),
    questionResults,
  };

  db.submissions.unshift(submission);

  // Update Test statistics
  test.totalAttempts += 1;
  if (isPassed) {
    test.passedAttempts += 1;
  }
  test.acceptanceRate =
    test.totalAttempts > 0 ? Math.round((test.passedAttempts / test.totalAttempts) * 1000) / 10 : 0;

  // Update User statistics & add earned points to user's total score and rating
  user.submissionsCount += 1;
  if (earnedPoints > 0 && !alreadySolvedBefore) {
    user.solvedCount += 1;
  }
  if (addedPoints > 0) {
    user.totalScore += addedPoints;
    user.rating += addedPoints;
  }

  recalculateRanksAndRoles();
  saveDb();

  res.status(201).json({
    success: true,
    submission,
    user: sanitizeUser(user),
    test,
  });
});

// ==========================================
// VITE DEV SERVER & STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
