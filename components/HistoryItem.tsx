
import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Trash2, Clock, Link2 } from 'lucide-react';
import { ShortenedLink } from '../types';

interface HistoryItemProps {
  link: ShortenedLink;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ link, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 mb-4 transition-all hover:bg-slate-800 group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {link.provider}
            </span>
          </div>
          <h3 className="font-bold truncate text-lg text-white">
            {link.provider}/{link.alias}
          </h3>
          <p className="text-slate-500 text-xs truncate mt-0.5">
            {link.originalUrl}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-600 transition-colors text-slate-300"
            title="Copy link"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 bg-slate-700/50 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-400"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {link.summary && (
        <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-slate-700/30">
          <p className="text-slate-400 text-xs leading-relaxed italic">"{link.summary}"</p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{formatDate(link.createdAt)}</span>
        </div>
        <a 
          href={link.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          <span>VISIT ORIGINAL</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default HistoryItem;
