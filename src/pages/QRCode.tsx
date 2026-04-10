import { useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, RefreshCw, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildQRPayload } from '../utils/storage';

export default function QRCodePage() {
  const { state, regenerateQR } = useApp();
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrValue, setQrValue] = useState('');

  // Build the signed QR payload whenever the secret changes
  useEffect(() => {
    buildQRPayload(state.qrSecret).then(setQrValue);
  }, [state.qrSecret]);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 512;
    canvas.height = 512;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement('a');
      link.download = 'fajr-alarm-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, []);

  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fajr Alarm QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              margin: 0;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; margin-bottom: 32px; }
            svg { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <h1>Fajr Alarm QR Code</h1>
          <p>Place near your bathroom / wash basin</p>
          ${svgData}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  return (
    <div className="page-container" style={{ paddingTop: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.5px' }}>
          QR Code
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Print this and place it far from your bed
        </p>
      </motion.div>

      {/* QR Code Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div ref={qrRef}>
          {qrValue ? (
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="H"
              bgColor="#ffffff"
              fgColor="#0A1628"
              style={{ display: 'block' }}
            />
          ) : (
            <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              Generating...
            </div>
          )}
        </div>
      </motion.div>

      {/* Security info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginBottom: 24,
          background: 'rgba(27, 107, 74, 0.1)',
          border: '1px solid rgba(42, 157, 111, 0.2)',
        }}
      >
        <Shield size={20} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Device-Locked & Signed</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            This QR code is cryptographically signed and bound to your device. It cannot be shared, copied from another phone, or forged. Only scanning <strong>your</strong> QR from <strong>your</strong> device will dismiss the alarm.
          </p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <button className="btn btn-primary btn-full" onClick={handleDownload}>
          <Download size={18} />
          Download QR Code
        </button>

        <button className="btn btn-secondary btn-full" onClick={handlePrint}>
          <Printer size={18} />
          Print QR Code
        </button>

        <button
          className="btn btn-secondary btn-full"
          onClick={regenerateQR}
          style={{ color: 'var(--accent-red)' }}
        >
          <RefreshCw size={18} />
          Regenerate QR Code
        </button>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 32 }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>How to use</h3>
        {[
          { step: '1', text: 'Download or print the QR code above' },
          { step: '2', text: 'Place it near your bathroom or wash basin' },
          { step: '3', text: 'When the alarm rings, get up and scan it' },
          { step: '4', text: 'Make wudu and pray Fajr! 🤲' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--primary-light)',
              flexShrink: 0,
            }}>
              {item.step}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
