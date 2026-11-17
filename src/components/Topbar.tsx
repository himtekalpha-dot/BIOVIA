import { useState, type RefObject } from 'react';
import type { User } from 'firebase/auth';
import type { ActivePage, StudentProfileDoc } from '../types/biovia';

interface TopbarProps {
  activePage: ActivePage;
  searchQuery: string;
  searchPlaceholder: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  user: User | null;
  profile: StudentProfileDoc | null;
  onSearchChange: (value: string) => void;
  onToggleMobileMenu: () => void;
  onNavigateDashboard: () => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onSignOut: () => Promise<void>;
  onShowToast: (message: string) => void;
}

export function Topbar({
  activePage,
  searchQuery,
  searchPlaceholder,
  searchInputRef,
  user,
  profile,
  onSearchChange,
  onToggleMobileMenu,
  onNavigateDashboard,
  onOpenProfile,
  onOpenLogin,
  onSignOut,
  onShowToast,
}: TopbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const displayName = user
    ? profile?.displayName ?? user.displayName ?? 'Penjelajah BIOVIA'
    : 'Mode Tamu';
  const subLabel = user ? `Level ${profile?.level ?? 1} · Akun Google` : 'Belum login';

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu"
        id="mobileMenu"
        aria-label="Buka navigasi"
        onClick={onToggleMobileMenu}
      >
        ☰
      </button>

      <div className="breadcrumb">
        {activePage === 'jelajahi' ||
        activePage === 'lab3d' ||
        activePage === 'simulasi' ||
        activePage === 'game' ? (
          <>
            <button type="button" onClick={onNavigateDashboard}>
              Dashboard
            </button>
            <b>/</b>
            <strong>
              {activePage === 'lab3d'
                ? 'Laboratorium 3D'
                : activePage === 'simulasi'
                  ? 'Simulasi Interaktif'
                  : activePage === 'game'
                    ? 'Game Edukasi'
                    : 'Jelajahi Materi'}
            </strong>
          </>
        ) : (
          <>
            <span>Halaman</span>
            <b>/</b>
            <strong id="currentPage">Dashboard</strong>
          </>
        )}
      </div>

      <div className="top-actions">
        <label
          className={`search-box${mobileSearchOpen ? ' mobile-expanded' : ''}`}
          onClick={() => {
            if (window.innerWidth <= 650 && !mobileSearchOpen) {
              setMobileSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 0);
            }
          }}
        >
          <span>⌕</span>
          <input
            ref={searchInputRef}
            id="searchInput"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onBlur={() => {
              if (!searchQuery.trim()) setMobileSearchOpen(false);
            }}
            placeholder={searchPlaceholder}
            aria-label="Cari materi"
          />
          <kbd>⌘ K</kbd>
        </label>

        <button
          type="button"
          className="icon-button notification-button"
          aria-label="Notifikasi"
          onClick={() =>
            onShowToast(
              user
                ? 'Semua progres belajarmu tersinkronisasi dengan database.'
                : 'Masuk dengan Google untuk menyimpan progresmu ke database.'
            )
          }
        >
          ♧<i />
        </button>

        <button
          type="button"
          className="profile-trigger"
          onClick={onOpenProfile}
          aria-label="Buka profil saya"
        >
          {user?.photoURL && !avatarFailed ? (
            <img
              src={user.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
          )}
          <div className="profile-text">
            <strong>{displayName}</strong>
            <span>{subLabel}</span>
          </div>
          <span className="profile-chevron">⌄</span>
        </button>

        {user ? (
          <button
            type="button"
            className="topbar-auth-btn logout"
            onClick={() => {
              void onSignOut();
            }}
          >
            Keluar
          </button>
        ) : (
          <button type="button" className="topbar-auth-btn" onClick={onOpenLogin}>
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}
