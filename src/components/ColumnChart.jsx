import { useLayoutEffect, useRef, useState } from 'react';
import { compact } from '../utils/format';

const niceStep = raw => {
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map(n => n * power).find(step => step >= raw);
};

// Single-series daily column chart: hairline grid, 2px gaps, 4px rounded data-ends, hover tooltip.
export default function ColumnChart({ data, unit, height = 220 }) {
  const box = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const pad = { top: 12, right: 4, bottom: 26, left: 36 };
  const innerW = width - pad.left - pad.right, innerH = height - pad.top - pad.bottom;
  const peak = Math.max(0, ...data.map(d => d.value));
  const step = peak ? Math.max(1, niceStep(peak / 4)) : 1;
  const max = step * Math.max(1, Math.ceil(peak / step));
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const band = innerW / data.length;
  const barW = Math.max(1, Math.min(24, band - 2));
  const y = value => pad.top + innerH - (value / max) * innerH;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 64))));
  const bar = (d, i) => {
    if (!d.value) return null;
    const x = pad.left + i * band + (band - barW) / 2, top = y(d.value), h = pad.top + innerH - top;
    const r = Math.min(4, barW / 2, h);
    return <path key={d.key} className="sp-chart-bar" d={`M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top + r}V${top + h}Z`} />;
  };
  const active = hover === null ? null : data[hover];
  return <div className="sp-chart" ref={box}>
    <svg width={width} height={height} role="img" aria-label={`${unit} per day`}>
      {ticks.map(t => <g key={t}><line className="sp-chart-grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} /><text className="sp-chart-tick" x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{compact(t)}</text></g>)}
      {hover !== null && <rect className="sp-chart-hover" x={pad.left + hover * band} y={pad.top} width={band} height={innerH} />}
      {data.map(bar)}
      {data.map((d, i) => (data.length - 1 - i) % labelEvery === 0 && <text key={d.key} className="sp-chart-tick" x={pad.left + i * band + band / 2} y={height - 6} textAnchor="middle">{d.label}</text>)}
      {data.map((d, i) => <rect key={d.key} x={pad.left + i * band} y={pad.top} width={band} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />)}
    </svg>
    {active && <div className="sp-chart-tooltip" style={{ left: Math.min(width - 70, Math.max(70, pad.left + hover * band + band / 2)), top: y(active.value) - 10 }}>
      <span>{active.label}</span><strong>{active.value.toLocaleString()} {unit}</strong>
    </div>}
  </div>;
}
