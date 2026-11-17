import { useState } from 'react';
import { DAILY_CHALLENGE_QUIZ } from '../data/materials';
import type { QuizEvaluationResult } from '../types/biovia';
import { evaluateQuiz } from '../utils/bioviaLogic';

interface DailyChallengeModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onChallengeCompleted?: (payload: {
    score: number;
    correctCount: number;
    totalQuestions: number;
  }) => Promise<void> | void;
}

export function DailyChallengeModal({
  isOpen,
  isAuthenticated,
  onClose,
  onChallengeCompleted,
}: DailyChallengeModalProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const evaluation = evaluateQuiz(DAILY_CHALLENGE_QUIZ, answers);
    if (!evaluation.complete) {
      setError('Jawab semua 5 pertanyaan terlebih dahulu, ya!');
      return;
    }
    setError(null);
    setResult(evaluation);
    void onChallengeCompleted?.({
      score: evaluation.score,
      correctCount: evaluation.correctCount,
      totalQuestions: evaluation.totalQuestions,
    });
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setError(null);
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
        aria-labelledby="dailyChallengeTitle"
        style={{ width: 'min(100%, 600px)' }}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Tutup tantangan"
          onClick={onClose}
        >
          ×
        </button>

        <span className="subject-tag tag-human">DAILY CHALLENGE · 5 PERTANYAAN</span>
        <h2 id="dailyChallengeTitle">Tantangan Hari Ini: Organ Tubuh &amp; Sel</h2>
        <p>Uji pengetahuan biologi dasar kamu dalam 3 menit.</p>

        <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
          {DAILY_CHALLENGE_QUIZ.map((q, qIdx) => (
            <div
              key={qIdx}
              style={{
                border: '1px solid #e5edf5',
                borderRadius: '10px',
                padding: '12px 14px',
                background: '#fbfdff',
              }}
            >
              <strong
                style={{
                  fontSize: '12px',
                  color: '#183653',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {qIdx + 1}. {q.question}
              </strong>
              <div style={{ display: 'grid', gap: '6px' }}>
                {q.options.map((opt, optIdx) => {
                  const checked = answers[qIdx] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: checked ? '1px solid #20bfd1' : '1px solid #e8eef2',
                        background: checked ? '#e8f9fb' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name={`daily-${qIdx}`}
                        checked={checked}
                        disabled={result !== null}
                        onChange={() => {
                          setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                          setError(null);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {result && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: result.outcomes[qIdx].isCorrect ? '#16a34a' : '#dc2626',
                  }}
                >
                  <strong>
                    {result.outcomes[qIdx].isCorrect ? '✓ Benar' : '✕ Belum Tepat'}
                  </strong>{' '}
                  — {result.outcomes[qIdx].explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#e8f9fb',
              color: '#0b5c6b',
              fontSize: '12px',
            }}
          >
            <strong>Skor Tantangan: {result.score}/100</strong> ({result.correctCount} dari{' '}
            {result.totalQuestions} benar)
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#4c7382' }}>
              {isAuthenticated
                ? '✓ Skor dan XP tercatat di database Firestore.'
                : 'Mode Tamu — Masuk dengan Google untuk menyimpan riwayat ke database.'}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-secondary" onClick={onClose}>
            Tutup
          </button>
          {result === null ? (
            <button type="button" className="modal-primary" onClick={handleSubmit}>
              Periksa Jawaban <span>→</span>
            </button>
          ) : (
            <button type="button" className="modal-primary" onClick={handleReset}>
              Ulangi Tantangan <span>↻</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
