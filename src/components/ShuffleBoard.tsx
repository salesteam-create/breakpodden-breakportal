// Side-by-side board that replaces the Excel sheet: the left column stays in
// purchase order, the right column glides into its new order on every shuffle round.

interface Props {
  left: string[];
  order: string[];
  leftLabel: string;
  rightLabel: string;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
  leftTags?: string[];
  shuffling?: boolean;
  /** Draw a cut line after this many rows (filler draw: top N win). */
  winTop?: number;
  done?: boolean;
  rowH?: number;
  scale?: number;
}

export default function ShuffleBoard({
  left, order, leftLabel, rightLabel, leftPlaceholder, rightPlaceholder, leftTags,
  shuffling, winTop, done, rowH = 40, scale = 1,
}: Props) {
  const rows = Math.max(left.length, order.length, 1);
  const gap = 6 * scale;
  const h = rowH * scale;
  const step = h + gap;
  const height = rows * step - gap;
  const font = { fontSize: 14 * scale };

  return (
    <div className="board" style={{ gridTemplateColumns: `${44 * scale}px 1fr 1fr`, columnGap: 14 * scale }}>
      <div className="board-label" style={{ fontSize: 11 * scale }}>#</div>
      <div className="board-label" style={{ fontSize: 11 * scale }}>{leftLabel}</div>
      <div className="board-label" style={{ fontSize: 11 * scale }}>{rightLabel}</div>

      <div className="col" style={{ height }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="cell idx" style={{ top: i * step, height: h, fontSize: 12 * scale }}>{i + 1}</div>
        ))}
      </div>

      <div className="col" style={{ height }}>
        {left.length === 0 && leftPlaceholder && (
          <div className="cell" style={{ top: 0, height: h, ...font, color: 'var(--dim)', borderStyle: 'dashed' }}>{leftPlaceholder}</div>
        )}
        {left.map((name, i) => (
          <div key={i} className={`cell${done && (winTop === undefined || i < winTop) ? ' win' : ''}`} style={{ top: i * step, height: h, ...font }}>
            {name}
            {leftTags?.[i] && <span className="tag">{leftTags[i]}</span>}
          </div>
        ))}
        {winTop !== undefined && (
          <div className="cut-line" style={{ top: winTop * step - gap / 2 }}>
            <span style={{ fontSize: 11 * scale, left: 58, right: 'auto', top: 6 }}>Top {winTop} win a spot ↑</span>
          </div>
        )}
      </div>

      <div className="col" style={{ height }}>
        {order.length === 0 && rightPlaceholder && (
          <div className="cell" style={{ top: 0, height: h, ...font, color: 'var(--dim)', borderStyle: 'dashed' }}>{rightPlaceholder}</div>
        )}
        {order.map((name, i) => (
          <div
            key={name}
            className={`cell team${shuffling ? ' moving' : ''}${done && (winTop === undefined || i < winTop) ? ' win' : ''}`}
            style={{ top: i * step, height: h, ...font }}
          >
            {name}
          </div>
        ))}
        {winTop !== undefined && <div className="cut-line" style={{ top: winTop * step - gap / 2, left: 0 }} />}
      </div>
    </div>
  );
}
