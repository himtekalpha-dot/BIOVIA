import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EDUCATIONAL_GAMES_BY_ID } from '../../data/games';
import type { GameRunResult, GameShellState } from '../../types/biovia';
import { gameAudio } from '../../utils/gameAudio';
import {
  computeGameXpReward,
  DIGESTIVE_ENZYMES,
  evaluateEnzymeMatch,
  type BolusKind,
  type EnzymeKind,
  type OrganZoneId,
} from '../../utils/gameLogic';
import { GameShellOverlay } from './GameShellOverlay';

interface DigestivePuzzle2DGameProps {
  autostart: boolean;
  bestScore: number;
  onExitToHub: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  onRunFinished: (result: GameRunResult) => void;
}

interface OrganZoneDef {
  id: OrganZoneId;
  name: string;
  subLabel: string;
  color: string;
}

const ORGAN_ZONES: OrganZoneDef[] = [
  { id: 'mulut', name: 'Rongga Mulut', subLabel: 'Enzim Ptialin / Amilase', color: '#38bdf8' },
  { id: 'lambung', name: 'Lambung Asam', subLabel: 'Enzim Pepsin + HCl', color: '#fb923c' },
  { id: 'usus-halus', name: 'Usus Halus', subLabel: 'Lipase + Cairan Empedu', color: '#facc15' },
  { id: 'usus-besar', name: 'Usus Besar', subLabel: 'Pertahanan Flora Probiotik', color: '#34d399' },
];

interface ActiveBolus {
  id: number;
  kind: BolusKind;
  label: string;
  zoneIdx: number; // 0..3
  remainingSec: number;
  maxSec: number;
}

const BOLUS_CATALOG: Array<{ kind: BolusKind; label: string }> = [
  { kind: 'karbohidrat', label: 'Nasi / Amilum' },
  { kind: 'protein', label: 'Telur / Protein' },
  { kind: 'lemak', label: 'Minyak / Lemak' },
  { kind: 'kuman', label: 'Bakteri Pangan' },
];

const TOTAL_BOLUSES_TO_WIN = 12;

export function DigestivePuzzle2DGame({
  autostart,
  bestScore,
  onExitToHub,
  onOpenMaterialDetail,
  onRunFinished,
}: DigestivePuzzle2DGameProps) {
  const spec = EDUCATIONAL_GAMES_BY_ID['pencernaan-2d'];

  const [shellState, setShellState] = useState<GameShellState>(autostart ? 'playing' : 'title');
  const [hp, setHp] = useState(5);
  const [score, setScore] = useState(0);
  const [digestedCount, setDigestedCount] = useState(0);
  const [selectedEnzyme, setSelectedEnzyme] = useState<EnzymeKind>('amilase');
  const [boluses, setBoluses] = useState<ActiveBolus[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState('Pilih enzim (1–4) lalu klik zona organ tempat bolus berada.');
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(() => gameAudio.isMuted());
  const [runResult, setRunResult] = useState<GameRunResult | null>(null);

  const nextIdRef = useRef(1);
  const spawnedCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const scoreRef = useRef(0);
  const digestedRef = useRef(0);
  const shellRef = useRef<GameShellState>(shellState);
  shellRef.current = shellState;

  const resetPuzzle = useCallback((targetState: GameShellState) => {
    nextIdRef.current = 1;
    spawnedCountRef.current = 0;
    elapsedRef.current = 0;
    scoreRef.current = 0;
    digestedRef.current = 0;
    setHp(5);
    setScore(0);
    setDigestedCount(0);
    setSelectedEnzyme('amilase');
    setShowHint(false);
    setRunResult(null);
    setFeedbackMsg('Pilih enzim (1–4) lalu klik zona organ tempat bolus berada.');

    if (targetState === 'playing') {
      spawnedCountRef.current = 2;
      setBoluses([
        { id: nextIdRef.current++, kind: 'karbohidrat', label: 'Nasi / Amilum', zoneIdx: 0, remainingSec: 8, maxSec: 8 },
        { id: nextIdRef.current++, kind: 'protein', label: 'Telur / Protein', zoneIdx: 1, remainingSec: 9, maxSec: 9 },
      ]);
    } else {
      // Ambient preview board on Title screen
      setBoluses([
        { id: 901, kind: 'karbohidrat', label: 'Nasi / Amilum', zoneIdx: 0, remainingSec: 8, maxSec: 8 },
        { id: 902, kind: 'lemak', label: 'Minyak / Lemak', zoneIdx: 2, remainingSec: 8, maxSec: 8 },
      ]);
    }
    setShellState(targetState);
  }, []);

  useEffect(() => {
    resetPuzzle(autostart ? 'playing' : 'title');
  }, [autostart, resetPuzzle]);

  const finishGame = useCallback(
    (victory: boolean, finalScore: number, finalDigested: number) => {
      const xpEarned = computeGameXpReward('pencernaan-2d', finalScore, victory);
      const res: GameRunResult = {
        gameId: 'pencernaan-2d',
        victory,
        score: finalScore,
        elapsedSeconds: Math.round(elapsedRef.current),
        primaryStatLabel: 'BOLUS TEROLAH',
        primaryStatValue: `${finalDigested}/${TOTAL_BOLUSES_TO_WIN}`,
        secondaryStatLabel: 'WAKTU',
        secondaryStatValue: `${Math.round(elapsedRef.current)} dtk`,
        xpEarned,
      };
      setRunResult(res);
      setShellState('gameover');
      onRunFinished(res);
      if (victory) gameAudio.playVictory();
      else gameAudio.playDefeat();
    },
    [onRunFinished]
  );

  // Hotkeys 1-4 for enzyme selection + H for Hint
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shellRef.current !== 'playing') return;
      if (e.key === '1') setSelectedEnzyme('amilase');
      else if (e.key === '2') setSelectedEnzyme('pepsin');
      else if (e.key === '3') setSelectedEnzyme('lipase');
      else if (e.key === '4') setSelectedEnzyme('probiotik');
      else if (e.key.toLowerCase() === 'h') setShowHint((prev) => !prev);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Deterministic puzzle board tick (250ms steps)
  useEffect(() => {
    if (shellState !== 'playing') return;
    const timer = window.setInterval(() => {
      elapsedRef.current += 0.25;
      setBoluses((prev) => {
        let hpLoss = 0;
        const nextList: ActiveBolus[] = [];
        for (const item of prev) {
          const rem = item.remainingSec - 0.25;
          if (rem <= 0) {
            if (item.zoneIdx < 3) {
              nextList.push({
                ...item,
                zoneIdx: item.zoneIdx + 1,
                remainingSec: 6.5,
                maxSec: 6.5,
              });
            } else {
              hpLoss += 1;
            }
          } else {
            nextList.push({ ...item, remainingSec: rem });
          }
        }

        if (hpLoss > 0) {
          gameAudio.playHurt();
          setFeedbackMsg('Bolus terlewat dari Usus Besar! Ketahanan mukosa berkurang.');
          setHp((curHp) => {
            const updatedHp = Math.max(0, curHp - hpLoss);
            if (updatedHp <= 0) {
              window.setTimeout(() => {
                finishGame(false, scoreRef.current, digestedRef.current);
              }, 80);
            }
            return updatedHp;
          });
        }

        // Spawn next bolus if below cap and under win target
        const remainingNeeded = TOTAL_BOLUSES_TO_WIN - digestedCount;
        if (nextList.length < 3 && nextList.length < remainingNeeded && spawnedCountRef.current < TOTAL_BOLUSES_TO_WIN) {
          const template = BOLUS_CATALOG[spawnedCountRef.current % BOLUS_CATALOG.length];
          spawnedCountRef.current += 1;
          nextList.push({
            id: nextIdRef.current++,
            kind: template.kind,
            label: template.label,
            zoneIdx: 0,
            remainingSec: 7.5,
            maxSec: 7.5,
          });
        }

        return nextList;
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [shellState, digestedCount, score, finishGame]);

  const handleDeployAtZone = (zoneIdx: number) => {
    if (shellState !== 'playing') return;
    const zone = ORGAN_ZONES[zoneIdx];
    const target = boluses.find((b) => b.zoneIdx === zoneIdx);
    if (!target) {
      setFeedbackMsg(`Belum ada bolus di ${zone.name}. Tunggu atau klik zona yang berisi bolus.`);
      return;
    }

    const evalRes = evaluateEnzymeMatch(selectedEnzyme, target.kind, zone.id);
    setFeedbackMsg(evalRes.feedback);

    if (!evalRes.matched) {
      gameAudio.playHurt();
      return;
    }

    gameAudio.playPlace();
    const nextScore = score + evalRes.points;
    const nextDigested = digestedCount + 1;
    scoreRef.current = nextScore;
    digestedRef.current = nextDigested;
    setScore(nextScore);
    setDigestedCount(nextDigested);

    setBoluses((prev) => {
      const filtered = prev.filter((b) => b.id !== target.id);
      if (
        filtered.length === 0 &&
        nextDigested < TOTAL_BOLUSES_TO_WIN &&
        spawnedCountRef.current < TOTAL_BOLUSES_TO_WIN
      ) {
        const template = BOLUS_CATALOG[spawnedCountRef.current % BOLUS_CATALOG.length];
        spawnedCountRef.current += 1;
        filtered.push({
          id: nextIdRef.current++,
          kind: template.kind,
          label: template.label,
          zoneIdx: 0,
          remainingSec: 7.5,
          maxSec: 7.5,
        });
      }
      return filtered;
    });

    if (nextDigested >= TOTAL_BOLUSES_TO_WIN) {
      finishGame(true, nextScore + hp * 50, nextDigested);
    }
  };

  const leadBolus = boluses[0] ?? null;
  const recommendedEnzyme = useMemo(() => {
    if (!leadBolus) return null;
    return DIGESTIVE_ENZYMES.find((e) => e.targetBolus === leadBolus.kind) ?? null;
  }, [leadBolus]);

  return (
    <div className="game-viewport digestive-2d-bg" data-game-id="pencernaan-2d">
      {/* 2D Digestive Organ Board */}
      <div className="puzzle2d-board-wrap">
        <div className="puzzle2d-stage-grid" role="region" aria-label="Papan Saluran Pencernaan 2D">
          {ORGAN_ZONES.map((zone, zIdx) => {
            const zoneBoluses = boluses.filter((b) => b.zoneIdx === zIdx);
            const isHintTarget = showHint && leadBolus?.zoneIdx === zIdx;
            return (
              <button
                key={zone.id}
                type="button"
                className={`puzzle2d-zone-card${zoneBoluses.length > 0 ? ' has-bolus' : ''}${
                  isHintTarget ? ' hint-highlight' : ''
                }`}
                onClick={() => handleDeployAtZone(zIdx)}
              >
                <div className="puzzle2d-zone-head">
                  <span className="puzzle2d-zone-step tabular-nums">0{zIdx + 1}</span>
                  <div>
                    <strong>{zone.name}</strong>
                    <span>{zone.subLabel}</span>
                  </div>
                </div>

                <div className="puzzle2d-bolus-slot">
                  {zoneBoluses.length === 0 ? (
                    <span className="puzzle2d-empty-slot">Saluran Kosong</span>
                  ) : (
                    zoneBoluses.map((b) => (
                      <div key={b.id} className={`puzzle2d-bolus-token kind-${b.kind}`}>
                        <strong>{b.label}</strong>
                        <span className="tabular-nums">{b.remainingSec.toFixed(1)}s</span>
                      </div>
                    ))
                  )}
                </div>

                <span className="puzzle2d-zone-cta">
                  {zoneBoluses.length > 0 ? 'Lepas Enzim Terpilih →' : 'Menunggu Bolus'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <GameShellOverlay
        spec={spec}
        shellState={shellState}
        hp={hp}
        maxHp={5}
        score={score}
        bestScore={bestScore}
        phaseLabel="BOLUS TEROLAH"
        phaseValue={`${digestedCount}/${TOTAL_BOLUSES_TO_WIN}`}
        isMuted={isMuted}
        runResult={runResult}
        onStart={() => resetPuzzle('playing')}
        onResume={() => setShellState('playing')}
        onPause={() => setShellState('paused')}
        onRestart={() => resetPuzzle('playing')}
        onReturnTitle={() => resetPuzzle('title')}
        onExitToHub={onExitToHub}
        onToggleMute={() => setIsMuted(gameAudio.toggleMute())}
        onOpenMaterialDetail={onOpenMaterialDetail}
      >
        {/* Unified Bottom Enzyme Selection Strip */}
        <div className="puzzle2d-dock">
          <div className="puzzle2d-feedback-row">
            <span>{feedbackMsg}</span>
            <button
              type="button"
              className={`puzzle2d-hint-btn${showHint ? ' active' : ''}`}
              onClick={() => setShowHint((prev) => !prev)}
            >
              {showHint && recommendedEnzyme
                ? `Petunjuk: Pakai ${recommendedEnzyme.name} [${recommendedEnzyme.hotkey}]`
                : 'Petunjuk Enzim (H)'}
            </button>
          </div>

          <div className="puzzle2d-enzymes-row" role="group" aria-label="Pilih enzim pencernaan">
            {DIGESTIVE_ENZYMES.map((enz) => {
              const active = selectedEnzyme === enz.id;
              const isHintMatch = showHint && recommendedEnzyme?.id === enz.id;
              return (
                <button
                  key={enz.id}
                  type="button"
                  className={`puzzle2d-enzyme-btn${active ? ' active' : ''}${
                    isHintMatch ? ' hint-glow' : ''
                  }`}
                  onClick={() => {
                    setSelectedEnzyme(enz.id);
                    gameAudio.playClick();
                  }}
                >
                  <span className="puzzle2d-hotkey">{enz.hotkey}</span>
                  <div>
                    <strong>{enz.name}</strong>
                    <span>Target: {enz.targetBolus}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </GameShellOverlay>
    </div>
  );
}
