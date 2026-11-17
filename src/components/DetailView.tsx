import { useEffect, useState } from 'react';
import { CATALOG_CARDS, MATERIALS_DETAIL } from '../data/materials';
import type {
  MaterialCategory,
  MaterialProgressDoc,
  QuizEvaluationResult,
} from '../types/biovia';
import { evaluateQuiz } from '../utils/bioviaLogic';

export interface MaterialQuizSubmitPayload {
  slug: string;
  title: string;
  category: MaterialCategory;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

interface DetailViewProps {
  materialId: string;
  isAuthenticated: boolean;
  existingProgress?: MaterialProgressDoc;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onNavigateDashboard: () => void;
  onNavigateJelajahi: () => void;
  onQuizCompleted: (payload: MaterialQuizSubmitPayload) => Promise<void> | void;
}

export function DetailView({
  materialId,
  isAuthenticated,
  existingProgress,
  saveStatus,
  onNavigateDashboard,
  onNavigateJelajahi,
  onQuizCompleted,
}: DetailViewProps) {
  const material = MATERIALS_DETAIL[materialId];
  const catalogEntry = CATALOG_CARDS.find((card) => card.slug === materialId);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizEvaluationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({});
    setQuizResult(null);
    setValidationError(null);
    document.title = material ? `${material.title} | BIOVIA` : 'Materi Tidak Ditemukan | BIOVIA';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [materialId, material]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setValidationError(null);
  };

  const handleSubmitQuiz = () => {
    if (!material) return;
    const evaluation = evaluateQuiz(material.quiz, answers);
    if (!evaluation.complete) {
      setValidationError('Silakan jawab semua pertanyaan terlebih dahulu.');
      return;
    }
    setValidationError(null);
    setQuizResult(evaluation);
    void onQuizCompleted({
      slug: materialId,
      title: material.title,
      category: catalogEntry?.category ?? 'manusia',
      score: evaluation.score,
      correctCount: evaluation.correctCount,
      totalQuestions: evaluation.totalQuestions,
    });
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setQuizResult(null);
    setValidationError(null);
  };

  return (
    <div className="detail-page">
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="brand" onClick={onNavigateDashboard}>
            <div className="brand-icon">🧬</div>
            <div>
              <h2>BIOVIA</h2>
              <span>Biology Virtual Interactive Application</span>
            </div>
          </button>
        </div>

        <div className="topbar-right">
          <button type="button" className="back-button" onClick={onNavigateJelajahi}>
            ← Kembali ke Materi
          </button>
        </div>
      </header>

      <main className="main-container">
        {!material ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '60px' }}>🔍</div>
            <h2>Materi Tidak Ditemukan</h2>
            <p>Maaf, materi yang kamu cari belum tersedia.</p>
            <br />
            <button type="button" className="primary-button" onClick={onNavigateJelajahi}>
              Kembali ke Jelajahi Materi
            </button>
          </div>
        ) : (
          <>
            <div className="breadcrumb">
              <button type="button" onClick={onNavigateDashboard}>
                Beranda
              </button>
              <span>/</span>
              <button type="button" onClick={onNavigateJelajahi}>
                Jelajahi Materi
              </button>
              <span>/</span>
              <span id="breadcrumbTitle">{material.title}</span>
            </div>

            <section className="detail-hero">
              <div className="hero-content">
                <span className="category-label" id="categoryLabel">
                  {material.category}
                </span>
                <h1 id="materialTitle">{material.title}</h1>
                <p id="materialDescription">{material.description}</p>
                <div className="material-information">
                  <span>📚 IPA Biologi</span>
                  <span>
                    ⏱ <span id="duration">{material.duration}</span>
                  </span>
                  <span>🎓 SMP</span>
                  {existingProgress && (
                    <span>
                      {existingProgress.completed ? '✓ Lulus · ' : ''}Skor terbaik:{' '}
                      {existingProgress.bestScore}/100
                    </span>
                  )}
                </div>
              </div>

              <div className="hero-illustration">
                <div className="illustration-circle">
                  <span id="materialEmoji">{material.emoji}</span>
                </div>
                <div className="floating-badge">BIOVIA LEARNING</div>
              </div>
            </section>

            <section className="content-card objective-card">
              <div className="section-heading">
                <div className="section-icon">🎯</div>
                <div>
                  <span className="section-subtitle">TARGET BELAJAR</span>
                  <h2>Tujuan Pembelajaran</h2>
                </div>
              </div>
              <p className="section-description">
                Setelah mempelajari materi ini, kamu diharapkan mampu:
              </p>
              <ul id="objectiveList" className="objective-list">
                {material.objectives.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="learning-section">
              <div className="section-heading">
                <div className="section-icon">📖</div>
                <div>
                  <span className="section-subtitle">MATERI PEMBELAJARAN</span>
                  <h2>Yuk, Mulai Belajar!</h2>
                </div>
              </div>

              <div id="lessonContent">
                {material.lessons.map((lesson, idx) => (
                  <div key={idx} className="lesson-card">
                    <h3>{lesson.title}</h3>
                    {lesson.paragraphs.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                    <div className="lesson-highlight">💡 {lesson.highlight}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div className="section-icon">🔬</div>
                <div>
                  <span className="section-subtitle">EKSPLORASI ILMU</span>
                  <h2>Bagian dan Fungsinya</h2>
                </div>
              </div>
              <p className="section-description">
                Kenali bagian-bagian penting dalam materi yang sedang kamu pelajari.
              </p>
              <div className="parts-grid" id="partsGrid">
                {material.parts.map((part, idx) => (
                  <div key={idx} className="part-card">
                    <span className="part-number">BAGIAN {idx + 1}</span>
                    <h3>{part.name}</h3>
                    <p>{part.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="summary-card">
              <div className="summary-icon">💡</div>
              <div>
                <span className="section-subtitle">INGAT KEMBALI</span>
                <h2>Kesimpulan Materi</h2>
                <p id="summaryText">{material.summary}</p>
              </div>
            </section>

            <section className="quiz-section">
              <div className="section-heading">
                <div className="section-icon">🧠</div>
                <div>
                  <span className="section-subtitle">UJI PEMAHAMAN</span>
                  <h2>Seberapa Paham Kamu?</h2>
                </div>
              </div>
              <p className="section-description">
                Jawab pertanyaan berikut untuk menguji pemahamanmu.
              </p>

              <div id="quizContainer">
                {material.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="question-card">
                    <h3>
                      {qIdx + 1}. {q.question}
                    </h3>
                    {q.options.map((option, optIdx) => {
                      const isChecked = answers[qIdx] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          className={`answer-option${isChecked ? ' selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIdx}`}
                            value={optIdx}
                            checked={isChecked}
                            disabled={quizResult !== null}
                            onChange={() => handleSelectOption(qIdx, optIdx)}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>

              {validationError && (
                <div className="quiz-warning" role="alert">
                  {validationError}
                </div>
              )}

              <div className="quiz-footer">
                {quizResult === null ? (
                  <button
                    type="button"
                    id="submitQuiz"
                    className="primary-button"
                    onClick={handleSubmitQuiz}
                  >
                    Periksa Jawaban →
                  </button>
                ) : (
                  <button
                    type="button"
                    id="retryQuiz"
                    className="secondary-button"
                    onClick={handleRetryQuiz}
                  >
                    Ulangi Kuis
                  </button>
                )}
              </div>

              {quizResult && (
                <div id="quizResult" className="quiz-result">
                  <h3>🎉 Hasil Kuis Kamu</h3>
                  <h1>{quizResult.score}/100</h1>
                  <p>
                    Kamu menjawab {quizResult.correctCount} dari {quizResult.totalQuestions} soal
                    dengan benar.
                  </p>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#0b6d7c', fontWeight: 600 }}>
                    {!isAuthenticated
                      ? 'Mode Tamu aktif — Masuk dengan Google agar skor dan XP tersimpan ke database.'
                      : saveStatus === 'saving'
                        ? 'Menyimpan hasil kuis ke database Firestore...'
                        : saveStatus === 'saved'
                          ? '✓ Hasil kuis dan XP tersimpan otomatis ke database Firestore.'
                          : saveStatus === 'error'
                            ? 'Gagal menyimpan ke database cloud. Periksa koneksi dan coba lagi.'
                            : null}
                  </p>
                  <hr
                    style={{
                      margin: '18px 0',
                      border: 0,
                      borderTop: '1px solid #d5e7ff',
                    }}
                  />
                  {quizResult.outcomes.map((outcome) => (
                    <div key={outcome.index} style={{ marginBottom: '15px' }}>
                      <strong className={outcome.isCorrect ? 'correct-answer' : 'wrong-answer'}>
                        {outcome.index + 1}. {outcome.isCorrect ? '✓ Benar' : '✕ Belum Tepat'}
                      </strong>
                      <p style={{ margin: '4px 0 0' }}>{outcome.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bottom-navigation">
              <button type="button" className="secondary-button" onClick={onNavigateJelajahi}>
                ← Materi Lainnya
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Kembali ke Atas ↑
              </button>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-brand">🧬 BIOVIA</div>
        <p>Belajar Biologi Lebih Menarik, Interaktif, dan Menyenangkan.</p>
        <span>© 2026 BIOVIA Learning Platform</span>
      </footer>
    </div>
  );
}
