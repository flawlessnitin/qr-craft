import { useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

interface QRDisplayProps {
  payload: string;
  size: number;
  fgColor: string;
  bgColor: string;
  ecLevel: 'L' | 'M' | 'Q' | 'H';
}

export default function QRDisplay({ payload, size, fgColor, bgColor, ecLevel }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasPayload = payload.trim().length > 0;

  const generateQR = useCallback(async () => {
    if (!canvasRef.current || !hasPayload) return;
    try {
      await QRCode.toCanvas(canvasRef.current, payload, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: ecLevel,
      });
    } catch (err) {
      console.error('QR error:', err);
    }
  }, [payload, size, fgColor, bgColor, ecLevel, hasPayload]);

  useEffect(() => { generateQR(); }, [generateQR]);

  return (
    <div className="qr-display-panel">
      <div className="qr-display-area">
        {hasPayload ? (
          <canvas
            ref={canvasRef}
            key={payload + size + fgColor + bgColor + ecLevel}
          />
        ) : (
          <div className="qr-empty">
            <div className="qr-empty-icon">
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="20" y="20" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="qr-empty-text">Your QR code will appear here</span>
          </div>
        )}
      </div>
      {hasPayload && (
        <div className="qr-size-badge">{size} × {size}px</div>
      )}
    </div>
  );
}
