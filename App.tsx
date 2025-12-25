
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
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Check,
  LogOut
} from 'lucide-react';
import { ShortenedLink, SmartSuggestion, LinkProvider } from './types';
import { analyzeUrl } from './services/geminiService';
import { authService, linksService, supabase } from './services/supabaseClient';
import HistoryItem from './components/HistoryItem';
import Auth from './components/Auth';

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
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time URL Validation logic
  const urlValidation = useMemo(() => {
    if (!url) return { isValid: false, status: 'idle', message: '' };

    try {
      const parsedUrl = new URL(url);
      const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
      if (!hasProtocol) {
        return { isValid: false, status: 'invalid', message: 'Missing http:// or https://' };
      }
      return { isValid: true, status: 'valid', message: 'URL looks good!' };
    } catch (e) {
      return { isValid: false, status: 'invalid', message: 'Enter a complete web address' };
    }
  }, [url]);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const currentSession = await authService.getCurrentSession();
      setSession(currentSession);
      setIsLoadingAuth(false);
    };

    checkAuth();

    const { data: authListener } = authService.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadLinksFromCloud(newSession.user.id);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Load links from cloud when session exists
  const loadLinksFromCloud = async (userId: string) => {
    try {
      setIsLoadingLinks(true);
      const links = await linksService.getLinks(userId);
      const formattedLinks = links.map((link: any) => ({
        ...link,
        createdAt: new Date(link.created_at).getTime()
      }));
      setHistory(formattedLinks);
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  // Load logo on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('shorten_custom_logo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomLogo(base64String);
        localStorage.setItem('shorten_custom_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    setCustomLogo(null);
    localStorage.removeItem('shorten_custom_logo');
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError('');
    setSuggestions([]);
    setSummary('');
  };

  const triggerAnalysis = async () => {
    if (!urlValidation.isValid) return;
    
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
    if (!urlValidation.isValid || !session) return;
    setIsShortening(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalAlias = customAlias || Math.random().toString(36).substring(2, 7);

    try {
      const dbLink = await linksService.createLink({
        user_id: session.user.id,
        original_url: url,
        short_url: `https://${provider}/${finalAlias}`,
        alias: finalAlias,
        summary: summary,
        provider: provider
      });

      const newLink: ShortenedLink = {
        id: dbLink.id,
        originalUrl: dbLink.original_url,
        shortUrl: dbLink.short_url,
        alias: dbLink.alias,
        summary: dbLink.summary,
        provider: dbLink.provider,
        createdAt: new Date(dbLink.created_at).getTime(),
      };

      setHistory(prev => [newLink, ...prev]);
      setUrl('');
      setCustomAlias('');
      setSuggestions([]);
      setSummary('');
      setView('history');
    } catch (err) {
      setError('Failed to save link. Please try again.');
      console.error(err);
    } finally {
      setIsShortening(false);
    }
  };

  const deleteLink = useCallback((id: string) => {
    (async () => {
      try {
        await linksService.deleteLink(id);
        setHistory(prev => prev.filter(link => link.id !== id));
      } catch (err) {
        console.error('Failed to delete link:', err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setSession(null);
      setHistory([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-slate-900 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-slate-900 pt-[env(safe-area-inset-top)]">
      {/* System Status Bar */}
      <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
        <div className="flex gap-2">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick} 
              className="flex items-center gap-1 text-emerald-500 animate-pulse active:scale-90 transition-transform"
            >
              <Download size={10} />
              <span>INSTALL</span>
            </button>
          )}
          <Zap size={10} className="text-emerald-500 fill-emerald-500" />
          <Smartphone size={10} />
          <Settings size={10} />
        </div>
      </div>

      {/* App Bar */}
      <header className="px-6 py-5 bg-slate-900/30 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3 group-hover:rotate-6 transition-transform overflow-hidden">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Scissors className="text-slate-950" size={24} strokeWidth={2.5} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-none">Shorten</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Smart Link Hub</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView(view === 'generate' ? 'history' : 'generate')}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-700 active:scale-90 transition-all border border-slate-700/50 shadow-inner"
            >
              {view === 'generate' ? <History size={20} /> : <PlusCircle size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-700 active:scale-90 transition-all border border-slate-700/50 shadow-inner"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable View */}
      <main className="flex-1 overflow-y-auto p-6 android-scroll bg-slate-950">
        {view === 'generate' ? (
          <div className="space-y-7 animate-view-generate">
            
            {/* Personalization Section */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">App Branding</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Customize your workspace</p>
                </div>
              </div>
              <div className="flex gap-2">
                {customLogo && (
                  <button 
                    onClick={resetLogo}
                    className="p-2 bg-slate-800/80 text-slate-500 hover:text-red-400 rounded-lg active:scale-90 transition-all border border-slate-700/50"
                    title="Reset Branding"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 active:scale-95 transition-all border border-emerald-500/20"
                >
                  <Upload size={14} />
                  <span>{customLogo ? 'Change' : 'Upload'}</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
              </div>
            </div>

            {/* Custom Provider Dropdown */}
            <div className="space-y-3" ref={dropdownRef}>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Shortening Service</label>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between bg-slate-900 border rounded-2xl px-5 py-4 text-sm font-semibold transition-all active:scale-[0.98] ${isDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className={`${isDropdownOpen ? 'text-emerald-400 animate-pulse' : 'text-emerald-500'}`} />
                    <span>{provider}</span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-dropdown">
                    <div className="max-h-60 overflow-y-auto android-scroll">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setProvider(p);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-4 text-sm hover:bg-slate-800 transition-colors active:bg-slate-700 ${provider === p ? 'text-emerald-400 bg-slate-800/50 font-bold' : 'text-slate-300'}`}
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

            {/* URL Input with Real-time Validation */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Long URL</label>
              <div className="relative group">
                <input
                  type="url"
                  placeholder="https://example.com/path"
                  value={url}
                  onChange={handleUrlChange}
                  className={`w-full bg-slate-900 border rounded-2xl p-5 pr-14 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-4 transition-all text-sm font-medium ${
                    urlValidation.status === 'valid' ? 'border-emerald-500/50 focus:ring-emerald-500/10 focus:border-emerald-500' :
                    urlValidation.status === 'invalid' ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500' :
                    'border-slate-800 focus:ring-emerald-500/10 focus:border-emerald-500/40'
                  }`}
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {urlValidation.status === 'valid' && (
                    <div className="p-2 text-emerald-500 animate-view-generate">
                      <Check size={18} strokeWidth={3} />
                    </div>
                  )}
                  <button 
                    onClick={triggerAnalysis}
                    disabled={isAnalyzing || !urlValidation.isValid}
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${
                      urlValidation.isValid 
                        ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 active:scale-90' 
                        : 'bg-slate-900/50 text-slate-700 cursor-not-allowed opacity-50'
                    }`}
                    title="Analyze with AI"
                  >
                    <Sparkles size={20} className={isAnalyzing ? "animate-spin" : "group-hover:rotate-12 transition-transform"} />
                  </button>
                </div>
              </div>

              {urlValidation.status === 'invalid' && (
                <div className="flex items-center gap-2 text-rose-400 text-[10px] px-2 font-bold uppercase tracking-wider animate-view-generate">
                  <AlertCircle size={14} />
                  <span>{urlValidation.message}</span>
                </div>
              )}
              
              {error && !urlValidation.message && (
                <div className="flex items-center gap-2 text-red-400 text-xs px-2 animate-view-generate">
                  <AlertCircle size={14} />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* AI Insights Panel */}
            {(isAnalyzing || suggestions.length > 0) && (
              <div className={`bg-emerald-500/[0.03] rounded-3xl p-5 border border-emerald-500/10 space-y-4 shadow-sm transition-all ${!isAnalyzing && suggestions.length > 0 ? 'animate-glow' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Insights</h2>
                  </div>
                </div>

                {isAnalyzing ? (
                  <div className="space-y-3 py-2">
                    <div className="h-3 w-full bg-slate-900/80 animate-pulse rounded-full"></div>
                    <div className="h-3 w-4/5 bg-slate-900/80 animate-pulse rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {summary && (
                      <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 font-medium italic animate-view-generate">
                        "{summary}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCustomAlias(s.alias)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all transform active:scale-90 ${
                            customAlias === s.alias 
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105' 
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
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors shadow-inner focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/40">
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
              disabled={!urlValidation.isValid || isShortening}
              className={`w-full font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 transform active:scale-95 text-sm uppercase tracking-widest ${
                urlValidation.isValid && !isShortening
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]'
                : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
              }`}
            >
              {isShortening ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Create Magic Link</span>
                  <ArrowRight size={18} strokeWidth={3} className={urlValidation.isValid ? "group-hover:translate-x-1 transition-transform" : ""} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-view-history">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white">Your History</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Cloud synced</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
                <span className="text-xs font-black text-emerald-500">{history.length}</span>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-10 animate-view-generate">
                <div className="w-20 h-20 bg-slate-900/50 rounded-full mb-6 flex items-center justify-center text-slate-700 border-2 border-dashed border-slate-800 hover:border-emerald-500/30 transition-colors">
                  <History size={40} className="hover:rotate-[-45deg] transition-transform" />
                </div>
                <h3 className="text-lg font-black text-slate-300">Nothing Here Yet</h3>
                <button 
                  onClick={() => setView('generate')}
                  className="mt-8 text-emerald-500 text-xs font-black uppercase tracking-widest active:scale-90 transition-transform"
                >
                  Create First Link
                </button>
              </div>
            ) : (
              <div className="space-y-1 pb-20">
                {history.map((link, idx) => (
                  <div key={link.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-view-generate">
                    <HistoryItem link={link} onDelete={deleteLink} />
                  </div>
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
          className="absolute bottom-28 right-6 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-slate-950 transform hover:scale-110 active:scale-90 transition-all z-30 ring-4 ring-slate-950"
        >
          <PlusCircle size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Tab Bar */}
      <footer className="bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800/50 px-12 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-between items-center z-20">
        <button 
          onClick={() => setView('generate')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'generate' ? 'text-emerald-500 scale-110' : 'text-slate-600'}`}
        >
          <div className={`p-1 rounded-lg ${view === 'generate' ? 'bg-emerald-500/10' : ''}`}>
            <PlusCircle size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">CREATE</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'history' ? 'text-emerald-500 scale-110' : 'text-slate-600'}`}
        >
          <div className={`p-1 rounded-lg ${view === 'history' ? 'bg-emerald-500/10' : ''}`}>
            <History size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">HISTORY</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
