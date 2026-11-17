import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SIMULATIONS, SIMULATIONS_BY_ID } from '../data/simulations';
import type {
  LabLightingPreset,
  MaterialProgressDoc,
  SimId,
  SimParams,
} from '../types/biovia';
import { evaluateSimulationState } from '../utils/bioviaLogic';
import { SimulasiCanvas } from './SimulasiCanvas';

interface SimulasiViewProps {
  progressMap: Record<string, MaterialProgressDoc>;
  isFullscreen?: boolean;
  onFullscreenChange?: (next: boolean) => void;
  onOpenMaterialDetail: (slug: string) => void;
}

const LIGHTING_OPTIONS: Array<{ id: LabLightingPreset; label: string }> = [
  { id: 'mikroskop', label: 'Mikroskop' },
  { id: 'studio', label: 'Studio' },
  { id: 'klinik', label: 'Klinik' },
];

const SPEED_OPTIONS = [0.5, 1, 2];

export function SimulasiView({
  progressMap,
  isFullscreen = false,
  onFullscreenChange,
  onOpenMaterialDetail,
}: SimulasiViewProps) {
  const [simId, setSimId] = useState<SimId>('fotosintesis');
  const [params, setParams] = useState<SimParams>(() => ({
    ...SIMULATIONS_BY_ID.fotosintesis.defaultParams,
  }));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [lightingPreset, setLightingPreset] = useState<LabLightingPreset>('mikroskop');
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [materialCardCollapsed, setMaterialCardCollapsed] = useState<boolean>(false);
  const [resetCamTrigger, setResetCamTrigger] = useState<number>(0);

  const workspaceRef = useRef<HTMLElement | null>(null);
  const activeSim = useMemo(() => SIMULATIONS_BY_ID[simId], [simId]);

  const computedState = useMemo(
    () => evaluateSimulationState(simId, params),
    [simId, params]
  );

  const linkedProgress = progressMap[activeSim.materialSlug];

  const handleSelectSim = (nextId: SimId) => {
    setSimId(nextId);
    setParams({ ...SIMULATIONS_BY_ID[nextId].defaultParams });
  };

  const handleResetParams = () => {
    setParams({ ...activeSim.defaultParams });
  };

  const applyFullscreen = useCallback(
    (next: boolean) => {
      onFullscreenChange?.(next);
      try {
        if (next) {
          if (
            document.fullscreenEnabled &&
            !document.fullscreenElement &&
            workspaceRef.current?.requestFullscreen
          ) {
            void workspaceRef.current.requestFullscreen().catch(() => {
              // CSS fullscreen overlay remains active when native fullscreen is blocked
            });
          }
        } else if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Ignore browser fullscreen API errors
      }
    },
    [onFullscreenChange]
  );

  const toggleFullscreen = useCallback(() => {
    applyFullscreen(!isFullscreen);
  }, [applyFullscreen, isFullscreen]);

  useEffect(() => {
    const onNativeFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        onFullscreenChange?.(false);
      }
    };
    document.addEventListener('fullscreenchange', onNativeFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onNativeFullscreenChange);
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'Escape' && isFullscreen) {
        applyFullscreen(false);
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'h') {
        setControlsCollapsed((prev) => !prev);
      } else if (key === 'm') {
        setMaterialCardCollapsed((prev) => !prev);
      } else if (key === 'f') {
        toggleFullscreen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyFullscreen, isFullscreen, toggleFullscreen]);

  const isLightBackdrop = lightingPreset === 'studio';

  return (
    <section
      ref={workspaceRef}
      className={`lab3d-workspace${isLightBackdrop ? ' light-theme' : ''}${isFullscreen ? ' is-fullscreen' : ''}`}
      data-sim={simId}
      data-playing={isPlaying ? 'true' : 'false'}
      data-speed={speedMultiplier}
      data-controls-collapsed={controlsCollapsed ? 'true' : 'false'}
      data-material-collapsed={materialCardCollapsed ? 'true' : 'false'}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      aria-label="Simulasi Biologi 3D Interaktif"
    >
      <SimulasiCanvas
        simId={simId}
        params={params}
        computedState={computedState}
        isPlaying={isPlaying}
        speedMultiplier={speedMultiplier}
        lightingPreset={lightingPreset}
        resetCamTrigger={resetCamTrigger}
      />

      <button
        type="button"
        className={`lab3d-fullscreen-corner${isFullscreen ? ' active' : ''}`}
        aria-pressed={isFullscreen}
        aria-label={isFullscreen ? 'Keluar dari mode Fullscreen' : 'Masuk ke mode Fullscreen'}
        title={isFullscreen ? 'Keluar Fullscreen (F / Esc)' : 'Mode Fullscreen (F)'}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? '✕ Keluar Fullscreen' : '⛶ Fullscreen'}
      </button>

      {/* Top-Left Collapsible Telemetry & Material Reference Card */}
      <div className="lab3d-hud-top">
        <div className={`lab3d-spec-card${materialCardCollapsed ? ' collapsed' : ''}`}>
          <div className="lab3d-spec-header">
            <div className="lab3d-spec-title-wrap">
              {!materialCardCollapsed && (
                <div className="lab3d-spec-meta">
                  <span>{activeSim.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{computedState.statusBadge}</span>
                  {linkedProgress && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {linkedProgress.completed
                          ? `Lulus ${linkedProgress.bestScore}/100`
                          : `Skor ${linkedProgress.bestScore}/100`}
                      </span>
                    </>
                  )}
                </div>
              )}
              <h1>{activeSim.title}</h1>
              {materialCardCollapsed && (
                <div className="lab3d-spec-collapsed-sub">
                  <span className="sim-status-pill">{computedState.statusBadge}</span>
                  <span className="tabular-nums">
                    {computedState.metrics[0]?.label}: {computedState.metrics[0]?.value}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="lab3d-spec-toggle"
              aria-expanded={!materialCardCollapsed}
              aria-label={
                materialCardCollapsed ? 'Tampilkan panel materi' : 'Sembunyikan panel materi'
              }
              title="Sembunyikan atau tampilkan info simulasi (M)"
              onClick={() => setMaterialCardCollapsed((prev) => !prev)}
            >
              {materialCardCollapsed ? '▾ Info & Hasil' : '▴ Sembunyikan'}
            </button>
          </div>

          {!materialCardCollapsed && (
            <>
              <p className="sim-summary-copy">{activeSim.summary}</p>

              <div className="sim-metrics-grid" aria-label="Telemetri Simulasi Langsung">
                {computedState.metrics.map((m) => (
                  <div key={m.label} className={`sim-metric-cell tone-${m.tone}`}>
                    <span>{m.label}</span>
                    <strong className="tabular-nums">{m.value}</strong>
                  </div>
                ))}
              </div>

              <div className="lab3d-spec-actions">
                <button
                  type="button"
                  className="lab3d-material-btn"
                  onClick={() => onOpenMaterialDetail(activeSim.materialSlug)}
                >
                  Pelajari Materi &amp; Kuis →
                </button>
                <span className="lab3d-hint">
                  Spasi: Jeda/Mulai · Seret: Putar kamera · M/H: Lipat panel
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Bottom Experiment Parameter Dock */}
      <div className={`lab3d-dock-wrap${controlsCollapsed ? ' collapsed' : ''}`}>
        <button
          type="button"
          className="lab3d-dock-toggle"
          aria-expanded={!controlsCollapsed}
          onClick={() => setControlsCollapsed((prev) => !prev)}
        >
          {controlsCollapsed ? '▴ Tampilkan Kontrol (H)' : '▾ Sembunyikan Kontrol (H)'}
        </button>

        <div className="lab3d-dock" role="region" aria-label="Kontrol Parameter Simulasi">
          <div className="lab3d-dock-row">
            <div className="lab3d-control-group" role="group" aria-label="Pilih skenario simulasi">
              <span className="lab3d-control-label">Skenario Simulasi</span>
              <div className="lab3d-segmented">
                {SIMULATIONS.map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    className={`lab3d-seg-btn${simId === sim.id ? ' active' : ''}`}
                    onClick={() => handleSelectSim(sim.id)}
                  >
                    {sim.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="lab3d-control-group">
              <span className="lab3d-control-label">Playback &amp; Kecepatan</span>
              <div className="lab3d-utility-row">
                <button
                  type="button"
                  className={`lab3d-mini-btn${isPlaying ? ' active' : ''}`}
                  aria-pressed={isPlaying}
                  onClick={() => setIsPlaying((prev) => !prev)}
                >
                  {isPlaying ? '⏸ Jeda' : '▶ Jalankan'}
                </button>
                <div className="lab3d-segmented" role="group" aria-label="Kecepatan simulasi">
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`lab3d-seg-btn${speedMultiplier === spd ? ' active' : ''}`}
                      onClick={() => setSpeedMultiplier(spd)}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="lab3d-mini-btn"
                  onClick={handleResetParams}
                >
                  Reset Parameter
                </button>
              </div>
            </div>

            <div className="lab3d-control-group">
              <span className="lab3d-control-label">Tampilan &amp; Kamera</span>
              <div className="lab3d-utility-row">
                <div className="lab3d-segmented" role="group" aria-label="Pencahayaan">
                  {LIGHTING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`lab3d-seg-btn${lightingPreset === opt.id ? ' active' : ''}`}
                      onClick={() => setLightingPreset(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="lab3d-mini-btn"
                  onClick={() => setResetCamTrigger((n) => n + 1)}
                >
                  Reset Kamera
                </button>
                <button
                  type="button"
                  className={`lab3d-mini-btn${isFullscreen ? ' active' : ''}`}
                  aria-pressed={isFullscreen}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? '✕ Keluar Fullscreen' : '⛶ Fullscreen'}
                </button>
              </div>
            </div>
          </div>

          <div className="sim-sliders-grid" role="group" aria-label="Parameter variabel simulasi">
            {activeSim.sliders.map((slider) => {
              const value = params[slider.key];
              const inputId = `sim-slider-${slider.key}`;
              return (
                <div key={slider.key} className="sim-slider-cell">
                  <div className="sim-slider-head">
                    <label htmlFor={inputId}>{slider.label}</label>
                    <strong className="tabular-nums">
                      {value} {slider.unit}
                    </strong>
                  </div>
                  <input
                    id={inputId}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(e) => {
                      const nextVal = Number(e.target.value);
                      setParams((prev) => ({
                        ...prev,
                        [slider.key]: nextVal,
                      }));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
