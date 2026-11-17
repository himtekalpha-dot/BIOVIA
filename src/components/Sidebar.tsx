import type { User } from 'firebase/auth';
import type { ActivePage } from '../types/biovia';

interface SidebarProps {
  activePage: ActivePage;
  isOpen: boolean;
  user: User | null;
  onNavigate: (page: ActivePage) => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onSignOut: () => Promise<void>;
  onCloseMobile: () => void;
  onComingSoon: (label: string) => void;
}

export function Sidebar({
  activePage,
  isOpen,
  user,
  onNavigate,
  onOpenProfile,
  onOpenLogin,
  onSignOut,
  onCloseMobile,
  onComingSoon,
}: SidebarProps) {
  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    onCloseMobile();
  };

  const handleComingClick = (label: string) => {
    onComingSoon(label);
    onCloseMobile();
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar" aria-label="Navigasi samping">
      <button
        type="button"
        className="brand"
        onClick={() => handleNavClick('dashboard')}
        aria-label="BIOVIA beranda"
      >
        <span className="brand-mark">
          <span className="brand-dot" />
          <span className="brand-leaf">✳</span>
        </span>
        <span className="brand-name">
          BIO<span>VIA</span>
          <small>VIRTUAL BIOLOGY LAB</small>
        </span>
      </button>

      <div className="nav-caption">MENU UTAMA</div>
      <nav className="main-nav" aria-label="Navigasi utama">
        <button
          type="button"
          className={`nav-link${activePage === 'dashboard' ? ' active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <span className="nav-icon">⌂</span>
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={`nav-link${activePage === 'jelajahi' ? ' active' : ''}`}
          onClick={() => handleNavClick('jelajahi')}
        >
          <span className="nav-icon">▤</span>
          <span>Jelajahi Materi</span>
        </button>
        <button
          type="button"
          className={`nav-link${activePage === 'lab3d' ? ' active' : ''}`}
          onClick={() => handleNavClick('lab3d')}
        >
          <span className="nav-icon">◉</span>
          <span>Laboratorium 3D</span>
        </button>
        <button
          type="button"
          className={`nav-link${activePage === 'simulasi' ? ' active' : ''}`}
          onClick={() => handleNavClick('simulasi')}
        >
          <span className="nav-icon">⌁</span>
          <span>Simulasi</span>
        </button>
        <button
          type="button"
          className={`nav-link${activePage === 'game' ? ' active' : ''}`}
          onClick={() => handleNavClick('game')}
        >
          <span className="nav-icon">▣</span>
          <span>Game Edukasi</span>
          <span className="nav-badge">4</span>
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => handleComingClick('Kuis & Evaluasi')}
        >
          <span className="nav-icon">☷</span>
          <span>Kuis &amp; Evaluasi</span>
        </button>
      </nav>

      <div className="nav-caption second-caption">PERSONAL</div>
      <nav className="main-nav" aria-label="Menu personal">
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            onOpenProfile();
            onCloseMobile();
          }}
        >
          <span className="nav-icon">◴</span>
          <span>Progres Belajar</span>
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => handleComingClick('Pencapaian')}
        >
          <span className="nav-icon">◇</span>
          <span>Pencapaian</span>
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            onOpenProfile();
            onCloseMobile();
          }}
        >
          <span className="nav-icon">♙</span>
          <span>Profil Saya</span>
        </button>
        {user ? (
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              void onSignOut();
              onCloseMobile();
            }}
          >
            <span className="nav-icon">↪</span>
            <span>Keluar Akun</span>
          </button>
        ) : (
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              onOpenLogin();
              onCloseMobile();
            }}
          >
            <span className="nav-icon">→</span>
            <span>Halaman Login</span>
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-orbit">✦</div>
          <strong>Butuh bantuan belajar?</strong>
          <p>Tanyakan apa saja kepada BIOVIA AI Tutor.</p>
          <button
            type="button"
            className="help-button"
            onClick={() => handleComingClick('BIOVIA AI Tutor')}
          >
            Tanya AI Tutor <span>↗</span>
          </button>
        </div>
        <div className="sidebar-foot">
          <span className="status-dot" /> BIOVIA v1.0 <span>•</span> Belajar jadi seru
        </div>
      </div>
    </aside>
  );
}
