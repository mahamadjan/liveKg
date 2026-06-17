import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, User, Loader2, Paperclip, X, Copy, Check, Menu, MessageSquare, Plus, Bot, Palette, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message { id: string; role: 'user' | 'assistant'; text: string; imageUrl?: string; }
interface ChatSession { id: string; title: string; updatedAt: number; messages: Message[]; }

const THEMES = [
  { id: 'light', name: 'Светлый', color: '#e4e4e7', bg: '#f4f4f5', type: 'light', iconColor: '#3f3f46' },
  { id: 'classic', name: 'Тёмный', color: '#18181b', bg: '#09090b', type: 'dark', iconColor: '#ffffff' },
  { id: 'ocean', name: 'Океан', color: '#1e3a8a', bg: 'linear-gradient(to bottom, #0f172a, #1e3a8a)', type: 'dark', iconColor: '#ffffff' },
  { id: 'cyber', name: 'Космос', color: '#4c1d95', bg: 'linear-gradient(to bottom, #170f2a, #4c1d95)', type: 'dark', iconColor: '#ffffff' },
  { id: 'aurora', name: 'Матрица', color: '#065f46', bg: 'linear-gradient(to bottom, #022c22, #065f46)', type: 'dark', iconColor: '#ffffff' }
];

const CopyButton = ({ text, isCode = false, isLight = false }: { text: string, isCode?: boolean, isLight?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  
  if (isCode) {
    return (
      <button onClick={onCopy} className="hover:text-white transition-colors flex items-center gap-1 text-gray-400">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
      </button>
    );
  }
  return (
    <button onClick={onCopy} className={`${isLight ? 'text-gray-500 hover:text-gray-900 border-gray-200' : 'text-white/60 hover:text-white border-white/10'} flex items-center justify-center gap-1.5 text-[12px] mt-2 pt-2 border-t w-full transition-colors active:scale-95`}>
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {copied ? 'Скопировано в буфер' : 'Скопировать ответ'}
    </button>
  );
};

export const AIAssistant = () => {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState('classic');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('lifeKg_ai_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) { console.error(e); }
    }
    const savedTheme = localStorage.getItem('lifeKg_ai_bg_theme');
    if (savedTheme) setTheme(savedTheme);

    const savedCustomBg = localStorage.getItem('lifeKg_ai_customBg');
    if (savedCustomBg) setCustomBgImage(savedCustomBg);
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('lifeKg_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('lifeKg_ai_bg_theme', newTheme);
    setIsThemeMenuOpen(false);
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > 1080 || height > 1920) {
          const ratio = Math.min(1080 / width, 1920 / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        try {
          localStorage.setItem('lifeKg_ai_customBg', dataUrl);
          setCustomBgImage(dataUrl);
          changeTheme('custom');
        } catch(err) {
          alert('Файл слишком большой. Пожалуйста, выберите фото меньшего размера.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewChat = () => { setCurrentSessionId(null); setIsSidebarOpen(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const [prefix, base64] = result.split(',');
      setImageFile({ url: URL.createObjectURL(file), base64, mimeType: prefix.match(/:(.*?);/)?.[1] || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (isLoading) return;
    const text = input.trim();
    if (!text && !imageFile) return;
    
    const currentImg = imageFile;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, imageUrl: currentImg?.url };
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = { id: Date.now().toString(), title: text.slice(0, 30) || 'Новый чат', updatedAt: Date.now(), messages: [userMsg] };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      activeSessionId = newSession.id;
    } else {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMsg] } : s));
    }

    setInput('');
    setImageFile(null);
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const sessionToUse = sessions.find(s => s.id === activeSessionId) || { messages: [] };
      const historyToSend = sessionToUse.messages.map(m => ({ role: m.role, text: m.text }));
      const payload: any = { message: text, history: historyToSend };
      if (currentImg) payload.image = { data: currentImg.base64, mimeType: currentImg.mimeType };

      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка сети');

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: data.text };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          let title = s.title;
          if (title === 'Новый чат' && text === '') title = 'Чат с фото';
          return { ...s, updatedAt: Date.now(), messages: [...s.messages, aiMsg], title };
        }
        return s;
      }));
    } catch (error: any) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'assistant', text: `Ошибка: ${error.message}` }] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[1];
  const isCustomBg = theme === 'custom' && customBgImage;
  const isLight = !isCustomBg && activeTheme.type === 'light';

  const avatarBgColor = isCustomBg ? '#d946ef' : activeTheme.color;
  const iconColor = isCustomBg ? '#ffffff' : activeTheme.iconColor;
  
  // Dynamic CSS classes for light/dark modes
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const mutedTextColor = isLight ? 'text-gray-500' : 'text-white/60';
  const overlayClass = isLight ? 'bg-white/40 backdrop-blur-[6px]' : 'bg-black/40 backdrop-blur-[6px]';
  const headerClass = isLight ? 'bg-white/60 border-gray-300 shadow-sm' : 'bg-black/20 border-white/10 shadow-sm';
  const btnHover = isLight ? 'hover:bg-black/5' : 'hover:bg-white/10';
  const modalClass = isLight ? 'bg-white/95 border-gray-200' : 'bg-[#18181b]/90 border-white/20';
  const sidebarClass = isLight ? 'bg-white/95 border-gray-200' : 'bg-[#09090b]/95 border-white/10';
  
  const userBubble = isLight ? 'bg-white/80 border-gray-200 text-gray-900' : 'bg-white/20 border-white/10 text-white';
  const aiBubble = isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-black/30 border-white/5 text-white';
  const inputContainer = isLight ? 'bg-white/80 border-gray-300' : 'bg-white/10 border-white/20';

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col h-[100dvh] pt-safe overflow-hidden font-sans ${textColor} ${isLight ? 'bg-gray-100' : 'bg-[#09090b]'}`}>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={isCustomBg ? { backgroundImage: `url(${customBgImage})` } : { background: activeTheme.bg }}
      />
      <div className={`absolute inset-0 z-0 ${overlayClass}`} />
      
      {/* Header */}
      <div className={`flex-none h-14 flex items-center justify-between px-2 z-20 relative backdrop-blur-xl border-b ${headerClass}`}>
        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${textColor} ${btnHover}`}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
          <h1 className="text-base font-bold tracking-wide drop-shadow-sm">LifeKg AI</h1>
          <Bot size={18} className="drop-shadow-sm" />
        </div>

        <div className="flex items-center">
          <button onClick={() => setIsThemeMenuOpen(true)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${textColor} ${btnHover} relative`}>
            <Palette size={20} />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${textColor} ${btnHover}`}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      <input type="file" accept="image/*" ref={bgFileInputRef} className="hidden" onChange={handleBgFileChange} />

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {isThemeMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsThemeMenuOpen(false)} className={`absolute inset-0 z-40 backdrop-blur-sm ${isLight ? 'bg-black/20' : 'bg-black/60'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`absolute top-16 right-4 left-4 backdrop-blur-3xl rounded-3xl p-5 z-50 shadow-2xl border ${modalClass}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Palette size={20}/> Оформление чата</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => changeTheme(t.id)} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${theme === t.id ? (isLight ? 'border-primary bg-gray-100' : 'border-primary bg-white/20') : (isLight ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-white/10 bg-black/30 hover:bg-white/10')}`}>
                    <div className={`w-6 h-6 rounded-full shadow-inner border ${isLight ? 'border-gray-300' : 'border-white/20'}`} style={{ background: t.bg }} />
                    <span className="text-sm font-medium">{t.name}</span>
                  </button>
                ))}
              </div>

              <div className={`border-t pt-4 ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <button onClick={() => bgFileInputRef.current?.click()} className={`flex items-center justify-center gap-2 w-full p-3 rounded-2xl border transition-all ${theme === 'custom' ? (isLight ? 'border-primary bg-gray-100' : 'border-primary bg-white/20 text-white') : (isLight ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-white/10 bg-black/30 text-gray-300 hover:text-white hover:bg-white/10')}`}>
                  <ImageIcon size={18} />
                  <span className="font-medium text-sm">Установить своё фото</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className={`absolute inset-0 z-40 ${isLight ? 'bg-black/20' : 'bg-black/60'}`} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`absolute right-0 top-0 bottom-0 w-72 backdrop-blur-3xl z-50 flex flex-col shadow-2xl border-l ${sidebarClass}`}>
              <div className={`p-4 border-b pt-safe ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <button onClick={createNewChat} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: avatarBgColor, color: iconColor }}>
                    <Plus size={20} />
                  </div>
                  <span className="font-semibold">Новый чат</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
                <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${mutedTextColor}`}>История чатов</div>
                {sessions.length === 0 ? (
                  <div className={`px-3 py-4 text-sm ${mutedTextColor}`}>Пока нет истории</div>
                ) : (
                  sessions.map(session => (
                    <button key={session.id} onClick={() => { setCurrentSessionId(session.id); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left mb-1 ${currentSessionId === session.id ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-white/20 text-white') : (isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-300 hover:text-white')}`}>
                      <MessageSquare size={18} className="shrink-0" />
                      <span className="text-sm truncate font-medium">{session.title}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 z-10 relative flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-[32px] mb-6 flex items-center justify-center relative overflow-hidden shadow-2xl transition-all" style={{ backgroundColor: avatarBgColor, color: iconColor, boxShadow: `0 20px 40px -10px ${avatarBgColor}80, inset 0 2px 0 rgba(255,255,255,0.2)` }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
              <Bot size={46} className="drop-shadow-md z-10" />
            </motion.div>
            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold mb-3 text-center tracking-tight drop-shadow-sm">
              LifeKg AI
            </motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`text-lg font-medium text-center drop-shadow-sm ${isLight ? 'text-gray-600' : 'text-white/80'}`}>
              Чем могу помочь?
            </motion.p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-6 hide-scrollbar scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-sm border ${msg.role === 'user' ? (isLight ? 'bg-white border-gray-300' : 'bg-white/20 border-white/20') : (isLight ? 'border-transparent shadow-md' : 'border-transparent shadow-md')}`} style={msg.role === 'assistant' ? { backgroundColor: avatarBgColor, color: iconColor } : undefined}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                    </div>
                    <div className={`max-w-[88%] sm:max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start min-w-[200px]'}`}>
                      <div className={`rounded-3xl px-4 py-3 w-full break-words overflow-hidden backdrop-blur-md shadow-lg border ${msg.role === 'user' ? userBubble : aiBubble}`}>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className={`max-w-full rounded-lg mb-2 object-cover border shadow-sm ${isLight ? 'border-gray-300' : 'border-white/10'}`} style={{ maxHeight: '250px' }} />}
                        {msg.text && msg.role === 'assistant' ? (
                          <div className={`prose prose-sm max-w-none text-[15px] prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent ${isLight ? 'prose-a:text-blue-600 text-gray-900' : 'prose-invert prose-a:text-blue-300 text-white'}`}>
                            <ReactMarkdown
                              components={{
                                code({node, inline, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  if (!inline && match) {
                                    return (
                                      <div className={`relative group rounded-xl overflow-hidden my-3 border shadow-lg ${isLight ? 'border-gray-300 bg-gray-900' : 'border-white/20 bg-black/60'}`}>
                                        <div className={`flex justify-between items-center px-3 py-1.5 text-[11px] border-b ${isLight ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-black/60 text-gray-300 border-white/10'}`}>
                                          <span className="uppercase font-medium">{match[1]}</span>
                                          <CopyButton text={codeString} isCode={true} isLight={false} />
                                        </div>
                                        <div className="overflow-x-auto">
                                          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '13px' }} {...props}>
                                            {codeString}
                                          </SyntaxHighlighter>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return <code className={`${className} px-1.5 py-0.5 rounded text-[13px] font-mono ${isLight ? 'bg-gray-200 text-pink-600' : 'bg-white/20'}`} {...props}>{children}</code>;
                                }
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                            <CopyButton text={msg.text} isLight={isLight} />
                          </div>
                        ) : (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 flex-row">
                  <div className="w-8 h-8 shrink-0 rounded-full shadow-md flex items-center justify-center mt-1" style={{ backgroundColor: avatarBgColor, color: iconColor }}>
                    <Bot size={18} />
                  </div>
                  <div className={`px-4 py-3 flex items-center gap-1.5 h-10 backdrop-blur-md rounded-3xl rounded-tl-sm border ${aiBubble}`}>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-gray-500' : 'bg-white/70'}`} />
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-gray-500' : 'bg-white/70'}`} style={{ animationDelay: '0.15s' }} />
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-gray-500' : 'bg-white/70'}`} style={{ animationDelay: '0.3s' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className={`flex-none p-3 sm:p-4 pb-safe transition-colors z-20 bg-gradient-to-t ${isLight ? 'from-white via-white/80' : 'from-black/80 via-black/40'} to-transparent`}>
          <div className="max-w-3xl mx-auto">
            <div className={`relative flex flex-col rounded-[24px] overflow-hidden transition-all backdrop-blur-2xl border shadow-xl focus-within:ring-2 focus-within:border-transparent ${inputContainer}`} style={{ '--tw-ring-color': `${avatarBgColor}80` } as any}>
              {imageFile && (
                <div className="pt-3 px-4 pb-1">
                  <div className="relative inline-block">
                    <img src={imageFile.url} alt="upload" className={`h-16 w-16 object-cover rounded-xl border shadow-md ${isLight ? 'border-gray-300' : 'border-white/20'}`} />
                    <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center border border-gray-600 hover:bg-gray-700 z-10 shadow-sm"><X size={12} /></button>
                  </div>
                </div>
              )}
              <div className="flex items-end px-2 py-2">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-full transition-colors shrink-0 mb-0.5 ${isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-200' : 'text-white/70 hover:text-white hover:bg-white/10'}`} title="Прикрепить файл">
                  <Paperclip size={20} />
                </button>
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) handleSend(); } }} placeholder={imageFile ? "Добавьте описание..." : "Сообщение..."} className={`w-full bg-transparent px-2 py-3 max-h-[120px] focus:outline-none resize-none hide-scrollbar text-[15px] ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/60'}`} rows={1} />
                <button onClick={handleSend} onMouseDown={(e) => e.preventDefault()} disabled={(!input.trim() && !imageFile) || isLoading} className={`p-2 rounded-full shrink-0 mb-1.5 mr-1 transition-all flex items-center justify-center shadow-md ${(!input.trim() && !imageFile) || isLoading ? `opacity-50 cursor-not-allowed bg-transparent ${isLight ? 'text-gray-400' : 'text-white/50'}` : `hover:opacity-80 active:scale-95 text-white`}`} style={((!input.trim() && !imageFile) || isLoading) ? {} : { backgroundColor: avatarBgColor, color: iconColor, boxShadow: `0 4px 14px ${avatarBgColor}80` }}>
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={(!input.trim() && !imageFile) ? '' : 'ml-0.5'} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
