'use client';

import React, { useState } from 'react';
import { BarChart3, Moon, Monitor, Activity, Calendar } from 'lucide-react';

interface TrendChartProps {
  chartData7?: any[];
  chartData14?: any[];
  chartData30?: any[];
}

type ActiveMetric = 'all' | 'sleep' | 'screen' | 'exercise';

export default function TrendChart({ chartData7 = [], chartData14 = [], chartData30 = [] }: TrendChartProps) {
  const [range, setRange] = useState<'7' | '14' | '30'>('7');
  const [selectedMetric, setSelectedMetric] = useState<ActiveMetric>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rawData = range === '7' ? chartData7 : range === '14' ? chartData14 : chartData30;
  // Strictly sort by date ascending (oldest date on left -> newest date on right)
  const data = [...rawData].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (data.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          <BarChart3 size={18} color="#6366f1" /> Biểu Đồ Cột Xu Hướng Giấc Ngủ & Sinh Hoạt
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontSize: 13 }}>
          Chưa đủ dữ liệu biểu đồ. Hãy nhập nhật ký thói quen ít nhất 1 ngày để bắt đầu theo dõi các cột xu hướng!
        </div>
      </div>
    );
  }

  const svgWidth = 820;
  const svgHeight = 270;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 32;
  const paddingBottom = 48;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = 14; // Thang đo tối đa 14 giờ (hoặc 140 phút vận động quy đổi / 10)
  const slotWidth = chartW / data.length;

  // Configuration for grouped columns
  const isAll = selectedMetric === 'all';
  const barWidth = isAll
    ? Math.max(6, Math.min(18, (slotWidth - 12) / 3))
    : Math.max(14, Math.min(36, slotWidth * 0.55));
  const innerGap = 3;

  // Format date display (DD/MM)
  const formatDayLabel = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return dateStr;
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const hoveredItem = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* Header with Title and Range Switcher */}
      <div className="card-header-flex" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="card-title">
          <BarChart3 size={18} color="#6366f1" /> Biểu Đồ Cột Xu Hướng Giấc Ngủ, Screen Time & Vận Động
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Metric Selector Pills */}
          <div className="quick-pills" style={{ marginTop: 0 }}>
            <button
              className={`pill ${selectedMetric === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('all')}
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              Cột ghép (Tất cả)
            </button>
            <button
              className={`pill ${selectedMetric === 'sleep' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('sleep')}
              style={{ fontSize: 11.5, padding: '4px 10px', color: selectedMetric === 'sleep' ? '#fff' : '#a5b4fc' }}
            >
              Giờ ngủ
            </button>
            <button
              className={`pill ${selectedMetric === 'screen' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('screen')}
              style={{ fontSize: 11.5, padding: '4px 10px', color: selectedMetric === 'screen' ? '#fff' : '#67e8f9' }}
            >
              Screen Time
            </button>
            <button
              className={`pill ${selectedMetric === 'exercise' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('exercise')}
              style={{ fontSize: 11.5, padding: '4px 10px', color: selectedMetric === 'exercise' ? '#fff' : '#6ee7b7' }}
            >
              Vận động
            </button>
          </div>

          {/* Time Range Pills */}
          <div className="quick-pills" style={{ marginTop: 0 }}>
            <button
              className={`pill ${range === '7' ? 'active' : ''}`}
              onClick={() => setRange('7')}
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              7 Ngày
            </button>
            <button
              className={`pill ${range === '14' ? 'active' : ''}`}
              onClick={() => setRange('14')}
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              14 Ngày
            </button>
            <button
              className={`pill ${range === '30' ? 'active' : ''}`}
              onClick={() => setRange('30')}
              style={{ fontSize: 11.5, padding: '4px 10px' }}
            >
              30 Ngày
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Target Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          margin: '12px 0 14px 0',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(selectedMetric === 'all' || selectedMetric === 'sleep') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)' }} />
              <span style={{ color: '#c7d2fe' }}>Giờ ngủ (h)</span>
            </div>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'screen') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)' }} />
              <span style={{ color: '#a5f3fc' }}>Screen Time (h)</span>
            </div>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'exercise') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }} />
              <span style={{ color: '#a7f3d0' }}>Vận động (10p / vạch)</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#fcd34d' }}>
          <div style={{ width: 16, height: 2, borderTop: '2px dashed #f59e0b' }} />
          <span>Vùng chuẩn ngủ vàng: 7.0 - 9.0h</span>
        </div>
      </div>

      {/* SVG Bar Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: range === '30' ? 650 : 'auto' }}
        >
          <defs>
            {/* Column Gradients */}
            <linearGradient id="barSleepGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="barScreenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="barExerciseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Target sleep zone pattern */}
            <linearGradient id="targetZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.08)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.03)" />
            </linearGradient>
          </defs>

          {/* Reference Sleep Target Band (7h - 9h) */}
          {(() => {
            const y9 = paddingTop + chartH - (9 / maxVal) * chartH;
            const y7 = paddingTop + chartH - (7 / maxVal) * chartH;
            const bandHeight = y7 - y9;
            return (
              <g>
                <rect
                  x={paddingLeft}
                  y={y9}
                  width={chartW}
                  height={bandHeight}
                  fill="url(#targetZoneGrad)"
                />
                <line
                  x1={paddingLeft}
                  y1={y9}
                  x2={svgWidth - paddingRight}
                  y2={y9}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <line
                  x1={paddingLeft}
                  y1={y7}
                  x2={svgWidth - paddingRight}
                  y2={y7}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <text
                  x={svgWidth - paddingRight - 4}
                  y={y7 - 4}
                  textAnchor="end"
                  fill="#fbbf24"
                  fontSize="9.5"
                  fontWeight="600"
                  opacity="0.8"
                >
                  Mục tiêu 7 - 9h
                </text>
              </g>
            );
          })()}

          {/* Horizontal Grid lines and Y-Axis labels */}
          {[0, 3, 6, 9, 12].map((v) => {
            const y = paddingTop + chartH - (v / maxVal) * chartH;
            return (
              <g key={v}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="var(--text-sub)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {v}h
                </text>
              </g>
            );
          })}

          {/* Render Columns for each Day */}
          {data.map((d, i) => {
            const slotCenterX = paddingLeft + (i + 0.5) * slotWidth;
            const isHovered = hoveredIndex === i;

            const sleepVal = parseFloat(d.sleepHours) || 0;
            const screenVal = parseFloat(d.screenTime) || 0;
            const exerciseVal = (parseFloat(d.exerciseMinutes) || 0) / 10;

            const hSleep = Math.max(sleepVal > 0 ? 3 : 0, (sleepVal / maxVal) * chartH);
            const hScreen = Math.max(screenVal > 0 ? 3 : 0, (screenVal / maxVal) * chartH);
            const hExercise = Math.max(exerciseVal > 0 ? 3 : 0, Math.min(chartH, (exerciseVal / maxVal) * chartH));

            const ySleep = paddingTop + chartH - hSleep;
            const yScreen = paddingTop + chartH - hScreen;
            const yExercise = paddingTop + chartH - hExercise;

            // X positions based on active mode
            let xSleep = slotCenterX - barWidth / 2;
            let xScreen = slotCenterX - barWidth / 2;
            let xExercise = slotCenterX - barWidth / 2;

            if (isAll) {
              const totalClusterWidth = barWidth * 3 + innerGap * 2;
              const startX = slotCenterX - totalClusterWidth / 2;
              xSleep = startX;
              xScreen = startX + barWidth + innerGap;
              xExercise = startX + (barWidth + innerGap) * 2;
            }

            return (
              <g
                key={`day-${d.date || i}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background highlight pill on hover */}
                {isHovered && (
                  <rect
                    x={paddingLeft + i * slotWidth + 2}
                    y={paddingTop - 6}
                    width={slotWidth - 4}
                    height={chartH + 12}
                    fill="rgba(255, 255, 255, 0.05)"
                    rx="6"
                  />
                )}

                {/* Sleep Column */}
                {(isAll || selectedMetric === 'sleep') && sleepVal > 0 && (
                  <g>
                    <rect
                      x={xSleep}
                      y={ySleep}
                      width={barWidth}
                      height={hSleep}
                      fill="url(#barSleepGrad)"
                      rx="3.5"
                      opacity={isHovered ? 1 : 0.9}
                      filter={isHovered ? 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.6))' : 'none'}
                    />
                    {/* Top value indicator when hovered or in single metric mode */}
                    {(!isAll || isHovered) && (
                      <text
                        x={xSleep + barWidth / 2}
                        y={ySleep - 4}
                        textAnchor="middle"
                        fill="#c7d2fe"
                        fontSize="9"
                        fontWeight="700"
                      >
                        {sleepVal}h
                      </text>
                    )}
                  </g>
                )}

                {/* Screen Time Column */}
                {(isAll || selectedMetric === 'screen') && screenVal > 0 && (
                  <g>
                    <rect
                      x={xScreen}
                      y={yScreen}
                      width={barWidth}
                      height={hScreen}
                      fill="url(#barScreenGrad)"
                      rx="3.5"
                      opacity={isHovered ? 1 : 0.9}
                      filter={isHovered ? 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' : 'none'}
                    />
                    {(!isAll || isHovered) && (
                      <text
                        x={xScreen + barWidth / 2}
                        y={yScreen - 4}
                        textAnchor="middle"
                        fill="#a5f3fc"
                        fontSize="9"
                        fontWeight="700"
                      >
                        {screenVal}h
                      </text>
                    )}
                  </g>
                )}

                {/* Exercise Column */}
                {(isAll || selectedMetric === 'exercise') && exerciseVal > 0 && (
                  <g>
                    <rect
                      x={xExercise}
                      y={yExercise}
                      width={barWidth}
                      height={hExercise}
                      fill="url(#barExerciseGrad)"
                      rx="3.5"
                      opacity={isHovered ? 1 : 0.9}
                      filter={isHovered ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' : 'none'}
                    />
                    {(!isAll || isHovered) && (
                      <text
                        x={xExercise + barWidth / 2}
                        y={yExercise - 4}
                        textAnchor="middle"
                        fill="#a7f3d0"
                        fontSize="9"
                        fontWeight="700"
                      >
                        {d.exerciseMinutes}p
                      </text>
                    )}
                  </g>
                )}

                {/* X-Axis Date Label */}
                {(() => {
                  // If range is 30, display labels on every 2nd or 3rd day to avoid clutter
                  const shouldShowLabel =
                    range === '7' ||
                    range === '14' ||
                    i % 2 === 0 ||
                    i === data.length - 1;

                  if (!shouldShowLabel) return null;

                  return (
                    <text
                      x={slotCenterX}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      fill={isHovered ? '#ffffff' : 'var(--text-sub)'}
                      fontSize={range === '30' ? '9' : '10'}
                      fontWeight={isHovered ? '700' : '600'}
                    >
                      {formatDayLabel(d.date)}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Baseline horizontal line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartH}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartH}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Detailed Floating Information Card on Hover */}
        {hoveredItem && (
          <div
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12.5,
              color: '#ffffff',
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#e0e7ff' }}>
              <Calendar size={15} color="#818cf8" />
              <span>Ngày: {hoveredItem.date}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: '#c7d2fe' }}>
                🌙 Ngủ: <strong>{hoveredItem.sleepHours ?? 0}h</strong>
              </span>
              <span style={{ color: '#a5f3fc' }}>
                📱 Screen: <strong>{hoveredItem.screenTime ?? 0}h</strong>
              </span>
              <span style={{ color: '#a7f3d0' }}>
                🏃 Vận động: <strong>{hoveredItem.exerciseMinutes ?? 0} phút</strong>
              </span>
              <span style={{ color: '#fde68a' }}>
                📴 Rời máy: <strong>{hoveredItem.phoneCutoffMins ? `${hoveredItem.phoneCutoffMins}p` : 'Không'}</strong>
              </span>
              <span style={{ color: '#fbcfe8' }}>
                {hoveredItem.mood ? `Tâm trạng: ${hoveredItem.mood}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
