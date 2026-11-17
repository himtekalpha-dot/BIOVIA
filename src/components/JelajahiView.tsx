import { useEffect, useMemo, useState } from 'react';
import { CATALOG_CARDS } from '../data/materials';
import type { CatalogCardItem, MaterialCategory, MaterialProgressDoc } from '../types/biovia';
import { filterCatalogMaterials } from '../utils/bioviaLogic';

interface JelajahiViewProps {
  activeCategory: MaterialCategory | 'all';
  searchQuery: string;
  progressMap?: Record<string, MaterialProgressDoc>;
  onCategoryChange: (category: MaterialCategory | 'all') => void;
  onSearchChange: (query: string) => void;
  onOpenMaterialDetail: (slug: string) => void;
}

const FILTER_OPTIONS: Array<{ id: MaterialCategory | 'all'; label: string; count?: number }> = [
  { id: 'all', label: 'Semua', count: 12 },
  { id: 'manusia', label: '🧍 Manusia' },
  { id: 'hewan', label: '🐾 Hewan' },
  { id: 'tumbuhan', label: '🌿 Tumbuhan' },
  { id: 'sel', label: '🔬 Sel & Mikroorganisme' },
];

export function JelajahiView({
  activeCategory,
  searchQuery,
  progressMap = {},
  onCategoryChange,
  onSearchChange,
  onOpenMaterialDetail,
}: JelajahiViewProps) {
  const [selectedCard, setSelectedCard] = useState<CatalogCardItem | null>(null);

  const filteredMaterials = useMemo(
    () => filterCatalogMaterials(CATALOG_CARDS, activeCategory, searchQuery),
    [activeCategory, searchQuery]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetFilters = () => {
    onCategoryChange('all');
    onSearchChange('');
  };

  return (
    <>
      <div className="content">
        <section className="page-intro">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> PERPUSTAKAAN BIOLOGI INTERAKTIF
            </div>
            <h1>
              Jelajahi Dunia <span>Kehidupan.</span>
            </h1>
            <p className="welcome-copy">
              Pilih kategori, temukan materi, dan pelajari bagaimana makhluk hidup bekerja.
            </p>
          </div>
          <div className="intro-chip">
            <span>✦</span> Belajar sesuai rasa ingin tahumu
          </div>
        </section>

        <section className="explore-hero">
          <div className="explore-hero-copy">
            <span className="hero-label">YOUR BIOLOGY JOURNEY STARTS HERE</span>
            <h2>
              Setiap makhluk hidup
              <br />
              punya cerita menarik.
            </h2>
            <p>
              Dari organ tubuh manusia hingga sel mikroskopis, temukan struktur dan fungsi
              kehidupan dengan cara yang lebih seru.
            </p>
            <div className="hero-pills">
              <span>📚 Materi ringkas</span>
              <span>🔬 Eksplorasi</span>
              <span>🧩 Tantangan</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit orbit-a" />
            <div className="hero-orbit orbit-b" />
            <div className="hero-planet">🧬</div>
            <span className="hero-float float-a">✦</span>
            <span className="hero-float float-b">＋</span>
            <div className="hero-note">DISCOVER · LEARN · EXPLORE</div>
          </div>
        </section>

        <section className="filter-section" aria-label="Filter materi">
          <div className="filter-heading">
            <div>
              <div className="eyebrow small-eyebrow">PILIH AREA EKSPLORASI</div>
              <h2>Semua Materi</h2>
            </div>
            <span className="result-count" id="resultCount">
              {filteredMaterials.length} materi ditemukan
            </span>
          </div>

          <div className="filter-bar">
            <div className="category-filters" id="categoryFilters">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-chip${activeCategory === opt.id ? ' active' : ''}`}
                  onClick={() => onCategoryChange(opt.id)}
                >
                  {opt.label}
                  {opt.count !== undefined && <span>{opt.count}</span>}
                </button>
              ))}
            </div>

            <label className="material-search">
              <span>⌕</span>
              <input
                id="materialSearch"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari topik, misalnya paru-paru..."
                aria-label="Cari topik materi"
              />
            </label>
          </div>
        </section>

        {filteredMaterials.length > 0 ? (
          <section className="material-grid" id="materialGrid">
            {filteredMaterials.map((card) => {
              const progress = progressMap[card.slug];
              return (
                <article key={card.slug} className="material-card">
                  <div className={`card-art ${card.artClass}`}>
                    <span className="art-emoji">{card.emoji}</span>
                    <span className="art-label">{card.artLabel}</span>
                    <span className="art-orbit" />
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      <span className={`subject-tag ${card.tagClass}`}>{card.subjectLabel}</span>
                      <span className="level-tag">{card.level}</span>
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.summary}</p>
                    <div className="card-bottom">
                      <span>
                        {progress
                          ? progress.completed
                            ? `✓ Lulus · ${progress.bestScore}/100`
                            : `Skor: ${progress.bestScore}/100`
                          : `⏱ ${card.duration}`}
                      </span>
                      <button
                        type="button"
                        className="open-material"
                        aria-label={`Pelajari ${card.title}`}
                        onClick={() => setSelectedCard(card)}
                      >
                        Pelajari <b>→</b>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="no-results" id="noResults">
            <span>🔎</span>
            <h3>Materi belum ditemukan</h3>
            <p>Coba kata kunci lain atau pilih kategori yang berbeda.</p>
            <button type="button" id="resetFilters" onClick={handleResetFilters}>
              Tampilkan semua materi
            </button>
          </div>
        )}

        <footer className="footer">
          <span>© 2026 BIOVIA · Biology Virtual Interactive Application</span>
          <span>Belajar, Jelajahi, Temukan ✦</span>
        </footer>
      </div>

      {/* Modal Ringkasan Materi */}
      <div
        className={`modal-backdrop${selectedCard ? ' show' : ''}`}
        id="materialModal"
        aria-hidden={!selectedCard}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedCard(null);
          }
        }}
      >
        {selectedCard && (
          <section
            className="material-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            <button
              type="button"
              className="modal-close"
              id="closeModal"
              aria-label="Tutup"
              onClick={() => setSelectedCard(null)}
            >
              ×
            </button>
            <div className="modal-art" id="modalArt">
              {selectedCard.emoji}
            </div>
            <span className={`subject-tag ${selectedCard.tagClass}`} id="modalCategory">
              {selectedCard.subjectLabel}
            </span>
            <h2 id="modalTitle">{selectedCard.title}</h2>
            <p id="modalDescription">{selectedCard.summary}</p>
            <div className="modal-info">
              <span>📖 Materi pembelajaran</span>
              <span>⏱ Estimasi {selectedCard.duration}</span>
              <span>🎯 {selectedCard.level}</span>
              {progressMap[selectedCard.slug] && (
                <span>
                  ✓ Skor terbaik: {progressMap[selectedCard.slug].bestScore}/100
                </span>
              )}
            </div>
            <div className="modal-learning">
              <strong>Yang akan kamu pelajari</strong>
              <ul>
                <li>Struktur atau bagian utama objek biologi.</li>
                <li>Fungsi setiap bagian dan hubungan antarbagian.</li>
                <li>Contoh penerapannya dalam kehidupan sehari-hari.</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-secondary"
                id="closeModalBottom"
                onClick={() => setSelectedCard(null)}
              >
                Kembali
              </button>
              <button
                type="button"
                className="modal-primary"
                id="startMaterial"
                onClick={() => {
                  const slug = selectedCard.slug;
                  setSelectedCard(null);
                  onOpenMaterialDetail(slug);
                }}
              >
                Mulai Pelajari <span>→</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
