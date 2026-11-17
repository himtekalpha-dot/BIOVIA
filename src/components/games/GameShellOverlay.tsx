import { useEffect, type ReactNode } from 'react';
import type { GameCatalogSpec, GameRunResult, GameShellState } from '../../types/biovia';

interface GameShellOverlayProps {
  spec: GameCatalogSpec;
  shellState: GameShellState;
  hp: number;
  maxHp: number;
  score: number;
  bestScore: number;
  phaseLabel: string;
  phaseValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  isMuted: boolean;
  runResult: GameRunResult | null;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onExitToHub: () => void;
  onToggleMute: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  children?: ReactNode;
}

function TitleEmblemSvg({ spec }: { spec: GameCatalogSpec }) {
  if (spec.id === 'darah-3d') {
    return (
      <svg className="game-emblem-svg" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="31" fill="#2c0b14" stroke={spec.accentHex} strokeWidth="2.5" />
        <ellipse cx="36" cy="36" rx="20" ry="14" fill="#e84d5b" />
        <ellipse cx="36" cy="36" rx="10" ry="6" fill="#8b1d2b" />
        <circle cx="52" cy="21" r="6" fill="#5ce6f5" stroke="#0d2336" strokeWidth="2" />
        <circle cx="20" cy="49" r="4.5" fill="#7ff2ff" />
      </svg>
    );
  }
  if (spec.id === 'pencernaan-3d') {
    return (
      <svg className="game-emblem-svg" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="31" fill="#0d2922" stroke={spec.accentHex} strokeWidth="2.5" />
        <rect x="20" y="27" width="32" height="18" rx="9" fill="#18b878" stroke="#d8fff0" strokeWidth="2" />
        <rect x="36" y="27" width="16" height="18" rx="9" fill="#22d3ee" opacity="0.85" />
        <circle cx="29" cy="36" r="3.5" fill="#fef08a" />
      </svg>
    );
  }
  if (spec.id === 'pencernaan-2d') {
    return (
      <svg className="game-emblem-svg" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="31" fill="#291d09" stroke={spec.accentHex} strokeWidth="2.5" />
        <path
          d="M22 23 C44 23, 44 36, 28 36 C16 36, 18 51, 46 51"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="24" cy="23" r="4.5" fill="#38bdf8" />
        <circle cx="34" cy="36" r="4.5" fill="#fb923c" />
        <circle cx="46" cy="51" r="4.5" fill="#34d399" />
      </svg>
    );
  }
  // imun-2d
  return (
    <svg className="game-emblem-svg" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="31" fill="#092434" stroke={spec.accentHex} strokeWidth="2.5" />
      <circle cx="36" cy="36" r="15" fill="#e0f7fa" stroke="#22d3ee" strokeWidth="2.5" />
      <circle cx="36" cy="36" r="6" fill="#0891b2" />
      <path d="M36 12 L36 20 M36 52 L36 60 M12 36 L20 36 M52 36 L60 36" stroke="#5ce6f5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function VitalityPip({ filled, accentHex }: { filled: boolean; accentHex: string }) {
  return (
    <svg className="game-hud-pip" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5 L20 6.5 V12.5 C20 17.2 16.5 20.6 12 22 C7.5 20.6 4 17.2 4 12.5 V6.5 Z"
        fill={filled ? accentHex : 'rgba(15, 23, 42, 0.72)'}
        stroke={filled ? '#ffffff' : 'rgba(148, 163, 184, 0.45)'}
        strokeWidth="1.8"
      />
      {filled && <path d="M12 5.5 L17 8 V12 C17 15.2 14.8 17.6 12 18.8 Z" fill="rgba(255,255,255,0.22)" />}
    </svg>
  );
}

export function GameShellOverlay({
  spec,
  shellState,
  hp,
  maxHp,
  score,
  bestScore,
  phaseLabel,
  phaseValue,
  secondaryLabel,
  secondaryValue,
  isMuted,
  runResult,
  onStart,
  onResume,
  onPause,
  onRestart,
  onReturnTitle,
  onExitToHub,
  onToggleMute,
  onOpenMaterialDetail,
  children,
}: GameShellOverlayProps) {
  useEffect(() => {
    document.body.dataset.state = shellState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [shellState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (shellState === 'title') {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onStart();
        }
        return;
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (shellState === 'playing') {
          e.preventDefault();
          onPause();
        } else if (shellState === 'paused') {
          e.preventDefault();
          onResume();
        }
        return;
      }
      if (e.key.toLowerCase() === 'm') {
        onToggleMute();
      } else if (e.key.toLowerCase() === 'r' && shellState === 'paused') {
        onRestart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState, onStart, onPause, onResume, onToggleMute, onRestart]);

  const pipCount = Math.min(8, Math.max(1, maxHp));
  const filledPips = Math.max(0, Math.min(pipCount, Math.ceil((hp / Math.max(1, maxHp)) * pipCount)));

  return (
    <div className="game-hud-layer" data-game-state={shellState}>
      {/* TITLE SCREEN OVERLAY */}
      {shellState === 'title' && (
        <div className="game-title-overlay">
          <div className="game-title-panel">
            <TitleEmblemSvg spec={spec} />
            <div className="game-title-meta">
              <span>{spec.format.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{spec.genreLabel}</span>
            </div>
            <h1 className="game-title-heading">{spec.title}</h1>
            <p className="game-title-summary">{spec.summary}</p>

            <div className="game-title-actions">
              <button
                type="button"
                className="game-cta-primary"
                data-start="true"
                style={{ backgroundColor: spec.accentHex }}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStart();
                }}
              >
                Mulai Bermain →
              </button>
              <button
                type="button"
                className="game-cta-ghost"
                onClick={onExitToHub}
              >
                ← Daftar Game
              </button>
            </div>
          </div>

          <div className="game-title-controls-line">{spec.controlsHint}</div>
        </div>
      )}

      {/* PLAYING HUD PERIMETER CLUSTERS */}
      {shellState === 'playing' && (
        <>
          <div className="game-hud-cluster top-left">
            <div className="game-hud-pips-row" aria-label={`Ketahanan ${hp} dari ${maxHp}`}>
              <div className="game-hud-pips">
                {Array.from({ length: pipCount }, (_, i) => (
                  <VitalityPip key={i} filled={i < filledPips} accentHex={spec.accentHex} />
                ))}
              </div>
              <span className="game-hud-kicker">KETAHANAN</span>
              <strong className="game-hud-num tabular-nums">
                {Math.max(0, Math.round(hp))}/{maxHp}
              </strong>
            </div>

            <div className="game-hud-metrics-strip">
              <div className="game-hud-stat">
                <span className="game-hud-kicker">SKOR</span>
                <strong className="game-hud-hero-num tabular-nums">{Math.round(score)}</strong>
              </div>
              <div className="game-hud-stat">
                <span className="game-hud-kicker">{phaseLabel}</span>
                <strong className="game-hud-num tabular-nums">{phaseValue}</strong>
              </div>
              {secondaryLabel && secondaryValue && (
                <div className="game-hud-stat">
                  <span className="game-hud-kicker">{secondaryLabel}</span>
                  <strong className="game-hud-num tabular-nums">{secondaryValue}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="game-hud-cluster top-right">
            <button
              type="button"
              className="game-icon-btn"
              tabIndex={-1}
              aria-label={isMuted ? 'Aktifkan suara game' : 'Matikan suara game'}
              title={isMuted ? 'Suara Mati (M)' : 'Suara Aktif (M)'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 010 7" />
                  <path d="M18.5 6a9 9 0 010 12" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="game-icon-btn"
              tabIndex={-1}
              aria-label="Jeda game"
              title="Jeda (Esc / P)"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              className="game-exit-btn"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onExitToHub();
              }}
            >
              Keluar
            </button>
          </div>

          {children}
        </>
      )}

      {/* PAUSED MODAL */}
      {shellState === 'paused' && (
        <div className="game-modal-backdrop" role="dialog" aria-modal="true" aria-label="Game Dijeda">
          <div className="game-modal-card">
            <div className="game-title-meta">
              <span>JEDA MISI</span>
              <span aria-hidden="true">·</span>
              <span>{spec.shortTitle}</span>
            </div>
            <h2>Permainan Dijeda</h2>
            <div className="game-modal-stats">
              <div>
                <span>SKOR SAAT INI</span>
                <strong className="tabular-nums">{Math.round(score)}</strong>
              </div>
              <div>
                <span>{phaseLabel}</span>
                <strong className="tabular-nums">{phaseValue}</strong>
              </div>
              <div>
                <span>REKOR TERBAIK</span>
                <strong className="tabular-nums">{Math.max(bestScore, Math.round(score))}</strong>
              </div>
            </div>
            <div className="game-modal-actions">
              <button
                type="button"
                className="game-cta-primary"
                style={{ backgroundColor: spec.accentHex }}
                onClick={onResume}
              >
                Lanjutkan Bermain
              </button>
              <button type="button" className="game-cta-secondary" onClick={onRestart}>
                Ulangi Misi
              </button>
              <div className="game-modal-subactions">
                <button type="button" className="game-cta-ghost" onClick={onReturnTitle}>
                  Layar Judul
                </button>
                <button type="button" className="game-cta-ghost" onClick={onExitToHub}>
                  Daftar Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL */}
      {shellState === 'gameover' && runResult && (
        <div
          className="game-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={runResult.victory ? 'Misi Berhasil' : 'Misi Berakhir'}
        >
          <div className="game-modal-card">
            <div className="game-title-meta">
              <span>{runResult.victory ? 'MISI BERHASIL' : 'KETAHANAN HABIS'}</span>
              <span aria-hidden="true">·</span>
              <span>+{runResult.xpEarned} XP</span>
            </div>
            <h2>{runResult.victory ? 'Luar Biasa! Misi Tuntas' : 'Coba Lagi, Penjelajah!'}</h2>

            <div className="game-modal-stats">
              <div>
                <span>SKOR AKHIR</span>
                <strong className="tabular-nums">{Math.round(runResult.score)}</strong>
              </div>
              <div>
                <span>{runResult.primaryStatLabel}</span>
                <strong className="tabular-nums">{runResult.primaryStatValue}</strong>
              </div>
              <div>
                <span>{runResult.secondaryStatLabel}</span>
                <strong className="tabular-nums">{runResult.secondaryStatValue}</strong>
              </div>
            </div>

            <div className="game-modal-actions">
              <button
                type="button"
                className="game-cta-primary"
                data-start="true"
                style={{ backgroundColor: spec.accentHex }}
                onClick={onRestart}
              >
                {runResult.victory ? 'Main Lagi' : 'Coba Lagi'}
              </button>
              <button
                type="button"
                className="game-cta-secondary"
                onClick={() => onOpenMaterialDetail(spec.materialSlug)}
              >
                Pelajari Materi Terkait →
              </button>
              <button type="button" className="game-cta-ghost" onClick={onExitToHub}>
                ← Kembali ke Daftar Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
