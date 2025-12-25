
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  History, 
  PlusCircle, 
  Smartphone,
  Share2,
  Settings,
  AlertCircle,
  Scissors,
  ChevronDown,
  Globe,
  Zap,
  CheckCircle2
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
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('shorten_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shorten_history', JSON.stringify(history));
  }, [history]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError('');
    setSuggestions([]);
    setSummary('');
  };

  const triggerAnalysis = async () => {
    if (!url || !url.startsWith('http')) {
      setError('Please enter a valid URL (starting with http/https)');
      return;
    }
    setIsAnalyzing(true);
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
    if (!url) return;
    setIsShortening(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalAlias = customAlias || Math.random().toString(36).substring(2, 7);
    const newLink: ShortenedLink = {
      id: crypto.randomUUID(),
      originalUrl: url,
      shortUrl: `https://${provider}/${finalAlias}`,
      alias: finalAlias,
      summary: summary,
      provider: provider,
      createdAt: Date.now(),
    };

    setHistory(prev => [newLink, ...prev]);
    setUrl('');
    setCustomAlias('');
    setSuggestions([]);
    setSummary('');
    setIsShortening(false);
    setView('history');
  };

  const deleteLink = useCallback((id: string) => {
    setHistory(prev => prev.filter(link => link.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-slate-900">
      {/* Android Status Bar */}
      <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
        <div className="flex gap-2">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={10} className="text-emerald-500 fill-emerald-500" />
          <Smartphone size={10} />
          <Settings size={10} />
        </div>
      </div>

      {/* App Bar */}
      <header className="px-6 py-5 bg-slate-900/30 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3">
              <Scissors className="text-slate-950" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-none">Shorten</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Smart Link Hub</p>
            </div>
          </div>
          <button 
            onClick={() => setView(view === 'generate' ? 'history' : 'generate')}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-all border border-slate-700/50 shadow-inner"
          >
            {view === 'generate' ? <History size={20} /> : <PlusCircle size={20} />}
          </button>
        </div>
      </header>

      {/* Scrollable View */}
      <main className="flex-1 overflow-y-auto p-6 android-scroll bg-slate-950">
        {view === 'generate' ? (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-500">
            
            {/* Custom Provider Dropdown */}
            <div className="space-y-3" ref={dropdownRef}>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Shortening Service</label>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-semibold hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-emerald-500" />
                    <span>{provider}</span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden dropdown-animate">
                    <div className="max-h-60 overflow-y-auto android-scroll">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setProvider(p);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-4 text-sm hover:bg-slate-800 transition-colors ${provider === p ? 'text-emerald-400 bg-slate-800/50' : 'text-slate-300'}`}
                        >
                          <span>{p}</span>
                          {provider === p && <CheckCircle2 size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Long URL</label>
              <div className="relative group">
                <input
                  type="url"
                  placeholder="https://example.com/very-long-path"
                  value={url}
                  onChange={handleUrlChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 pr-14 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-sm font-medium"
                />
                <button 
                  onClick={triggerAnalysis}
                  disabled={isAnalyzing || !url}
                  className="absolute right-3 top-3 p-2.5 bg-slate-800 rounded-xl text-emerald-400 hover:bg-slate-700 disabled:opacity-30 transition-all shadow-lg"
                  title="Analyze with AI"
                >
                  <Sparkles size={20} className={isAnalyzing ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs px-2 animate-in fade-in slide-in-from-left-2">
                  <AlertCircle size={14} />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* AI Insights Panel */}
            {(isAnalyzing || suggestions.length > 0) && (
              <div className="bg-emerald-500/[0.03] rounded-3xl p-5 border border-emerald-500/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Insights</h2>
                  </div>
                  {isAnalyzing && <div className="text-[10px] text-emerald-500 animate-pulse font-bold">ANALYZING...</div>}
                </div>

                {isAnalyzing ? (
                  <div className="space-y-3 py-2">
                    <div className="h-3 w-full bg-slate-900/80 animate-pulse rounded-full"></div>
                    <div className="h-3 w-4/5 bg-slate-900/80 animate-pulse rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {summary && (
                      <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 font-medium italic">
                        "{summary}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCustomAlias(s.alias)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all transform active:scale-95 ${
                            customAlias === s.alias 
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' 
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-emerald-500/20'
                          }`}
                        >
                          /{s.alias}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Alias Input */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Alias</label>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors shadow-inner">
                <span className="text-slate-500 font-bold text-sm">{provider}/</span>
                <input
                  type="text"
                  placeholder="catchy-name"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 bg-transparent border-none focus:outline-none font-bold text-emerald-400 placeholder:text-slate-700 text-sm"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleShorten}
              disabled={!url || isShortening}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-5 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 text-sm uppercase tracking-widest"
            >
              {isShortening ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Create Magic Link</span>
                  <ArrowRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white">Your History</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Saved from your sessions</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
                <span className="text-xs font-black text-emerald-500">{history.length}</span>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-10">
                <div className="w-20 h-20 bg-slate-900/50 rounded-full mb-6 flex items-center justify-center text-slate-700 border-2 border-dashed border-slate-800">
                  <History size={40} />
                </div>
                <h3 className="text-lg font-black text-slate-300">Nothing Here Yet</h3>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Your shortened links will appear here after you create them.</p>
                <button 
                  onClick={() => setView('generate')}
                  className="mt-8 text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-400"
                >
                  Create Your First Link
                </button>
              </div>
            ) : (
              <div className="space-y-1 pb-20">
                {history.map(link => (
                  <HistoryItem key={link.id} link={link} onDelete={deleteLink} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action for History View */}
      {view === 'history' && history.length > 0 && (
        <button
          onClick={() => setView('generate')}
          className="absolute bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-slate-950 transform hover:scale-105 active:scale-90 transition-all z-30 ring-4 ring-slate-950"
        >
          <PlusCircle size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Android Tab Bar */}
      <footer className="bg-slate-900/60 backdrop-blur-xl border-t border-slate-800/50 py-4 px-12 flex justify-between items-center z-20">
        <button 
          onClick={() => setView('generate')}
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'generate' ? 'text-emerald-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <div className={`p-1 rounded-lg ${view === 'generate' ? 'bg-emerald-500/10' : ''}`}>
            <PlusCircle size={22} strokeWidth={view === 'generate' ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">CREATE</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'history' ? 'text-emerald-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <div className={`p-1 rounded-lg ${view === 'history' ? 'bg-emerald-500/10' : ''}`}>
            <History size={22} strokeWidth={view === 'history' ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">HISTORY</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
