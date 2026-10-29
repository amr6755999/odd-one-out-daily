import type { PuzzleRound, PuzzleTile, ShapeKind, SymbolKind } from '../game/engine';

const shapePaths: Record<ShapeKind, string> = {
  triangle: 'M50 12 L88 82 L12 82 Z',
  diamond: 'M50 8 L90 50 L50 92 L10 50 Z',
  pentagon: 'M50 8 L91 38 L75 88 L25 88 L9 38 Z',
  hexagon: 'M28 10 L72 10 L94 50 L72 90 L28 90 L6 50 Z',
  burst: 'M50 5 L59 31 L83 17 L72 42 L97 50 L72 59 L83 83 L59 72 L50 97 L41 72 L17 83 L28 59 L3 50 L28 42 L17 17 L41 31 Z',
  ticket: 'M15 10 H85 Q77 20 85 30 Q77 40 85 50 Q77 60 85 70 Q77 80 85 90 H15 Q23 80 15 70 Q23 60 15 50 Q23 40 15 30 Q23 20 15 10 Z',
};

function symbolElement(symbol: SymbolKind) {
  switch (symbol) {
    case 'star': return <path d="M50 27 L56 43 L73 44 L60 55 L64 72 L50 62 L36 72 L40 55 L27 44 L44 43 Z" fill="#fff" />;
    case 'dot': return <circle cx="50" cy="50" r="10" fill="#fff" />;
    case 'cross': return <path d="M44 28 H56 V44 H72 V56 H56 V72 H44 V56 H28 V44 H44 Z" fill="#fff" />;
    case 'ring': return <circle cx="50" cy="50" r="13" fill="none" stroke="#fff" strokeWidth="6" />;
    case 'heart': return <path d="M50 70 C43 62 29 53 29 42 C29 30 44 27 50 39 C57 27 72 30 72 42 C72 53 58 62 50 70 Z" fill="#fff" />;
  }
}

interface ShapeTileProps {
  tile: PuzzleTile;
  shape: ShapeKind;
  round: PuzzleRound;
  index: number;
  disabled: boolean;
  status: 'idle' | 'correct' | 'wrong';
  onSelect: (index: number) => void;
  label: string;
}

export function ShapeTile({ tile, shape, round, index, disabled, status, onSelect, label }: ShapeTileProps) {
  return (
    <button
      type="button"
      className={`shape-tile ${status !== 'idle' ? `is-${status}` : ''}`}
      onClick={() => onSelect(index)}
      disabled={disabled}
      aria-label={label}
      aria-pressed={status === 'correct'}
      data-mode={round.mode}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g transform={`translate(50 50) rotate(${tile.rotation}) scale(${tile.scale}) translate(-50 -50)`}>
          <path d={shapePaths[shape]} fill={tile.color} />
          {symbolElement(tile.symbol)}
        </g>
      </svg>
      {status === 'correct' && <span className="tile-feedback" aria-hidden="true">✓</span>}
      {status === 'wrong' && <span className="tile-feedback" aria-hidden="true">×</span>}
    </button>
  );
}
