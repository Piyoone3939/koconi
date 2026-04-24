import type { MatchCandidate } from '../types'

type Props = {
  candidates: MatchCandidate[]
  onSelect: (candidate: MatchCandidate) => void
  onCancel: () => void
}

export default function MatchResultModal({ candidates, onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h2 className="text-lg font-bold mb-1">ランドマーク候補</h2>
        <p className="text-sm text-gray-500 mb-4">AIが判定した候補から選んでください</p>

        <ul className="space-y-2">
          {candidates.map((c, i) => (
            <li key={c.asset_id}>
              <button
                onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-sm">#{i + 1} {c.asset_id}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  スコア: {c.match_score.toFixed(3)} ／ スケール: {c.suggested_scale.toFixed(2)}
                </div>
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
