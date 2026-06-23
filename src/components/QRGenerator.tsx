import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import QRCode from 'qrcode';
import type { ContentType } from '../lib/qr-formatters';
import { formatPayload } from '../lib/qr-formatters';
import TypeSelector from './TypeSelector';
import DynamicForm from './DynamicForm';
import QRPreview from './QRPreview';

type ECLevel = 'L' | 'M' | 'Q' | 'H';
type Format = 'png' | 'jpg' | 'svg';

export default function QRGenerator() {
  const [selectedType, setSelectedType] = useState<ContentType>('url');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [payload, setPayload] = useState('');
  
  // Settings
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#111118');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecLevel, setEcLevel] = useState<ECLevel>('M');
  const [format, setFormat] = useState<Format>('png');
  
  const [toast, setToast] = useState({ message: '', visible: false });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPayload = payload.trim().length > 0;

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  }, []);

  const updatePayload = useCallback(
    (type: ContentType, data: Record<string, string>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPayload(formatPayload(type, data));
      }, 300);
    },
    []
  );

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleTypeChange = (type: ContentType) => {
    setSelectedType(type);
    setFormData({});
    setPayload('');
  };

  const handleFieldChange = (name: string, value: string) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    updatePayload(selectedType, newData);
  };

  // Export Logic
  const renderExport = async (transparent: boolean): Promise<HTMLCanvasElement> => {
    const c = document.createElement('canvas');
    await QRCode.toCanvas(c, payload, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: transparent ? '#00000000' : bgColor },
      errorCorrectionLevel: ecLevel,
    });
    return c;
  };

  const handleDownload = async () => {
    if (!hasPayload) return;
    try {
      if (format === 'svg') {
        const svg = await QRCode.toString(payload, {
          type: 'svg', width: size, margin: 2,
          color: { dark: fgColor, light: '#00000000' },
          errorCorrectionLevel: ecLevel,
        });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = 'qrcode.svg'; a.href = url; a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const c = await renderExport(true);
        const a = document.createElement('a');
        a.download = 'qrcode.png'; a.href = c.toDataURL('image/png'); a.click();
      } else {
        const c = await renderExport(false);
        const a = document.createElement('a');
        a.download = 'qrcode.jpg'; a.href = c.toDataURL('image/jpeg', 0.95); a.click();
      }
      showToast(`Downloaded as .${format}`);
    } catch (err) { console.error('Download error:', err); }
  };

  const handleCopy = async () => {
    if (!hasPayload) return;
    try {
      const c = await renderExport(true);
      const blob = await new Promise<Blob>((res, rej) => {
        c.toBlob((b) => b ? res(b) : rej(new Error('blob failed')), 'image/png');
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied to clipboard');
    } catch (err) { console.error('Copy error:', err); }
  };

  const formats: { id: Format; label: string }[] = [
    { id: 'png', label: 'PNG' },
    { id: 'jpg', label: 'JPG' },
    { id: 'svg', label: 'SVG' },
  ];

  return (
    <div className="app-card">
      <TypeSelector selected={selectedType} onSelect={handleTypeChange} />
      
      <div className="app-body">
        {/* Left Column: Form + Controls + Export */}
        <div className="left-panel">
          <DynamicForm
            type={selectedType}
            formData={formData}
            onChange={handleFieldChange}
          />
          
          <div className="controls">
            <h3 className="section-title">Design</h3>
            {/* Size */}
            <div className="ctrl-row">
              <span className="ctrl-label">Size</span>
              <input
                type="range" className="slider" min={128} max={1024} step={32}
                value={size} onChange={(e) => setSize(Number(e.target.value))}
              />
              <span className="ctrl-value">{size}</span>
            </div>

            {/* Colors */}
            <div className="ctrl-row">
              <span className="ctrl-label">Color</span>
              <div className="color-btn" style={{ background: fgColor }} title="Foreground">
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
              </div>
              <div className="color-btn" style={{ background: bgColor }} title="Background">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              </div>
            </div>

            {/* Error Correction */}
            <div className="ctrl-row">
              <span className="ctrl-label" style={{ minWidth: '110px' }}>Error Correction</span>
              <select
                className="ctrl-select" value={ecLevel}
                onChange={(e) => setEcLevel(e.target.value as ECLevel)}
                style={{ flex: 1 }}
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
          </div>

          <div className="export-bar">
            <h3 className="section-title">Export</h3>
            <div className="seg-control">
              {formats.map((f) => (
                <button
                  key={f.id}
                  className={`seg-btn${format === f.id ? ' active' : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  {f.label}
                </button>
              ))}
              <div 
                className="seg-indicator"
                style={{ 
                  left: `${formats.findIndex(f => f.id === format) * 33.33}%`,
                  width: '33.33%'
                }}
              />
            </div>

            <div className="action-row">
              <button className="btn btn-primary" onClick={handleDownload} disabled={!hasPayload}>
                <span className="btn-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8m0 0L4.5 6.5M7 9l2.5-2.5M2 11v.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Download .{format}
              </button>
              <button className="btn btn-ghost" onClick={handleCopy} disabled={!hasPayload}>
                <span className="btn-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M2.5 9.5V2.5a1 1 0 011-1h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </span>
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: QR Display */}
        <div className="right-panel">
          <QRPreview
            payload={payload}
            size={size}
            fgColor={fgColor}
            bgColor={bgColor}
            ecLevel={ecLevel}
          />
        </div>
      </div>
      
      {/* Toast */}
      <div className={`toast${toast.visible ? ' visible' : ''}`}>
        <span className="toast-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        {toast.message}
      </div>
    </div>
  );
}
