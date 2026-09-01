'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  chartData7?: any[];
  chartData14?: any[];
  chartData30?: any[];
}

export default function TrendChart({ chartData7 = [], chartData14 = [], chartData30 = [] }: TrendChartProps) {
  const [range, setRange] = useState<'7' | '14' | '30'>('7');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const rawData = range === '7' ? chartData7 : range === '14' ? chartData14 : chartData30;
  const data = [...rawData].reverse();

  if (data.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          <TrendingUp size={18} color="#6366f1" /> Biểu Đồ Xu Hướng Giấc Ngủ & Screen Time
        </div>
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-sub)', fontSize: 13 }}>
          Chưa đủ dữ liệu biểu đồ. Hãy nhập thói quen ít nhất 2 ngày để hiển thị đường xu hướng!
        </div>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = 14;

  const pointsSleep = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartW;
    const val = parseFloat(d.sleepHours) || 0;
    const y = paddingTop + chartH - (val / maxVal) * chartH;
    return { x, y, val, date: d.date, d };
  });

  const pointsScreen = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartW;
    const val = parseFloat(d.screenTime) || 0;
    const y = paddingTop + chartH - (val / maxVal) * chartH;
    return { x, y, val, date: d.date, d };
  });

  const pointsExercise = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartW;
    const val = (parseFloat(d.exerciseMinutes) || 0) / 10;
    const y = paddingTop + chartH - Math.min(chartH, (val / maxVal) * chartH);
    return { x, y, val: parseFloat(d.exerciseMinutes) || 0, date: d.date, d };
  });

  const makePath = (pts: any[]) =>
    pts.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header-flex">
        <div className="card-title">
          <TrendingUp size={18} color="#6366f1" /> Biểu Đồ Xu Hướng Giấc Ngủ, Screen Time & Vận Động
        </div>

        <div className="quick-pills" style={{ marginTop: 0 }}>
          <button
            className={`pill ${range === '7' ? 'active' : ''}`}
            onClick={() => setRange('7')}
          >
            7 Ngày gần nhất
          </button>
          <button
            className={`pill ${range === '14' ? 'active' : ''}`}
            onClick={() => setRange('14')}
          >
            14 Ngày
          </button>
          <button
            className={`pill ${range === '30' ? 'active' : ''}`}
            onClick={() => setRange('30')}
          >
            30 Ngày
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: 12, fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 3, background: '#6366f1', borderRadius: 2 }} />
          <span style={{ color: '#93c5fd' }}>Giờ ngủ (h)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 3, background: '#06b6d4', borderRadius: 2 }} />
          <span style={{ color: '#67e8f9' }}>Screen Time (h)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 3, background: '#10b981', borderRadius: 2 }} />
          <span style={{ color: '#6ee7b7' }}>Vận động (chỉ số / 10 phút)</span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[0, 3, 6, 9, 12].map((v) => {
            const y = paddingTop + chartH - (v / maxVal) * chartH;
            return (
              <g key={v}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="var(--text-sub)" fontSize="10" fontWeight="600">
                  {v}h
                </text>
              </g>
            );
          })}

          <path d={makePath(pointsSleep)} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={makePath(pointsScreen)} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={makePath(pointsExercise)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {pointsSleep.map((pt, i) => (
            <circle
              key={`sleep-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.date === pt.date ? 6 : 4}
              fill="#6366f1"
              stroke="#ffffff"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredPoint(pt)}
            />
          ))}

          {pointsScreen.map((pt, i) => (
            <circle
              key={`screen-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.date === pt.date ? 6 : 3.5}
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="1.5"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredPoint(pt)}
            />
          ))}

          {data.map((d, i) => {
            const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartW;
            const label = d.date.slice(5);
            return (
              <text key={i} x={x} y={svgHeight - 10} textAnchor="middle" fill="var(--text-sub)" fontSize="10" fontWeight="600">
                {label}
              </text>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 8,
              fontSize: 12,
              color: '#fff',
              marginTop: 10,
              display: 'inline-block',
            }}
          >
            <strong>Ngày {hoveredPoint.date}:</strong> Ngủ {hoveredPoint.d.sleepHours || 0}h | ScreenTime {hoveredPoint.d.screenTime || 0}h | Vận động {hoveredPoint.d.exerciseMinutes || 0}p | Cutoff {hoveredPoint.d.phoneCutoffMins ?? '-'}p
          </div>
        )}
      </div>
    </div>
  );
}
