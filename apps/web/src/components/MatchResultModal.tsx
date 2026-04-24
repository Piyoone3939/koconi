import type { MatchCandidate } from '../types'

type Props = {
  candidates: MatchCandidate[]
  onSelect: (candidate: MatchCandidate) => void
  onCancel: () => void
}

export default function MatchResultModal({ candidates, onSelect, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6"
        style={{ background: '#1e293b' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ハンドル */}
        <div className="flex justify-center mb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#334155' }} />
        </div>

        <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          ランドマーク候補
        </div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
          AIが判定した候補から選んでください
        </div>

        <ul className="space-y-3">
          {candidates.map((c, i) => (
            <li key={c.asset_id}>
              <button
                onClick={() => onSelect(c)}
                className="w-full text-left rounded-2xl transition-all"
                style={{
                  padding: '14px 16px',
                  background: '#0f172a',
                  border: '1.5px solid #334155',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#E86F00'
                  e.currentTarget.style.background = 'rgba(232,111,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155'
                  e.currentTarget.style.background = '#0f172a'
                }}
              >
                <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 700 }}>
                  #{i + 1}　{c.asset_id}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                  スコア: {c.match_score.toFixed(3)}　／　スケール: {c.suggested_scale.toFixed(2)}
                </div>
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onCancel}
          className="mt-5 w-full py-3 rounded-2xl"
          style={{
            background: '#0f172a',
            color: '#6366f1',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
