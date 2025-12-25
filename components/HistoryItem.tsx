
import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Trash2, Clock, QrCode, X, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import { ShortenedLink } from '../types';
import QRCode from 'qrcode';

interface HistoryItemProps {
  link: ShortenedLink;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ link, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'checking' | 'valid' | 'broken'>('checking');

  useEffect(() => {
    let mounted = true;
    const validateLink = async () => {
      try {
        await fetch(link.originalUrl, { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        });
        if (mounted) setValidationStatus('valid');
      } catch (e) {
        if (mounted) setValidationStatus('broken');
      }
    };

    validateLink();
    return () => { mounted = false; };
  }, [link.originalUrl]);

  useEffect(() => {
    if (showQR) {
      setQrDataUrl(''); 
      QRCode.toDataURL(link.shortUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#10b981', light: '#ffffff' },
      }).then(setQrDataUrl);
    }
  }, [showQR, link.shortUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateTime = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border rounded-2xl p-4 mb-4 transition-all group relative bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
              {link.provider}
            </span>

            {validationStatus === 'checking' && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 animate-pulse">
                <Search size={10} /> Validating...
              </span>
            )}
            {validationStatus === 'valid' && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck size={10} /> Live Link
              </span>
            )}
            {validationStatus === 'broken' && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/20">
                <AlertTriangle size={10} /> Unreachable
              </span>
            )}
          </div>
          <h3 className="font-bold truncate text-lg transition-all text-white">
            {link.provider}/{link.alias}
          </h3>
          <p className="text-xs truncate mt-1 font-medium text-slate-500">
            {link.originalUrl}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowQR(!showQR)} 
            data-tooltip={showQR ? 'Hide QR' : 'Show QR Code'}
            className={`p-2 rounded-full transition-all ${showQR ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700/50 text-slate-300 hover:text-emerald-400'}`}
          >
            <QrCode size={18} />
          </button>
          <button 
            onClick={handleCopy} 
            data-tooltip={copied ? 'Copied!' : 'Copy Link'}
            className="p-2 bg-slate-700/50 rounded-full text-slate-300 hover:text-emerald-400 transition-all"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
          <button 
            onClick={() => onDelete(link.id)} 
            data-tooltip="Remove from History"
            className="p-2 rounded-full text-slate-400 hover:text-red-400 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {showQR && (
        <div className="mt-4 mb-4 flex flex-col bg-slate-900/60 rounded-3xl p-5 border border-emerald-500/20 animate-dropdown items-center">
          <div className="bg-white p-2 rounded-xl mb-4">
            {qrDataUrl ? <img src={qrDataUrl} className="w-32 h-32" alt="QR" /> : <div className="w-32 h-32 animate-pulse bg-slate-200 rounded-lg" />}
          </div>
          <button onClick={() => setShowQR(false)} className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-slate-300 transition-colors">
            <X size={14} /> Close
          </button>
        </div>
      )}

      {link.summary && (
        <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-3 my-3">
          <p className="text-[11px] leading-relaxed italic text-slate-400">
            "{link.summary}"
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>Created: {formatDateTime(link.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-500/50">
            <ShieldCheck size={12} />
            <span>Permanent Link</span>
          </div>
        </div>
        <a 
          href={link.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          data-tooltip="Visit Destination"
          className="text-emerald-500 font-black flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          OPEN <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default HistoryItem;
