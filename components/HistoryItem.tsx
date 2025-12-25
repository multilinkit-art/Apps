
import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Trash2, Clock, QrCode, Download, X, Settings2 } from 'lucide-react';
import { ShortenedLink } from '../types';
import QRCode from 'qrcode';

interface HistoryItemProps {
  link: ShortenedLink;
  onDelete: (id: string) => void;
}

const QR_SIZES = [200, 400, 600, 800];
const ERROR_LEVELS = [
  { key: 'L', label: 'Low (7%)' },
  { key: 'M', label: 'Med (15%)' },
  { key: 'Q', label: 'Quart (25%)' },
  { key: 'H', label: 'High (30%)' }
] as const;

const HistoryItem: React.FC<HistoryItemProps> = ({ link, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(400);
  const [qrErrorLevel, setQrErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  useEffect(() => {
    if (showQR) {
      setQrDataUrl(''); // Clear to show loading state during regeneration
      QRCode.toDataURL(link.shortUrl, {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: qrErrorLevel,
        color: {
          dark: '#10b981', // Emerald 500
          light: '#020617', // Slate 950
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Gen Error:', err));
    }
  }, [showQR, link.shortUrl, qrSize, qrErrorLevel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const linkEl = document.createElement('a');
    linkEl.href = qrDataUrl;
    linkEl.download = `qrcode-${link.alias}-${qrSize}px.png`;
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 mb-4 transition-all hover:bg-slate-800/60 active:bg-slate-800/80 group relative card">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {link.provider}
            </span>
          </div>
          <h3 className="font-bold truncate text-lg text-white group-hover:text-emerald-400 transition-colors">
            {link.provider}/{link.alias}
          </h3>
          <p className="text-slate-500 text-xs truncate mt-0.5 font-medium">
            {link.originalUrl}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className={`p-2 rounded-full transition-all active:scale-90 ${showQR ? 'bg-emerald-500 text-slate-950 scale-110 shadow-lg shadow-emerald-500/20' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'}`}
            title="Show QR Code"
          >
            <QrCode size={18} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-600 active:scale-90 transition-all text-slate-300 hover:text-white"
            title="Copy link"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 bg-slate-700/50 rounded-full hover:bg-red-500/20 active:scale-90 transition-all text-slate-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {showQR && (
        <div className="mt-4 mb-4 flex flex-col bg-slate-900/60 rounded-3xl p-5 border border-emerald-500/20 animate-dropdown">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group/qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-2xl shadow-2xl border-4 border-slate-950 group-hover/qr:scale-105 transition-transform" />
              ) : (
                <div className="w-40 h-40 bg-slate-950/50 rounded-2xl flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                <Settings2 size={12} />
                <span>Export Size (Pixels)</span>
              </div>
              <div className="flex gap-2">
                {QR_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setQrSize(size)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all active:scale-95 ${qrSize === size ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-emerald-500/30'}`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                <Check size={12} />
                <span>Error Correction</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ERROR_LEVELS.map(level => (
                  <button
                    key={level.key}
                    onClick={() => setQrErrorLevel(level.key)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all active:scale-95 ${qrErrorLevel === level.key ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-emerald-500/30'}`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-30"
            >
              <Download size={14} strokeWidth={3} />
              Save QR Code
            </button>
            <button
              onClick={() => setShowQR(false)}
              className="px-5 bg-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors border border-slate-700 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {link.summary && (
        <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-slate-700/30 group-hover:border-slate-700/60 transition-colors">
          <p className="text-slate-400 text-xs leading-relaxed italic">"{link.summary}"</p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1">
        <div className="flex items-center gap-1.5 group-hover:text-slate-400 transition-colors">
          <Clock size={12} />
          <span>{formatDate(link.createdAt)}</span>
        </div>
        <a 
          href={link.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-all hover:translate-x-0.5 active:scale-95"
        >
          <span>VISIT ORIGINAL</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default HistoryItem;
