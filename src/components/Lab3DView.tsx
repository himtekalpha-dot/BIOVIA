import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LAB_SPECIMENS, LAB_SPECIMENS_BY_ID } from '../data/labSpecimens';
import type {
  LabLightingPreset,
  LabSpecimenId,
  MaterialProgressDoc,
} from '../types/biovia';
import { Lab3DCanvas } from './Lab3DCanvas';

interface Lab3DViewProps {
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

export function Lab3DView({
  progressMap,
  isFullscreen = false,
  onFullscreenChange,
  onOpenMaterialDetail,
}: Lab3DViewProps) {
  const [specimenId, setSpecimenId] = useState<LabSpecimenId>('sel-hewan');
  const [explodePercent, setExplodePercent] = useState<number>(0);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(
    LAB_SPECIMENS_BY_ID['sel-hewan'].parts[1].id
  );
  const [lightingPreset, setLightingPreset] = useState<LabLightingPreset>('mikroskop');
  const [animateMotion, setAnimateMotion] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [materialCardCollapsed, setMaterialCardCollapsed] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const workspaceRef = useRef<HTMLElement | null>(null);
  const activeSpecimen = useMemo(() => LAB_SPECIMENS_BY_ID[specimenId], [specimenId]);

  const activePart = useMemo(() => {
    if (!selectedPartId) return activeSpecimen.parts[0];
    return (
      activeSpecimen.parts.find((p) => p.id === selectedPartId) ?? activeSpecimen.parts[0]
    );
  }, [activeSpecimen, selectedPartId]);

  const linkedProgress = progressMap[activeSpecimen.materialSlug];

  const handleSelectSpecimen = (nextId: LabSpecimenId) => {
    setSpecimenId(nextId);
    setExplodePercent(0);
    setSelectedPartId(LAB_SPECIMENS_BY_ID[nextId].parts[0].id);
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
              // CSS fullscreen overlay remains active when native fullscreen is blocked (e.g. iframe)
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
      data-specimen={specimenId}
      data-explode={explodePercent}
      data-selected-part={activePart.id}
      data-controls-collapsed={controlsCollapsed ? 'true' : 'false'}
      data-material-collapsed={materialCardCollapsed ? 'true' : 'false'}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      aria-label="Laboratorium 3D Interaktif"
    >
      <Lab3DCanvas
        specimenId={specimenId}
        explodeAmount={explodePercent / 100}
        selectedPartId={activePart.id}
        lightingPreset={lightingPreset}
        animateMotion={animateMotion}
        resetTrigger={resetTrigger}
        onSelectPart={(partId) => {
          if (partId) setSelectedPartId(partId);
        }}
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

      {/* Minimal Top-Left Specimen & Selected Part Badge (Collapsible for Wide Mobile View) */}
      <div className="lab3d-hud-top">
        <div className={`lab3d-spec-card${materialCardCollapsed ? ' collapsed' : ''}`}>
          <div className="lab3d-spec-header">
            <div className="lab3d-spec-title-wrap">
              {!materialCardCollapsed && (
                <div className="lab3d-spec-meta">
                  <span>{activeSpecimen.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeSpecimen.parts.length} Komponen</span>
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
              <h1>{activeSpecimen.title}</h1>
              {materialCardCollapsed && (
                <div className="lab3d-spec-collapsed-sub">
                  <span
                    className="lab3d-swatch"
                    style={{ backgroundColor: activePart.swatch }}
                    aria-hidden="true"
                  />
                  <span>{activePart.name}</span>
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
              title="Sembunyikan atau tampilkan materi (M)"
              onClick={() => setMaterialCardCollapsed((prev) => !prev)}
            >
              {materialCardCollapsed ? '▾ Materi' : '▴ Sembunyikan'}
            </button>
          </div>

          {!materialCardCollapsed && (
            <>
              <div className="lab3d-part-focus">
                <div className="lab3d-part-focus-head">
                  <span
                    className="lab3d-swatch"
                    style={{ backgroundColor: activePart.swatch }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{activePart.name}</strong>
                    <span>{activePart.role}</span>
                  </div>
                </div>
                <p>{activePart.description}</p>
              </div>

              <div className="lab3d-spec-actions">
                <button
                  type="button"
                  className="lab3d-material-btn"
                  onClick={() => onOpenMaterialDetail(activeSpecimen.materialSlug)}
                >
                  Pelajari Materi &amp; Kuis →
                </button>
                <span className="lab3d-hint">
                  Seret untuk putar · Gulir untuk zoom · Klik organ
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Side-Panel Occlusion) */}
      <div className={`lab3d-dock-wrap${controlsCollapsed ? ' collapsed' : ''}`}>
        <button
          type="button"
          className="lab3d-dock-toggle"
          aria-expanded={!controlsCollapsed}
          onClick={() => setControlsCollapsed((prev) => !prev)}
        >
          {controlsCollapsed ? '▴ Tampilkan Kontrol (H)' : '▾ Sembunyikan Kontrol (H)'}
        </button>

        <div className="lab3d-dock" role="region" aria-label="Kontrol Laboratorium 3D">
          <div className="lab3d-dock-row">
            <div className="lab3d-control-group" role="group" aria-label="Pilih spesimen 3D">
              <span className="lab3d-control-label">Spesimen</span>
              <div className="lab3d-segmented">
                {LAB_SPECIMENS.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    className={`lab3d-seg-btn${specimenId === spec.id ? ' active' : ''}`}
                    onClick={() => handleSelectSpecimen(spec.id)}
                  >
                    {spec.id === 'sel-hewan'
                      ? 'Sel Hewan'
                      : spec.id === 'paru-paru'
                        ? 'Paru-paru'
                        : 'Jantung'}
                  </button>
                ))}
              </div>
            </div>

            <div className="lab3d-control-group lab3d-slider-group">
              <label htmlFor="labExplodeSlider" className="lab3d-control-label">
                Bedah Lapisan: <strong className="tabular-nums">{explodePercent}%</strong>
              </label>
              <div className="lab3d-slider-row">
                <input
                  id="labExplodeSlider"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={explodePercent}
                  onChange={(e) => setExplodePercent(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="lab3d-mini-btn"
                  onClick={() => setExplodePercent((prev) => (prev >= 70 ? 0 : 85))}
                >
                  {explodePercent >= 70 ? 'Satukan' : 'Bedah'}
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
                  className={`lab3d-mini-btn${animateMotion ? ' active' : ''}`}
                  aria-pressed={animateMotion}
                  onClick={() => setAnimateMotion((prev) => !prev)}
                >
                  {animateMotion ? 'Jeda Gerak' : 'Simulasi Gerak'}
                </button>
                <button
                  type="button"
                  className="lab3d-mini-btn"
                  onClick={() => setResetTrigger((n) => n + 1)}
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

          <div className="lab3d-parts-bar" role="group" aria-label="Inspeksi bagian spesimen">
            {activeSpecimen.parts.map((part) => {
              const selected = activePart.id === part.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  className={`lab3d-part-btn${selected ? ' active' : ''}`}
                  onClick={() => setSelectedPartId(part.id)}
                >
                  <span
                    className="lab3d-part-dot"
                    style={{ backgroundColor: part.swatch }}
                    aria-hidden="true"
                  />
                  <span>{part.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
