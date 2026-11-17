import { useState } from 'react';

interface LoginPageProps {
  isLoadingAuth: boolean;
  authError: string | null;
  onGoogleLogin: () => Promise<void>;
  onContinueAsGuest: () => void;
}

export function LoginPage({
  isLoadingAuth,
  authError,
  onGoogleLogin,
  onContinueAsGuest,
}: LoginPageProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleLoginClick = async () => {
    setSubmitting(true);
    try {
      await onGoogleLogin();
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isLoadingAuth || submitting;

  return (
    <div className="login-shell">
      <div className="login-container">
        <section className="login-showcase" aria-label="Pengenalan BIOVIA">
          <div className="login-showcase-bg" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="cell login-cell">
              <div className="cell-core" />
              <div className="cell-nucleus" />
              <span className="cell-detail detail-one" />
              <span className="cell-detail detail-two" />
            </div>
          </div>

          <div className="login-showcase-inner">
            <div className="login-brand">
              <span className="brand-mark">
                <span className="brand-dot" />
                <span className="brand-leaf">✳</span>
              </span>
              <span className="brand-name" style={{ color: '#fff' }}>
                BIO<span>VIA</span>
                <small style={{ color: '#9edbe3' }}>VIRTUAL BIOLOGY LAB</small>
              </span>
            </div>

            <div className="login-showcase-copy">
              <span className="hero-label">VIRTUAL BIOLOGY EXPERIENCE</span>
              <h1>
                Jelajahi kehidupan,
                <br />
                <em>simpan setiap langkah belajarmu.</em>
              </h1>
              <p>
                Masuk dengan akun BIOVIA untuk mengakses 12 materi biologi interaktif, kuis
                pemahaman, serta penyimpanan progres otomatis di cloud database.
              </p>

              <ul className="login-highlights">
                <li>
                  <strong>Progres Tersinkronisasi</strong>
                  <span>Catatan materi selesai dan skor terbaik tersimpan aman di Firestore.</span>
                </li>
                <li>
                  <strong>Riwayat Kuis &amp; XP</strong>
                  <span>Kumpulkan poin pengalaman dari setiap kuis dan tantangan harian.</span>
                </li>
                <li>
                  <strong>Akses Lintas Perangkat</strong>
                  <span>Lanjutkan belajar dari mana saja dengan akun Google kamu.</span>
                </li>
              </ul>
            </div>

            <div className="login-showcase-foot">
              <span>© 2026 BIOVIA · Biology Virtual Interactive Application</span>
            </div>
          </div>
        </section>

        <main className="login-form-area">
          <div className="login-card">
            <div className="login-card-header">
              <span className="eyebrow">
                <span className="eyebrow-line" /> PORTAL SISWA
              </span>
              <h2>Masuk ke BIOVIA</h2>
              <p>
                Gunakan akun Google kamu untuk masuk dan mengaktifkan penyimpanan progres belajar ke
                database.
              </p>
            </div>

            {authError && (
              <div className="login-alert" role="alert">
                <strong>Gagal Masuk</strong>
                <span>{authError}</span>
              </div>
            )}

            <div className="login-actions">
              <button
                type="button"
                className="google-login-button"
                onClick={handleLoginClick}
                disabled={busy}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.46 1.15-4.22 1.15-3.24 0-5.98-2.19-6.96-5.14H1.04v3.14C3.05 21.13 7.21 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.04 14c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.14H1.04A11.98 11.98 0 0 0 0 11.64c0 1.93.46 3.76 1.04 5.5l4-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.87 1.04 6.14l4 3.14c.98-2.95 3.72-4.53 6.96-4.53Z"
                  />
                </svg>
                <span>{busy ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
              </button>

              <div className="login-divider">
                <span>atau</span>
              </div>

              <button
                type="button"
                className="guest-login-button"
                onClick={onContinueAsGuest}
                disabled={busy}
              >
                Jelajahi sebagai Tamu (Mode Lokal) →
              </button>
            </div>

            <div className="login-security-note">
              <strong>Keamanan &amp; Privasi</strong>
              <p>
                Autentikasi dikelola melalui Google Sign-In dan Firebase Firestore. Data progres
                belajar hanya dapat diakses oleh pemilik akun.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
