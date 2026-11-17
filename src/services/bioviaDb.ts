import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  GameId,
  MaterialCategory,
  MaterialProgressDoc,
  QuizAttemptDoc,
  StudentProfileDoc,
} from '../types/biovia';
import {
  calculateQuizRewardXp,
  clampScore,
  computeExplorerLevel,
  isValidFirestoreId,
  MAX_EMAIL_LENGTH,
  MAX_PHOTO_URL_LENGTH,
  sanitizeDisplayName,
  sanitizeMaterialTitle,
} from '../utils/bioviaLogic';
import { computeGameXpReward } from '../utils/gameLogic';

export async function ensureStudentDocuments(user: User): Promise<void> {
  if (!user.uid || !isValidFirestoreId(user.uid)) {
    throw new Error('User ID tidak valid.');
  }

  const profilePath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;
  const profileRef = doc(db, 'users', user.uid);
  const privateRef = doc(db, 'users', user.uid, 'private', 'info');

  const safeName = sanitizeDisplayName(user.displayName);
  const safeEmail = (user.email ?? '').trim().slice(0, MAX_EMAIL_LENGTH);
  const safePhoto = (user.photoURL ?? '').trim().slice(0, MAX_PHOTO_URL_LENGTH);

  let profileSnap;
  try {
    profileSnap = await getDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  let privateSnap;
  try {
    privateSnap = await getDoc(privateRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, privatePath);
  }

  const batch = writeBatch(db);
  let hasWrites = false;

  if (!profileSnap.exists()) {
    batch.set(profileRef, {
      uid: user.uid,
      displayName: safeName,
      xp: 0,
      level: 1,
      completedCount: 0,
      dailyChallengeBestScore: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    hasWrites = true;
  }

  if (!privateSnap.exists() && safeEmail.length >= 3) {
    const privatePayload: Record<string, unknown> = {
      uid: user.uid,
      email: safeEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (safePhoto) {
      privatePayload.photoUrl = safePhoto;
    }
    batch.set(privateRef, privatePayload);
    hasWrites = true;
  } else if (privateSnap.exists() && safeEmail.length >= 3) {
    const existingPrivate = privateSnap.data();
    if (existingPrivate.email !== safeEmail || (safePhoto && existingPrivate.photoUrl !== safePhoto)) {
      const updatePayload: Record<string, unknown> = {
        email: safeEmail,
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        updatePayload.photoUrl = safePhoto;
      }
      batch.update(privateRef, updatePayload);
      hasWrites = true;
    }
  }

  if (hasWrites) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  }
}

export function subscribeStudentProfile(
  uid: string,
  onData: (profile: StudentProfileDoc | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data();
      onData({
        uid: String(data.uid ?? uid),
        displayName: sanitizeDisplayName(data.displayName),
        xp: Number(data.xp ?? 0),
        level: Number(data.level ?? 1),
        completedCount: Number(data.completedCount ?? 0),
        dailyChallengeBestScore:
          typeof data.dailyChallengeBestScore === 'number'
            ? data.dailyChallengeBestScore
            : undefined,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeMaterialProgress(
  uid: string,
  onData: (progressMap: Record<string, MaterialProgressDoc>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/materialProgress`;
  const q = query(collection(db, 'users', uid, 'materialProgress'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const next: Record<string, MaterialProgressDoc> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        next[docSnap.id] = {
          userId: String(d.userId ?? uid),
          materialSlug: String(d.materialSlug ?? docSnap.id),
          title: String(d.title ?? ''),
          category: (d.category as MaterialCategory) ?? 'manusia',
          bestScore: Number(d.bestScore ?? 0),
          lastScore: Number(d.lastScore ?? 0),
          attempts: Number(d.attempts ?? 1),
          completed: Boolean(d.completed),
        };
      });
      onData(next);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeQuizHistory(
  uid: string,
  onData: (attempts: QuizAttemptDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/quizHistory`;
  const q = query(
    collection(db, 'users', uid, 'quizHistory'),
    where('userId', '==', uid),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Array<QuizAttemptDoc & { sortMs: number }> = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAt = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : null;
        items.push({
          id: docSnap.id,
          userId: String(d.userId ?? uid),
          materialSlug: String(d.materialSlug ?? ''),
          materialTitle: String(d.materialTitle ?? ''),
          score: Number(d.score ?? 0),
          correctCount: Number(d.correctCount ?? 0),
          totalQuestions: Number(d.totalQuestions ?? 0),
          createdAtLabel: createdAt
            ? new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(createdAt)
            : 'Baru saja',
          sortMs: createdAt ? createdAt.getTime() : Date.now(),
        });
      });
      items.sort((a, b) => b.sortMs - a.sortMs);
      onData(items.slice(0, 15).map(({ sortMs: _ignore, ...rest }) => rest));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function recordMaterialQuizResult(params: {
  uid: string;
  materialSlug: string;
  title: string;
  category: MaterialCategory;
  score: number;
  correctCount: number;
  totalQuestions: number;
  currentProfile: StudentProfileDoc | null;
  existingProgress?: MaterialProgressDoc;
}): Promise<void> {
  const {
    uid,
    materialSlug,
    title,
    category,
    score,
    correctCount,
    totalQuestions,
    currentProfile,
    existingProgress,
  } = params;

  if (!isValidFirestoreId(uid) || !isValidFirestoreId(materialSlug)) {
    throw new Error('ID pengguna atau materi tidak valid.');
  }

  const safeScore = clampScore(score);
  const safeTitle = sanitizeMaterialTitle(title);
  const safeTotal = Math.min(50, Math.max(1, Math.round(totalQuestions)));
  const safeCorrect = Math.min(safeTotal, Math.max(0, Math.round(correctCount)));
  const passed = safeScore >= 60;

  const progressPath = `users/${uid}/materialProgress/${materialSlug}`;
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profileRef = doc(db, 'users', uid);
  const progressRef = doc(db, 'users', uid, 'materialProgress', materialSlug);
  const attemptRef = doc(db, 'users', uid, 'quizHistory', attemptId);

  const wasAlreadyCompleted = Boolean(existingProgress?.completed);
  const isFirstCompletion = !wasAlreadyCompleted && passed;
  const rewardXp = calculateQuizRewardXp(safeScore, isFirstCompletion);

  const currentXp = currentProfile?.xp ?? 0;
  const nextXp = Math.min(1000000, currentXp + rewardXp);
  const nextLevel = computeExplorerLevel(nextXp);
  const nextCompletedCount = Math.min(
    24,
    (currentProfile?.completedCount ?? 0) + (isFirstCompletion ? 1 : 0)
  );

  const batch = writeBatch(db);

  if (!currentProfile) {
    batch.set(profileRef, {
      uid,
      displayName: 'Penjelajah BIOVIA',
      xp: nextXp,
      level: nextLevel,
      completedCount: nextCompletedCount,
      dailyChallengeBestScore: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(profileRef, {
      xp: nextXp,
      level: nextLevel,
      completedCount: nextCompletedCount,
      updatedAt: serverTimestamp(),
    });
  }

  if (!existingProgress) {
    batch.set(progressRef, {
      userId: uid,
      materialSlug,
      title: safeTitle,
      category,
      bestScore: safeScore,
      lastScore: safeScore,
      attempts: 1,
      completed: passed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(progressRef, {
      bestScore: Math.max(existingProgress.bestScore, safeScore),
      lastScore: safeScore,
      attempts: Math.min(10000, existingProgress.attempts + 1),
      completed: existingProgress.completed || passed,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(attemptRef, {
    userId: uid,
    materialSlug,
    materialTitle: safeTitle,
    score: safeScore,
    correctCount: safeCorrect,
    totalQuestions: safeTotal,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, progressPath);
  }
}

export async function recordDailyChallengeResult(params: {
  uid: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  currentProfile: StudentProfileDoc | null;
}): Promise<void> {
  const { uid, score, correctCount, totalQuestions, currentProfile } = params;
  if (!isValidFirestoreId(uid)) {
    throw new Error('User ID tidak valid.');
  }

  const safeScore = clampScore(score);
  const safeTotal = Math.min(50, Math.max(1, Math.round(totalQuestions)));
  const safeCorrect = Math.min(safeTotal, Math.max(0, Math.round(correctCount)));
  const rewardXp = calculateQuizRewardXp(safeScore, false);

  const nextXp = Math.min(1000000, (currentProfile?.xp ?? 0) + rewardXp);
  const nextLevel = computeExplorerLevel(nextXp);
  const nextDailyBest = Math.max(currentProfile?.dailyChallengeBestScore ?? 0, safeScore);

  const attemptId = `daily_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profileRef = doc(db, 'users', uid);
  const attemptRef = doc(db, 'users', uid, 'quizHistory', attemptId);

  const batch = writeBatch(db);
  if (!currentProfile) {
    batch.set(profileRef, {
      uid,
      displayName: 'Penjelajah BIOVIA',
      xp: nextXp,
      level: nextLevel,
      completedCount: 0,
      dailyChallengeBestScore: nextDailyBest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(profileRef, {
      xp: nextXp,
      level: nextLevel,
      dailyChallengeBestScore: nextDailyBest,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(attemptRef, {
    userId: uid,
    materialSlug: 'daily-challenge',
    materialTitle: 'Tantangan Hari Ini: Organ Tubuh & Sel',
    score: safeScore,
    correctCount: safeCorrect,
    totalQuestions: safeTotal,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/quizHistory/${attemptId}`);
  }
}

export async function updateStudentDisplayName(uid: string, displayName: string): Promise<void> {
  if (!isValidFirestoreId(uid)) {
    throw new Error('User ID tidak valid.');
  }
  const safeName = sanitizeDisplayName(displayName);
  const profileRef = doc(db, 'users', uid);
  try {
    await updateDoc(profileRef, {
      displayName: safeName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function recordGameCompletionReward(params: {
  uid: string;
  gameId: GameId;
  gameTitle: string;
  score: number;
  victory: boolean;
  currentProfile: StudentProfileDoc | null;
}): Promise<number> {
  const { uid, gameId, gameTitle, score, victory, currentProfile } = params;
  if (!isValidFirestoreId(uid) || !isValidFirestoreId(gameId)) {
    throw new Error('ID pengguna atau game tidak valid.');
  }

  const rewardXp = computeGameXpReward(gameId, score, victory);
  const nextXp = Math.min(1000000, (currentProfile?.xp ?? 0) + rewardXp);
  const nextLevel = computeExplorerLevel(nextXp);
  const normalizedScore = Math.min(100, Math.max(0, victory ? 100 : Math.round(Math.min(85, score / 20))));

  const attemptId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profileRef = doc(db, 'users', uid);
  const attemptRef = doc(db, 'users', uid, 'quizHistory', attemptId);

  const batch = writeBatch(db);
  if (!currentProfile) {
    batch.set(profileRef, {
      uid,
      displayName: 'Penjelajah BIOVIA',
      xp: nextXp,
      level: nextLevel,
      completedCount: 0,
      dailyChallengeBestScore: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(profileRef, {
      xp: nextXp,
      level: nextLevel,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(attemptRef, {
    userId: uid,
    materialSlug: `game-${gameId}`,
    materialTitle: sanitizeMaterialTitle(`${gameTitle} (${Math.round(score)} pts)`),
    score: normalizedScore,
    correctCount: victory ? 1 : 0,
    totalQuestions: 1,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/quizHistory/${attemptId}`);
  }

  return rewardXp;
}

