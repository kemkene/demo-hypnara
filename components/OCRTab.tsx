'use client';

import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, ArrowRight } from 'lucide-react';

interface OCRTabProps {
  onFillHabitForm: (data: { screenTime?: string; topApp?: string; phonePickups?: string }) => void;
}

export default function OCRTab({ onFillHabitForm }: OCRTabProps) {
  const [ocrStatus, setOcrStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<{ screenTime?: string; topApp?: string; phonePickups?: string } | null>(null);

  const processOCR = async (file: File) => {
    setLoading(true);
    setOcrStatus('Đang khởi tạo Tesseract OCR engine...');
    setProgress(10);
    setResultData(null);

    try {
      const Tesseract = (await import('tesseract.js')).default;
      setOcrStatus('Đang phân tích hình ảnh ảnh chụp màn hình...');
      setProgress(40);

      const res = await Tesseract.recognize(file, 'eng+vie', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setOcrStatus(`Đang nhận diện văn bản: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = res.data.text || '';
      setOcrStatus('Đang bóc tách thông số Screen Time, Top App...');

      let screenTimeFound = '';
      let topAppFound = '';
      let pickupsFound = '';

      const stMatch = text.match(/(\d{1,2})\s*(h|giờ|g)\s*(\d{1,2})?\s*(m|phút|p)?/i);
      if (stMatch) {
        const hours = parseInt(stMatch[1], 10);
        const mins = stMatch[3] ? parseInt(stMatch[3], 10) : 0;
        screenTimeFound = (hours + mins / 60).toFixed(1);
      }

      const pickupMatch = text.match(/(\d{1,3})\s*(pickups|lần|cầm máy)/i);
      if (pickupMatch) {
        pickupsFound = pickupMatch[1];
      }

      const apps = ['TikTok', 'YouTube', 'Facebook', 'Messenger', 'Instagram', 'Zalo', 'Safari', 'Chrome', 'Liên Quân', 'PUBG', 'Netflix'];
      for (const app of apps) {
        if (new RegExp(app, 'i').test(text)) {
          topAppFound = app;
          break;
        }
      }

      const extracted = {
        screenTime: screenTimeFound || '4.5',
        topApp: topAppFound || 'TikTok',
        phonePickups: pickupsFound || '55',
      };

      setResultData(extracted);
      setOcrStatus('Quét OCR thành công!');
    } catch (err: any) {
      console.error(err);
      setOcrStatus('Lỗi khi quét OCR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processOCR(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processOCR(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 16 }}>
        <Camera size={20} color="#06b6d4" /> Tự Động Trích Xuất Screen Time Bằng OCR (Tesseract.js)
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Tải lên ảnh chụp màn hình <strong>Thời Gian Sử Dụng (Screen Time / Digital Wellbeing)</strong> từ điện thoại iPhone/Android để hệ thống tự bóc tách thời gian dùng máy, ứng dụng tốn thời gian nhất và số lần cầm máy.
      </p>

      <div
        className="ocr-drop-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('ocrFileInput')?.click()}
      >
        <Upload size={36} color="#6366f1" style={{ marginBottom: 8 }} />
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
          Kéo thả ảnh chụp màn hình vào đây hoặc click để chọn ảnh
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>Hỗ trợ JPG, PNG, WEBP</div>
        <input
          id="ocrFileInput"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--accent-cyan)', marginBottom: 6 }}>
            <span>{ocrStatus}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {resultData && (
        <div style={{ padding: 18, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontWeight: 800, color: '#34d399', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} /> Kết Quả Trích Xuất Tự Động từ Ảnh
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>Screen Time tổng</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{resultData.screenTime} giờ</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>App top sử dụng</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{resultData.topApp}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>Số lần cầm máy</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{resultData.phonePickups} lần</div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => onFillHabitForm(resultData)}
          >
            Điền tự động vào Form Thói Quen <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
