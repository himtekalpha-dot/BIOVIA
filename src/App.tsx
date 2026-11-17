import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { DashboardView } from './components/DashboardView';
import { DetailView, type MaterialQuizSubmitPayload } from './components/DetailView';
import { GameHubView } from './components/GameHubView';
import { JelajahiView } from './components/JelajahiView';
import { Lab3DView } from './components/Lab3DView';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';
import { Sidebar } from './components/Sidebar';
import { SimulasiView } from './components/SimulasiView';
import { Topbar } from './components/Topbar';
import { EDUCATIONAL_GAMES_BY_ID } from './data/games';
import { auth, googleProvider } from './firebase';
import {
  ensureStudentDocuments,
  recordDailyChallengeResult,
  recordGameCompletionReward,
  recordMaterialQuizResult,
  subscribeMaterialProgress,
  subscribeQuizHistory,
  subscribeStudentProfile,
  updateStudentDisplayName,
} from './services/bioviaDb';
import type {
  ActivePage,
  GameId,
  GameRunResult,
  MaterialCategory,
  MaterialProgressDoc,
  QuizAttemptDoc,
  StudentProfileDoc,
} from './types/biovia';

interface InitialUrlState {
  page: ActivePage;
  materialId: string;
  gameId: GameId | null;
  autostart: boolean;
  isGuestEntry: boolean;
}

function parseUrlState(): InitialUrlState {
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const materiParam = params.get('materi');
  if (materiParam) {
    return { page: 'detail', materialId: materiParam, gameId: null, autostart, isGuestEntry: true };
  }
  const pageParam = params.get('page');
  if (pageParam === 'jelajahi') {
    return { page: 'jelajahi', materialId: '', gameId: null, autostart, isGuestEntry: true };
  }
  if (pageParam === 'lab3d') {
    return { page: 'lab3d', materialId: '', gameId: null, autostart, isGuestEntry: true };
  }
  if (pageParam === 'simulasi') {
    return { page: 'simulasi', materialId: '', gameId: null, autostart, isGuestEntry: true };
  }
  if (pageParam === 'game') {
    const playParam = params.get('play') as GameId | null;
    const validGameId = playParam && playParam in EDUCATIONAL_GAMES_BY_ID ? playParam : null;
    return { page: 'game', materialId: '', gameId: validGameId, autostart, isGuestEntry: true };
  }
  if (pageParam === 'login') {
    return { page: 'login', materialId: '', gameId: null, autostart: false, isGuestEntry: false };
  }
  if (autostart) {
    return { page: 'dashboard', materialId: '', gameId: null, autostart: true, isGuestEntry: true };
  }
  return { page: 'login', materialId: '', gameId: null, autostart: false, isGuestEntry: false };
}

function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum proses masuk selesai.';
    case 'auth/popup-blocked':
      return 'Popup login diblokir oleh browser. Izinkan popup untuk melanjutkan atau gunakan Mode Tamu.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login sebelumnya dibatalkan. Silakan klik tombol masuk lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet terputus. Periksa jaringanmu lalu coba kembali.';
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi belum diizinkan pada pengaturan Firebase Authentication.';
    default:
      return 'Terjadi kendala saat masuk dengan Google. Silakan coba lagi atau gunakan Mode Tamu.';
  }
}

export default function App() {
  const initial = parseUrlState();
  const [activePage, setActivePage] = useState<ActivePage>(initial.page);
  const [activeMaterialId, setActiveMaterialId] = useState<string>(initial.materialId);
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLabFullscreen, setIsLabFullscreen] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<GameId | null>(initial.gameId);
  const [gameAutostart, setGameAutostart] = useState<boolean>(initial.autostart);
  const [gameBestScores, setGameBestScores] = useState<Partial<Record<GameId, number>>>(() => {
    try {
      const saved = window.localStorage.getItem('biovia_game_best_scores');
      return saved ? (JSON.parse(saved) as Partial<Record<GameId, number>>) : {};
    } catch {
      return {};
    }
  });

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState<boolean>(initial.isGuestEntry);
  const [authError, setAuthError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileDoc | null>(null);
  const [materialProgressMap, setMaterialProgressMap] = useState<
    Record<string, MaterialProgressDoc>
  >({});
  const [quizHistory, setQuizHistory] = useState<QuizAttemptDoc[]>([]);
  const [quizSaveStatus, setQuizSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );

  const [completedSlugs, setCompletedSlugs] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('biovia_completed_slugs');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const activePageRef = useRef<ActivePage>(activePage);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  }, []);

  const syncUrl = useCallback((page: ActivePage, extraParam?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('materi');
    url.searchParams.delete('play');
    url.searchParams.delete('autostart');
    if (page === 'login') {
      url.searchParams.set('page', 'login');
    } else if (page === 'jelajahi') {
      url.searchParams.set('page', 'jelajahi');
    } else if (page === 'lab3d') {
      url.searchParams.set('page', 'lab3d');
    } else if (page === 'simulasi') {
      url.searchParams.set('page', 'simulasi');
    } else if (page === 'game') {
      url.searchParams.set('page', 'game');
      if (extraParam) {
        url.searchParams.set('play', extraParam);
      }
    } else if (page === 'detail' && extraParam) {
      url.searchParams.set('materi', extraParam);
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  const navigateToLogin = useCallback(() => {
    setAuthError(null);
    setIsLabFullscreen(false);
    setActiveGameId(null);
    setActivePage('login');
    setIsMobileSidebarOpen(false);
    syncUrl('login');
    document.title = 'Masuk | BIOVIA — Virtual Biology Lab';
  }, [syncUrl]);

  const navigateToDashboard = useCallback(() => {
    setIsLabFullscreen(false);
    setActiveGameId(null);
    setActivePage('dashboard');
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
    syncUrl('dashboard');
    document.title = 'BIOVIA — Virtual Biology Lab';
  }, [syncUrl]);

  const navigateToJelajahi = useCallback(
    (category: MaterialCategory | 'all' = 'all') => {
      setIsLabFullscreen(false);
      setActiveGameId(null);
      setActivePage('jelajahi');
      setActiveCategory(category);
      setSearchQuery('');
      setIsMobileSidebarOpen(false);
      syncUrl('jelajahi');
      document.title = 'BIOVIA — Jelajahi Materi';
    },
    [syncUrl]
  );

  const navigateToLab3D = useCallback(() => {
    setIsLabFullscreen(false);
    setActiveGameId(null);
    setActivePage('lab3d');
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
    syncUrl('lab3d');
    document.title = 'Laboratorium 3D | BIOVIA';
  }, [syncUrl]);

  const navigateToSimulasi = useCallback(() => {
    setIsLabFullscreen(false);
    setActiveGameId(null);
    setActivePage('simulasi');
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
    syncUrl('simulasi');
    document.title = 'Simulasi Interaktif | BIOVIA';
  }, [syncUrl]);

  const navigateToGameHub = useCallback(
    (gameId: GameId | null = null) => {
      setIsLabFullscreen(false);
      setGameAutostart(false);
      setActiveGameId(gameId);
      setActivePage('game');
      setSearchQuery('');
      setIsMobileSidebarOpen(false);
      syncUrl('game', gameId ?? undefined);
      document.title = gameId
        ? `${EDUCATIONAL_GAMES_BY_ID[gameId].title} | BIOVIA`
        : 'Game Edukasi | BIOVIA';
    },
    [syncUrl]
  );

  const openMaterialDetail = useCallback(
    (slug: string) => {
      setQuizSaveStatus('idle');
      setIsLabFullscreen(false);
      setActiveGameId(null);
      setActivePage('detail');
      setActiveMaterialId(slug);
      setIsMobileSidebarOpen(false);
      syncUrl('detail', slug);
    },
    [syncUrl]
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (currentUser) {
        setGuestMode(false);
        setAuthError(null);
        if (activePageRef.current === 'login') {
          setActivePage('dashboard');
          const url = new URL(window.location.href);
          if (url.searchParams.get('page') === 'login') {
            url.searchParams.delete('page');
            window.history.replaceState({}, '', url.toString());
          }
          document.title = 'BIOVIA — Virtual Biology Lab';
        }
      } else {
        setStudentProfile(null);
        setMaterialProgressMap({});
        setQuizHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore provisioning + realtime subscriptions when user is authenticated & verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }

    let cancelled = false;
    let unsubProfile: (() => void) | null = null;
    let unsubProgress: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;

    const setup = async () => {
      try {
        await ensureStudentDocuments(user);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          showToast('Gagal menyiapkan profil database siswa.');
        }
      }

      if (cancelled) return;

      unsubProfile = subscribeStudentProfile(
        user.uid,
        (profile) => setStudentProfile(profile),
        () => showToast('Gagal memuat profil dari database.')
      );
      unsubProgress = subscribeMaterialProgress(
        user.uid,
        (progress) => setMaterialProgressMap(progress),
        () => showToast('Gagal memuat progres materi dari database.')
      );
      unsubHistory = subscribeQuizHistory(
        user.uid,
        (history) => setQuizHistory(history),
        () => showToast('Gagal memuat riwayat kuis.')
      );
    };

    void setup();

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubProgress?.();
      unsubHistory?.();
    };
  }, [authReady, user, showToast]);

  useEffect(() => {
    if (activePage === 'login') {
      document.title = 'Masuk | BIOVIA — Virtual Biology Lab';
    }
  }, [activePage]);

  const handleGoogleLogin = useCallback(async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setGuestMode(false);
        setActivePage('dashboard');
        syncUrl('dashboard');
        document.title = 'BIOVIA — Virtual Biology Lab';
        showToast(
          `Selamat datang kembali, ${(cred.user.displayName ?? 'Penjelajah').split(' ')[0]}!`
        );
      }
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    }
  }, [showToast, syncUrl]);

  const handleContinueAsGuest = useCallback(() => {
    setAuthError(null);
    setGuestMode(true);
    navigateToDashboard();
    showToast('Masuk sebagai Tamu. Progres tersimpan secara lokal di browser.');
  }, [navigateToDashboard, showToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setGuestMode(false);
      setIsProfileModalOpen(false);
      navigateToLogin();
      showToast('Kamu telah keluar dari akun BIOVIA.');
    } catch {
      showToast('Gagal keluar dari akun. Silakan coba lagi.');
    }
  }, [navigateToLogin, showToast]);

  const handleMaterialQuizCompleted = useCallback(
    async (payload: MaterialQuizSubmitPayload) => {
      if (user && user.emailVerified) {
        setQuizSaveStatus('saving');
        try {
          await recordMaterialQuizResult({
            uid: user.uid,
            materialSlug: payload.slug,
            title: payload.title,
            category: payload.category,
            score: payload.score,
            correctCount: payload.correctCount,
            totalQuestions: payload.totalQuestions,
            currentProfile: studentProfile,
            existingProgress: materialProgressMap[payload.slug],
          });
          setQuizSaveStatus('saved');
          showToast('Hasil kuis dan XP berhasil disimpan ke database!');
        } catch {
          setQuizSaveStatus('error');
          showToast('Gagal menyimpan hasil kuis ke database cloud.');
        }
        return;
      }

      // Guest local fallback
      if (payload.score >= 60) {
        setCompletedSlugs((prev) => {
          if (prev.includes(payload.slug)) return prev;
          const next = [...prev, payload.slug];
          try {
            window.localStorage.setItem('biovia_completed_slugs', JSON.stringify(next));
          } catch {
            // Ignore storage quota errors
          }
          return next;
        });
      }
    },
    [user, studentProfile, materialProgressMap, showToast]
  );

  const handleDailyChallengeCompleted = useCallback(
    async (payload: { score: number; correctCount: number; totalQuestions: number }) => {
      if (!user || !user.emailVerified) return;
      try {
        await recordDailyChallengeResult({
          uid: user.uid,
          score: payload.score,
          correctCount: payload.correctCount,
          totalQuestions: payload.totalQuestions,
          currentProfile: studentProfile,
        });
        showToast('Skor Tantangan Hari Ini disimpan ke database!');
      } catch {
        showToast('Gagal menyimpan skor Tantangan Hari Ini.');
      }
    },
    [user, studentProfile, showToast]
  );

  const handleUpdateDisplayName = useCallback(
    async (nextName: string) => {
      if (!user) return;
      await updateStudentDisplayName(user.uid, nextName);
      showToast('Nama profil diperbarui di database.');
    },
    [user, showToast]
  );

  const handleGameCompleted = useCallback(
    (result: GameRunResult) => {
      setGameBestScores((prev) => {
        const nextBest = Math.max(prev[result.gameId] ?? 0, Math.round(result.score));
        const updated = { ...prev, [result.gameId]: nextBest };
        try {
          window.localStorage.setItem('biovia_game_best_scores', JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
        return updated;
      });

      if (user && user.emailVerified) {
        const spec = EDUCATIONAL_GAMES_BY_ID[result.gameId];
        void recordGameCompletionReward({
          uid: user.uid,
          gameId: result.gameId,
          gameTitle: spec.title,
          score: result.score,
          victory: result.victory,
          currentProfile: studentProfile,
        })
          .then((xp) => showToast(`Skor tersimpan! +${xp} XP ditambahkan ke profil.`))
          .catch(() => showToast('Gagal menyimpan XP game ke database cloud.'));
      }
    },
    [user, studentProfile, showToast]
  );

  useEffect(() => {
    const onPopState = () => {
      const next = parseUrlState();
      setActivePage(next.page);
      setActiveMaterialId(next.materialId);
      setActiveGameId(next.gameId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isMobileSidebarOpen || window.innerWidth > 980) return;
      const sidebarEl = document.getElementById('sidebar');
      const mobileBtn = document.getElementById('mobileMenu');
      const target = event.target as Node;
      if (sidebarEl && !sidebarEl.contains(target) && mobileBtn && !mobileBtn.contains(target)) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMobileSidebarOpen]);

  // Show LoginPage when activePage is 'login' (and not authenticated or explicitly on login view)
  if (activePage === 'login' && (!user || !guestMode)) {
    return (
      <>
        <LoginPage
          isLoadingAuth={!authReady}
          authError={authError}
          onGoogleLogin={handleGoogleLogin}
          onContinueAsGuest={handleContinueAsGuest}
        />
        <div
          className={`toast${toastVisible ? ' show' : ''}`}
          id="toast"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      </>
    );
  }

  if (activePage === 'detail') {
    return (
      <>
        <DetailView
          materialId={activeMaterialId}
          isAuthenticated={Boolean(user && user.emailVerified)}
          existingProgress={materialProgressMap[activeMaterialId]}
          saveStatus={quizSaveStatus}
          onNavigateDashboard={navigateToDashboard}
          onNavigateJelajahi={() => navigateToJelajahi(activeCategory)}
          onQuizCompleted={handleMaterialQuizCompleted}
        />
        <div
          className={`toast${toastVisible ? ' show' : ''}`}
          id="toast"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      </>
    );
  }

  const isFullViewportGame = activePage === 'game' && activeGameId !== null;
  const appShellClassName =
    ((activePage === 'lab3d' || activePage === 'simulasi') && isLabFullscreen) ||
    isFullViewportGame
      ? 'app-shell lab3d-fullscreen'
      : 'app-shell';

  return (
    <div className={appShellClassName}>
      <Sidebar
        activePage={activePage}
        isOpen={isMobileSidebarOpen}
        user={user}
        onNavigate={(page) => {
          if (page === 'dashboard') navigateToDashboard();
          else if (page === 'jelajahi') navigateToJelajahi('all');
          else if (page === 'lab3d') navigateToLab3D();
          else if (page === 'simulasi') navigateToSimulasi();
          else if (page === 'game') navigateToGameHub(null);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLogin={navigateToLogin}
        onSignOut={handleSignOut}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onComingSoon={(label) => showToast(`${label} akan dikembangkan pada tahap berikutnya.`)}
      />

      <main className="main-area" id="dashboard">
        <Topbar
          activePage={activePage}
          searchQuery={searchQuery}
          searchPlaceholder={
            activePage === 'jelajahi'
              ? 'Cari materi atau topik...'
              : 'Cari materi, organ, atau topik...'
          }
          searchInputRef={searchInputRef}
          user={user}
          profile={studentProfile}
          onSearchChange={(value) => {
            setSearchQuery(value);
            if (
              (activePage === 'lab3d' || activePage === 'simulasi' || activePage === 'game') &&
              value.trim()
            ) {
              setIsLabFullscreen(false);
              setActiveGameId(null);
              setActivePage('jelajahi');
              syncUrl('jelajahi');
              document.title = 'BIOVIA — Jelajahi Materi';
            } else if (activePage === 'jelajahi' && value.trim()) {
              document.querySelector('.filter-section')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }
          }}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          onNavigateDashboard={navigateToDashboard}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenLogin={navigateToLogin}
          onSignOut={handleSignOut}
          onShowToast={showToast}
        />

        {activePage === 'dashboard' ? (
          <DashboardView
            user={user}
            profile={studentProfile}
            searchQuery={searchQuery}
            completedSlugs={completedSlugs}
            onNavigateJelajahi={(cat) => navigateToJelajahi(cat ?? 'all')}
            onOpenMaterialDetail={openMaterialDetail}
            onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onShowToast={showToast}
          />
        ) : activePage === 'lab3d' ? (
          <Lab3DView
            progressMap={materialProgressMap}
            isFullscreen={isLabFullscreen}
            onFullscreenChange={setIsLabFullscreen}
            onOpenMaterialDetail={openMaterialDetail}
          />
        ) : activePage === 'simulasi' ? (
          <SimulasiView
            progressMap={materialProgressMap}
            isFullscreen={isLabFullscreen}
            onFullscreenChange={setIsLabFullscreen}
            onOpenMaterialDetail={openMaterialDetail}
          />
        ) : activePage === 'game' ? (
          <GameHubView
            activeGameId={activeGameId}
            autostartGame={gameAutostart}
            bestScores={gameBestScores}
            onSelectGame={(id) => navigateToGameHub(id)}
            onExitGame={() => navigateToGameHub(null)}
            onOpenMaterialDetail={openMaterialDetail}
            onGameCompleted={handleGameCompleted}
          />
        ) : (
          <JelajahiView
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            progressMap={materialProgressMap}
            onCategoryChange={setActiveCategory}
            onSearchChange={setSearchQuery}
            onOpenMaterialDetail={openMaterialDetail}
          />
        )}
      </main>

      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        isAuthenticated={Boolean(user && user.emailVerified)}
        onClose={() => setIsDailyChallengeOpen(false)}
        onChallengeCompleted={handleDailyChallengeCompleted}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        user={user}
        profile={studentProfile}
        progressMap={materialProgressMap}
        quizHistory={quizHistory}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateName={handleUpdateDisplayName}
        onSignOut={handleSignOut}
        onOpenLogin={navigateToLogin}
      />

      <div
        className={`toast${toastVisible ? ' show' : ''}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </div>
  );
}
