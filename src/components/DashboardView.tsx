import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { DASHBOARD_CATEGORIES } from '../data/materials';
import type { MaterialCategory, StudentProfileDoc } from '../types/biovia';
import { filterDashboardCategories, formatIndonesianDate } from '../utils/bioviaLogic';

interface DashboardViewProps {
  user: User | null;
  profile: StudentProfileDoc | null;
  searchQuery: string;
  completedSlugs: string[];
  onNavigateJelajahi: (category?: MaterialCategory | 'all') => void;
  onOpenMaterialDetail: (slug: string) => void;
  onOpenDailyChallenge: () => void;
  onOpenProfile: () => void;
  onShowToast: (message: string) => void;
}

export function DashboardView({
  user,
  profile,
  searchQuery,
  completedSlugs,
  onNavigateJelajahi,
  onOpenMaterialDetail,
  onOpenDailyChallenge,
  onOpenProfile,
  onShowToast,
}: DashboardViewProps) {
  const todayLabel = useMemo(() => formatIndonesianDate(new Date()), []);
  const filteredCategories = useMemo(
    () => filterDashboardCategories(DASHBOARD_CATEGORIES, searchQuery),
    [searchQuery]
  );

  const studiedCount = user
    ? Math.min(24, profile?.completedCount ?? 0)
    : Math.min(24, 8 + completedSlugs.length);
  const studiedFormatted = String(studiedCount).padStart(2, '0');
  const progressPercent = Math.round((studiedCount / 24) * 100);
  const totalXp = user ? profile?.xp ?? 0 : 450 + completedSlugs.length * 50;
  const explorerLevel = user ? profile?.level ?? 1 : 3;
  const firstName = user
    ? (profile?.displayName ?? user.displayName ?? 'Penjelajah').split(' ')[0]
    : 'Penjelajah';

  const scrollToCategories = () => {
    const el = document.getElementById('learningCategories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> SENANG MELIHATMU KEMBALI
          </div>
          <h1>
            Halo, {firstName}! <span className="wave">✦</span>
          </h1>
          <p className="welcome-copy">
            Siap menemukan hal menakjubkan dari dunia kehidupan hari ini?
          </p>
        </div>
        <div className="date-chip">
          <span>◷</span>
          <span id="todayDate">{todayLabel}</span>
        </div>
      </section>

      <section className="hero-card">
        <div className="hero-copy">
          <div className="hero-label">
            <span className="sparkle">✦</span> VIRTUAL BIOLOGY EXPERIENCE
          </div>
          <h2>
            Jelajahi kehidupan,
            <br />
            <em>mulai dari sini.</em>
          </h2>
          <p>
            Kenali struktur dan fungsi makhluk hidup melalui materi interaktif, eksplorasi 3D,
            dan pengalaman belajar yang menyenangkan.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={scrollToCategories}>
              Mulai Jelajahi <span>→</span>
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => onShowToast('Video perkenalan BIOVIA akan segera tersedia.')}
            >
              <span className="play-icon">▶</span> Lihat pengenalan
            </button>
          </div>
          <div className="hero-proof">
            <span className="proof-avatars">
              <i>🧑🏻‍🔬</i>
              <i>👩🏽‍🔬</i>
              <i>🧑🏾‍🎓</i>
            </span>
            <span>Belajar sains dengan cara yang lebih seru</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Ilustrasi molekul dan sel 3D">
          <div className="art-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="molecule molecule-a" />
          <div className="molecule molecule-b" />
          <div className="cell">
            <div className="cell-core" />
            <div className="cell-nucleus" />
            <span className="cell-detail detail-one" />
            <span className="cell-detail detail-two" />
            <span className="cell-detail detail-three" />
          </div>
          <div className="art-tag tag-top">
            <span className="tag-pulse" /> BIOLOGY · 3D LAB
          </div>
          <div className="art-tag tag-bottom">
            <span>✧</span> Explore the unseen
          </div>
          <div className="floating-plus plus-one">+</div>
          <div className="floating-plus plus-two">+</div>
        </div>
        <div className="hero-bottom-line" />
      </section>

      <section className="stats-grid" aria-label="Ringkasan progres belajar">
        <article className="stat-card">
          <div className="stat-icon icon-cyan">▤</div>
          <div className="stat-info">
            <span>Materi dipelajari</span>
            <strong>
              {studiedFormatted} <small>/ 24</small>
            </strong>
            <div className="mini-progress">
              <i style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <span className="stat-trend">
            {user ? 'Tersimpan di cloud' : `+${2 + completedSlugs.length} minggu ini`}
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-icon icon-purple">◷</div>
          <div className="stat-info">
            <span>Waktu belajar</span>
            <strong>
              3,5 <small>jam</small>
            </strong>
            <div className="stat-sub">Total minggu ini</div>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon icon-orange">♜</div>
          <div className="stat-info">
            <span>XP terkumpul</span>
            <strong>
              {totalXp} <small>XP</small>
            </strong>
            <div className="stat-sub">Level {explorerLevel} · Penjelajah</div>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon icon-green">◇</div>
          <div className="stat-info">
            <span>Pencapaian</span>
            <strong>
              05 <small>lencana</small>
            </strong>
            <div className="stat-sub">Terus tingkatkan!</div>
          </div>
        </article>
      </section>

      <section className="section-block" id="learningCategories">
        <div className="section-heading">
          <div>
            <div className="eyebrow small-eyebrow">TEMUKAN DUNIA KEHIDUPAN</div>
            <h2>Jelajahi Materi</h2>
            <p>Pilih topik yang ingin kamu pelajari hari ini.</p>
          </div>
          <button
            type="button"
            className="view-all"
            onClick={() => onNavigateJelajahi('all')}
          >
            Lihat semua materi <span>→</span>
          </button>
        </div>

        <div className="category-grid" id="categoryGrid">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-card ${cat.cardClass}`}
              onClick={() => onNavigateJelajahi(cat.id)}
            >
              <div className="category-top">
                <span className="category-symbol">{cat.symbol}</span>
                <span className="category-count">{cat.countLabel}</span>
              </div>
              <div className={`category-visual ${cat.visualClass}`}>
                <div className={cat.orbClass}>✧</div>
                <div className={cat.shapeClass}>{cat.shapeSymbol}</div>
                <span className="visual-label">{cat.visualLabel}</span>
              </div>
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>
              <div className="category-footer">
                <span>Mulai belajar</span>
                <b>↗</b>
              </div>
            </button>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="empty-search" id="emptySearch">
            Tidak ada materi yang cocok. Coba kata kunci lain, ya!
          </div>
        )}
      </section>

      <section className="lower-grid">
        <div className="section-block continue-block">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow small-eyebrow">LANJUTKAN PERJALANANMU</div>
              <h2>Lanjutkan Belajar</h2>
            </div>
            <button type="button" className="view-all" onClick={onOpenProfile}>
              Riwayat <span>→</span>
            </button>
          </div>

          <article className="continue-card">
            <div className="continue-thumb lung-thumb">
              <span className="lung-art">◉</span>
              <span className="thumb-label">3D EXPLORATION</span>
            </div>
            <div className="continue-info">
              <span className="topic-tag">BIOLOGI MANUSIA · SISTEM PERNAPASAN</span>
              <h3>Mengenal Struktur Paru-paru</h3>
              <p>Pelajari bagian paru-paru dan proses pertukaran gas.</p>
              <div className="continue-progress">
                <div>
                  <span>Progres materi</span>
                  <b>65%</b>
                </div>
                <div className="progress-track">
                  <i style={{ width: '65%' }} />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="round-arrow"
              aria-label="Lanjutkan materi Sistem Pernapasan Manusia"
              onClick={() => onOpenMaterialDetail('sistem-pernapasan-manusia')}
            >
              →
            </button>
          </article>
        </div>

        <aside className="challenge-card">
          <div className="challenge-head">
            <span className="challenge-icon">✦</span>
            <span>DAILY CHALLENGE</span>
            <span className="challenge-dots">•••</span>
          </div>
          <div className="challenge-illustration">
            <div className="challenge-ring" />
            <span>🧠</span>
            <i>✧</i>
          </div>
          <h3>Tantangan Hari Ini</h3>
          <p>Seberapa jauh kamu mengenal organ tubuh manusia?</p>
          <div className="challenge-meta">
            <span>☷ 5 Pertanyaan</span>
            <span>◷ 3 Menit</span>
          </div>
          <button type="button" className="challenge-button" onClick={onOpenDailyChallenge}>
            Ikuti Tantangan <span>→</span>
          </button>
        </aside>
      </section>

      <section className="ai-banner">
        <div className="ai-icon">✧</div>
        <div>
          <span>KENALAN DENGAN TEMAN BELAJARMU</span>
          <h3>Punya pertanyaan tentang biologi?</h3>
          <p>
            Diskusikan materi, tanyakan hal yang belum kamu pahami, dan belajar bersama AI Tutor
            BIOVIA.
          </p>
        </div>
        <button type="button" onClick={() => onShowToast('BIOVIA AI Tutor akan segera hadir!')}>
          Tanya BIOVIA AI <span>↗</span>
        </button>
      </section>

      <footer className="footer">
        <span>© 2026 BIOVIA · Biology Virtual Interactive Application</span>
        <span>Belajar, Jelajahi, Temukan ✦</span>
      </footer>
    </div>
  );
}
