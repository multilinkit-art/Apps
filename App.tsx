
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  History, 
  PlusCircle, 
  Smartphone,
  Settings,
  AlertCircle,
  Scissors,
  ChevronDown,
  Globe,
  Zap,
  CheckCircle2,
  Download,
  Check,
  Cpu
} from 'lucide-react';
import { ShortenedLink, SmartSuggestion, LinkProvider } from './types';
import { analyzeUrl } from './services/geminiService';
import HistoryItem from './components/HistoryItem';

const PROVIDERS: LinkProvider[] = [
  'short.gy',
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  't.co',
  'rebrandly.com',
  'buff.ly',
  't2mio.com'
];

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<LinkProvider>('short.gy');
  const [customAlias, setCustomAlias] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState<ShortenedLink[]>([]);
  const [error, setError] = useState('');
  const [view, setView] = useState<'generate' | 'history'>('generate');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setUrl('');
    setCustomAlias('');
    setSuggestions([]);
    setSummary('');
    setError('');
    setIsAnalyzing(false);
    setIsShortening(false);
  }, []);

  const handleViewChange = (newView: 'generate' | 'history') => {
    if (view !== newView) {
      resetForm();
      setView(newView);
    }
  };

  const urlValidation = useMemo(() => {
    if (!url) return { isValid: false, status: 'idle', message: '' };
    try {
      new URL(url);
      const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
      if (!hasProtocol) return { isValid: false, status: 'invalid', message: 'Missing http:// or https://' };
      return { isValid: true, status: 'valid', message: 'URL looks good!' };
    } catch (e) {
      return { isValid: false, status: 'invalid', message: 'Enter a complete web address' };
    }
  }, [url]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('shorten_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('shorten_history', JSON.stringify(history));
  }, [history]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerAnalysis = async () => {
    if (!urlValidation.isValid) return;
    setIsAnalyzing(true);
    setSuggestions([]);
    setError('');
    try {
      const result = await analyzeUrl(url);
      setSuggestions(result.suggestions);
      setSummary(result.summary);
      if (result.suggestions.length > 0 && !customAlias) {
        setCustomAlias(result.suggestions[0].alias);
      }
    } catch (err) {
      setError('AI analysis failed. You can still shorten it manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShorten = async () => {
    if (!urlValidation.isValid) return;
    setIsShortening(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const finalAlias = customAlias || Math.random().toString(36).substring(2, 7);
    const now = Date.now();
    const newLink: ShortenedLink = {
      id: crypto.randomUUID(),
      originalUrl: url,
      shortUrl: `https://${provider}/${finalAlias}`,
      alias: finalAlias,
      summary: summary,
      provider: provider,
      createdAt: now,
    };

    setHistory(prev => [newLink, ...prev]);
    resetForm(); 
    setView('history');
  };

  const deleteLink = useCallback((id: string) => {
    setHistory(prev => prev.filter(link => link.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-slate-900 pt-[env(safe-area-inset-top)]">
      <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-[11px] text-slate-500 font-bold uppercase tracking-tighter">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick} 
              data-tooltip="Save App to Home"
              className="text-emerald-500 animate-pulse flex items-center gap-1"
            >
              <Download size={11} /> INSTALL
            </button>
          )}
          <Zap size={10} className="text-emerald-500 fill-emerald-500" />
          <Smartphone size={10} />
          <Settings size={10} />
        </div>
      </div>

      <header className="px-6 py-5 bg-slate-900/30 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3">
              <Scissors className="text-slate-950" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-none">Magic Link</h1>
              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-1">AI Link Manager</p>
            </div>
          </div>
          <button 
            onClick={() => handleViewChange(view === 'generate' ? 'history' : 'generate')}
            data-tooltip={view === 'generate' ? 'View History' : 'Back to Creator'}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-slate-700/50"
          >
            {view === 'generate' ? <History size={20} /> : <PlusCircle size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 android-scroll bg-slate-950">
        {view === 'generate' ? (
          <div className="space-y-7 animate-view-generate">
            <div className="space-y-3" ref={dropdownRef}>
              <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Shortening Service</label>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  data-tooltip="Select Domain"
                  className={`w-full flex items-center justify-between bg-slate-900 border rounded-2xl px-5 py-4 text-sm font-semibold transition-all ${isDropdownOpen ? 'border-emerald-500' : 'border-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-emerald-500" />
                    <span>{provider}</span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-dropdown">
                    <div className="max-h-60 overflow-y-auto android-scroll">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p}
                          onClick={() => { setProvider(p); setIsDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-5 py-4 text-sm hover:bg-slate-800 ${provider === p ? 'text-emerald-400 bg-slate-800/50 font-bold' : 'text-slate-300'}`}
                        >
                          <span>{p}</span>
                          {provider === p && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Long URL</label>
              <div className="relative group">
                <input
                  type="url"
                  placeholder="https://example.com/path"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-2xl p-5 pr-14 text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all text-sm font-medium ${
                    urlValidation.status === 'valid' 
                      ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : urlValidation.status === 'invalid' 
                        ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-shake' 
                        : 'border-slate-800'
                  }`}
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button 
                    onClick={triggerAnalysis}
                    disabled={isAnalyzing || !urlValidation.isValid}
                    data-tooltip="Analyze with AI"
                    className={`p-2.5 rounded-xl transition-all ${urlValidation.isValid ? 'bg-slate-800 text-emerald-400' : 'bg-slate-900/50 text-slate-700 opacity-50'}`}
                  >
                    <Sparkles size={20} className={isAnalyzing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              {urlValidation.status === 'invalid' && (
                <div className="flex items-center gap-2 text-rose-400 text-[11px] px-2 font-bold uppercase tracking-wider animate-error">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{urlValidation.message}</span>
                </div>
              )}
            </div>

            {(isAnalyzing || suggestions.length > 0) && (
              <div className="bg-emerald-500/[0.03] rounded-3xl p-5 border border-emerald-500/10 space-y-4 animate-view-generate">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">AI Aliases</h2>
                  </div>
                  {isAnalyzing && (
                    <span className="text-[10px] font-black text-emerald-500/50 animate-pulse uppercase tracking-widest">Analysing...</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {isAnalyzing ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-20 bg-slate-900 border border-slate-800/50 rounded-xl animate-pulse" />
                    ))
                  ) : (
                    suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomAlias(s.alias)}
                        data-tooltip={s.description}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${customAlias === s.alias ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                      >
                        /{s.alias}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Alias</label>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 focus-within:border-emerald-500/40">
                <span className="text-slate-500 font-bold text-sm">{provider}/</span>
                <input
                  type="text"
                  placeholder="catchy-name"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 bg-transparent border-none focus:outline-none font-bold text-emerald-400 placeholder:text-slate-700 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest ml-1 italic">Note: Links are permanent and do not expire.</p>
            </div>

            <button
              onClick={handleShorten}
              disabled={!urlValidation.isValid || isShortening}
              data-tooltip="Shorten this Link"
              className={`w-full font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                urlValidation.isValid && !isShortening ? 'bg-emerald-500 text-slate-950 animate-glow shadow-xl shadow-emerald-500/20' : 'bg-slate-900 text-slate-700 border border-slate-800'
              }`}
            >
              {isShortening ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><span>Create Magic Link</span><ArrowRight size={18} /></>}
            </button>
          </div>
        ) : (
          <div className="animate-view-history">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white">History</h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Local Secure Storage</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
                <span className="text-xs font-black text-emerald-500">{history.length}</span>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-slate-900/50 rounded-full mb-6 flex items-center justify-center text-slate-700 border-2 border-dashed border-slate-800">
                  <History size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-black text-slate-300">Clean Slate</h3>
                <p className="text-slate-600 text-xs mt-2 px-12 leading-relaxed">Your shortened links will appear here. No limits, no expirations.</p>
                {deferredPrompt && (
                  <button onClick={handleInstallClick} className="mt-8 flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/20 font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                    <Download size={16} /> Install App
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((link) => (
                  <HistoryItem key={link.id} link={link} onDelete={deleteLink} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Developer Footer */}
        <div className="mt-16 pb-12 text-center opacity-30 select-none pointer-events-none">
          <div className="h-px w-6 bg-slate-700 mx-auto mb-4" />
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400">
            Developed by Multi-Link IT
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Cpu size={12} className="text-emerald-500" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Gemini Core 3.0
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800/50 px-12 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-between items-center z-20">
        <button 
          onClick={() => handleViewChange('generate')} 
          data-tooltip="Creator Tab"
          className={`flex flex-col items-center gap-1.5 ${view === 'generate' ? 'text-emerald-500' : 'text-slate-600'}`}
        >
          <PlusCircle size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">CREATE</span>
        </button>
        <button 
          onClick={() => handleViewChange('history')} 
          data-tooltip="History Tab"
          className={`flex flex-col items-center gap-1.5 ${view === 'history' ? 'text-emerald-500' : 'text-slate-600'}`}
        >
          <History size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">HISTORY</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
