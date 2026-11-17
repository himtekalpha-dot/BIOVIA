import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { MaterialProgressDoc, QuizAttemptDoc, StudentProfileDoc } from '../types/biovia';

interface ProfileModalProps {
  isOpen: boolean;
  user: User | null;
  profile: StudentProfileDoc | null;
  progressMap: Record<string, MaterialProgressDoc>;
  quizHistory: QuizAttemptDoc[];
  onClose: () => void;
  onUpdateName: (nextName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenLogin: () => void;
}

export function ProfileModal({
  isOpen,
  user,
  profile,
  progressMap,
  quizHistory,
  onClose,
  onUpdateName,
  onSignOut,
  onOpenLogin,
}: ProfileModalProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (!isOpen) return null;

  const displayName = profile?.displayName ?? user?.displayName ?? 'Siswa BIOVIA';
  const completedItems = Object.values(progressMap).filter((item) => item.completed);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await onUpdateName(trimmed);
      setEditingName(false);
      setSaveMessage('Nama profil berhasil diperbarui di database.');
    } catch {
      setSaveMessage('Gagal memperbarui nama profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop show"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="material-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profileModalTitle"
        style={{ width: 'min(100%, 580px)' }}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Tutup profil"
          onClick={onClose}
        >
          ×
        </button>

        {!user ? (
          <div>
            <span className="subject-tag tag-cell">MODE TAMU · LOKAL</span>
            <h2 id="profileModalTitle">Masuk untuk Sinkronisasi Cloud</h2>
            <p>
              Saat ini kamu menggunakan BIOVIA dalam Mode Tamu. Progres belajar dan riwayat kuis
              belum tersimpan ke database cloud.
            </p>
            <div className="modal-learning" style={{ marginTop: '16px' }}>
              <strong>Keuntungan Masuk dengan Google</strong>
              <ul>
                <li>Simpan skor terbaik setiap materi di Firestore database.</li>
                <li>Lacak XP, level penjelajah, dan riwayat kuis lintas perangkat.</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-secondary" onClick={onClose}>
                Tutup
              </button>
              <button
                type="button"
                className="modal-primary"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
              >
                Buka Halaman Login <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              {user.photoURL && !avatarFailed ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #c8eef1',
                  }}
                />
              ) : (
                <div className="avatar" style={{ width: '54px', height: '54px', fontSize: '20px' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="subject-tag tag-human">AKUN TERVERIFIKASI</span>
                <h2 id="profileModalTitle" style={{ margin: '6px 0 2px' }}>
                  {displayName}
                </h2>
                <p style={{ margin: 0, fontSize: '11px', color: '#718398' }}>{user.email}</p>
              </div>
            </div>

            {!editingName ? (
              <div style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  className="modal-secondary"
                  onClick={() => {
                    setNameInput(displayName);
                    setEditingName(true);
                    setSaveMessage(null);
                  }}
                >
                  Ubah Nama Tampilan
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSaveName}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '14px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={nameInput}
                  maxLength={100}
                  onChange={(e) => setNameInput(e.target.value)}
                  aria-label="Nama tampilan baru"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <button type="submit" className="modal-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  className="modal-secondary"
                  onClick={() => setEditingName(false)}
                >
                  Batal
                </button>
              </form>
            )}

            {saveMessage && (
              <p style={{ fontSize: '11px', color: '#0d9db2', margin: '0 0 12px' }}>
                {saveMessage}
              </p>
            )}

            <div className="modal-info">
              <span>🏆 Level {profile?.level ?? 1}</span>
              <span>⚡ {profile?.xp ?? 0} XP</span>
              <span>📚 {completedItems.length} Materi Lulus</span>
              <span>🧠 Tantangan Terbaik: {profile?.dailyChallengeBestScore ?? 0}/100</span>
            </div>

            <div className="modal-learning">
              <strong>Riwayat Kuis Terbaru (Database Firestore)</strong>
              {quizHistory.length === 0 ? (
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#7e91a1' }}>
                  Belum ada riwayat kuis. Selesaikan kuis di salah satu materi untuk mencatat
                  progresmu!
                </p>
              ) : (
                <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '10px' }}>
                  {quizHistory.slice(0, 6).map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '7px 0',
                        borderBottom: '1px solid #e5f2f4',
                      }}
                    >
                      <span>
                        {item.materialTitle}
                        {item.createdAtLabel ? ` · ${item.createdAtLabel}` : ''}
                      </span>
                      <strong style={{ color: item.score >= 60 ? '#16a34a' : '#d97706' }}>
                        {item.score}/100
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-secondary"
                onClick={async () => {
                  await onSignOut();
                  onClose();
                }}
              >
                Keluar Akun
              </button>
              <button type="button" className="modal-primary" onClick={onClose}>
                Selesai
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
