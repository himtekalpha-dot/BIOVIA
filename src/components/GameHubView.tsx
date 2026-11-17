import { useMemo, useState } from 'react';
import { EDUCATIONAL_GAMES } from '../data/games';
import type { GameCatalogSpec, GameFormat, GameId, GameRunResult } from '../types/biovia';
import { Bloodstream3DGame } from './games/Bloodstream3DGame';
import { Digestive3DGame } from './games/Digestive3DGame';
import { DigestivePuzzle2DGame } from './games/DigestivePuzzle2DGame';
import { ImmuneDefense2DGame } from './games/ImmuneDefense2DGame';

interface GameHubViewProps {
  activeGameId: GameId | null;
  autostartGame: boolean;
  bestScores: Partial<Record<GameId, number>>;
  onSelectGame: (gameId: GameId) => void;
  onExitGame: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  onGameCompleted: (result: GameRunResult) => void;
}

function GameCardArt({ game }: { game: GameCatalogSpec }) {
  if (game.id === 'imun-2d') {
    return (
      <svg className="gamehub-art-svg" viewBox="0 0 220 110" aria-hidden="true">
        <rect width="220" height="110" rx="10" fill="#2c0b18" />
        <circle cx="54" cy="55" r="24" fill="#e0f9fc" stroke="#22d3ee" strokeWidth="3" />
        <circle cx="49" cy="51" r="8" fill="#0e7490" />
        <circle cx="58" cy="60" r="6" fill="#0e7490" />
        <circle cx="118" cy="55" r="5" fill="#5ee7f5" />
        <circle cx="142" cy="55" r="5" fill="#5ee7f5" />
        <circle cx="176" cy="40" r="14" fill="#a855f7" stroke="#f3e8ff" strokeWidth="2" />
        <polygon points="175,68 188,75 188,90 175,97 162,90 162,75" fill="#ec4899" stroke="#fbcfe8" strokeWidth="2" />
      </svg>
    );
  }
  if (game.id === 'pencernaan-2d') {
    return (
      <svg className="gamehub-art-svg" viewBox="0 0 220 110" aria-hidden="true">
        <rect width="220" height="110" rx="10" fill="#21180c" />
        <path
          d="M36 32 C98 32, 98 56, 62 56 C30 56, 36 82, 184 82"
          fill="none"
          stroke="#b45309"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="48" cy="32" r="9" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2" />
        <circle cx="96" cy="56" r="9" fill="#fb923c" stroke="#ffedd5" strokeWidth="2" />
        <circle cx="144" cy="82" r="9" fill="#facc15" stroke="#fef9c3" strokeWidth="2" />
        <circle cx="182" cy="82" r="9" fill="#34d399" stroke="#d1fae5" strokeWidth="2" />
      </svg>
    );
  }
  if (game.id === 'darah-3d') {
    return (
      <svg className="gamehub-art-svg" viewBox="0 0 220 110" aria-hidden="true">
        <rect width="220" height="110" rx="10" fill="#330c18" />
        <ellipse cx="110" cy="55" rx="88" ry="38" fill="none" stroke="#881d34" strokeWidth="4" />
        <ellipse cx="110" cy="55" rx="60" ry="26" fill="none" stroke="#a6243f" strokeWidth="3" />
        <ellipse cx="105" cy="58" rx="28" ry="18" fill="#e84d5b" />
        <ellipse cx="105" cy="58" rx="14" ry="8" fill="#8b1d2b" />
        <circle cx="122" cy="40" r="8" fill="#6ef2ff" stroke="#ffffff" strokeWidth="2" />
        <circle cx="164" cy="48" r="6" fill="#facc15" />
      </svg>
    );
  }
  return (
    <svg className="gamehub-art-svg" viewBox="0 0 220 110" aria-hidden="true">
      <rect width="220" height="110" rx="10" fill="#18221d" />
      <ellipse cx="110" cy="55" rx="86" ry="38" fill="none" stroke="#6d4c3d" strokeWidth="4" />
      <rect x="82" y="42" width="56" height="26" rx="13" fill="#16b877" stroke="#a7f3d0" strokeWidth="2" />
      <rect x="110" y="42" width="28" height="26" rx="13" fill="#22d3ee" opacity="0.85" />
      <circle cx="52" cy="44" r="7" fill="#34d399" />
      <circle cx="168" cy="64" r="8" fill="#fbbf24" />
    </svg>
  );
}

export function GameHubView({
  activeGameId,
  autostartGame,
  bestScores,
  onSelectGame,
  onExitGame,
  onOpenMaterialDetail,
  onGameCompleted,
}: GameHubViewProps) {
  const [formatFilter, setFormatFilter] = useState<GameFormat | 'all'>('all');

  const filteredGames = useMemo(() => {
    if (formatFilter === 'all') return EDUCATIONAL_GAMES;
    return EDUCATIONAL_GAMES.filter((g) => g.format === formatFilter);
  }, [formatFilter]);

  if (activeGameId) {
    const best = bestScores[activeGameId] ?? 0;
    return (
      <section className="game-shell-stage" aria-label="Area Permainan Edukasi">
        {activeGameId === 'imun-2d' && (
          <ImmuneDefense2DGame
            autostart={autostartGame}
            bestScore={best}
            onExitToHub={onExitGame}
            onOpenMaterialDetail={onOpenMaterialDetail}
            onRunFinished={onGameCompleted}
          />
        )}
        {activeGameId === 'pencernaan-2d' && (
          <DigestivePuzzle2DGame
            autostart={autostartGame}
            bestScore={best}
            onExitToHub={onExitGame}
            onOpenMaterialDetail={onOpenMaterialDetail}
            onRunFinished={onGameCompleted}
          />
        )}
        {activeGameId === 'darah-3d' && (
          <Bloodstream3DGame
            autostart={autostartGame}
            bestScore={best}
            onExitToHub={onExitGame}
            onOpenMaterialDetail={onOpenMaterialDetail}
            onRunFinished={onGameCompleted}
          />
        )}
        {activeGameId === 'pencernaan-3d' && (
          <Digestive3DGame
            autostart={autostartGame}
            bestScore={best}
            onExitToHub={onExitGame}
            onOpenMaterialDetail={onOpenMaterialDetail}
            onRunFinished={onGameCompleted}
          />
        )}
      </section>
    );
  }

  return (
    <div className="content gamehub-page">
      <section className="gamehub-hero">
        <div className="gamehub-hero-copy">
          <span className="gamehub-kicker">PETUALANGAN SAINS INTERAKTIF · 2D &amp; 3D</span>
          <h1>Game Edukasi Biologi</h1>
          <p>
            Pilih format <strong>2D</strong> untuk aksi taktis &amp; strategi enzim, atau format{' '}
            <strong>3D</strong> untuk menjelajahi pembuluh darah serta saluran pencernaan secara
            langsung.
          </p>
        </div>

        <div className="gamehub-filter-bar" role="tablist" aria-label="Filter format game">
          <button
            type="button"
            role="tab"
            aria-selected={formatFilter === 'all'}
            className={`gamehub-tab-btn${formatFilter === 'all' ? ' active' : ''}`}
            onClick={() => setFormatFilter('all')}
          >
            Semua Format (4)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={formatFilter === '2d'}
            className={`gamehub-tab-btn${formatFilter === '2d' ? ' active' : ''}`}
            onClick={() => setFormatFilter('2d')}
          >
            Format 2D (2)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={formatFilter === '3d'}
            className={`gamehub-tab-btn${formatFilter === '3d' ? ' active' : ''}`}
            onClick={() => setFormatFilter('3d')}
          >
            Format 3D (2)
          </button>
        </div>
      </section>

      <section className="gamehub-grid" aria-label="Daftar game edukasi">
        {filteredGames.map((game) => {
          const personalBest = bestScores[game.id] ?? 0;
          return (
            <article key={game.id} className="gamehub-card" data-format={game.format}>
              <div className="gamehub-card-art">
                <GameCardArt game={game} />
              </div>

              <div className="gamehub-card-body">
                <div className="gamehub-meta-line">
                  <span className="gamehub-format-label">
                    Format {game.format.toUpperCase()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{game.genreLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>~{game.estimatedMinutes} Menit</span>
                </div>

                <h2>{game.title}</h2>
                <p>{game.summary}</p>

                <div className="gamehub-card-foot">
                  <div className="gamehub-score-stat">
                    <span>REKOR TERBAIK</span>
                    <strong className="tabular-nums">
                      {personalBest > 0 ? `${personalBest} pts` : 'Belum dimainkan'}
                    </strong>
                  </div>

                  <div className="gamehub-card-actions">
                    <button
                      type="button"
                      className="gamehub-material-link"
                      onClick={() => onOpenMaterialDetail(game.materialSlug)}
                    >
                      Materi
                    </button>
                    <button
                      type="button"
                      className="gamehub-play-btn"
                      data-play-game={game.id}
                      onClick={() => onSelectGame(game.id)}
                    >
                      Mainkan Game →
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
