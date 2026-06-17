import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Phone, Loader2, RotateCw } from 'lucide-react';
import { THEATERS } from './Theaters';

interface Session {
  id: number;
  cinema_id: number;
  hall_id: number;
  movie_id: number;
  m_id: number;
  movie: string;
  poster: string;
  date: string;
  time: string;
  price: string;
  hall: string;
}

interface GroupedMovie {
  m_id: number;
  name: string;
  poster: string;
  sessions: Session[];
}

const getDates = () => {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDateForAPI = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
};

const formatDateDisplay = (date: Date) => {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const TheaterSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theater = THEATERS.find(t => t.id === id);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // WebView / Iframe State
  const [activeBookingSession, setActiveBookingSession] = useState<Session | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`/api/theaters/${id}/schedule`)
      .then(res => res.json())
      .then(data => {
        setSessions(data.list || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (!theater) return <div className="p-10 text-center text-textMain">Кинотеатр не найден</div>;

  const dates = getDates();
  const activeDateStr = formatDateForAPI(dates[selectedDateIndex]);
  const activeSessions = sessions.filter(s => s.date === activeDateStr);

  // Group sessions by movie
  const groupedMovies: GroupedMovie[] = [];
  activeSessions.forEach(session => {
    let existing = groupedMovies.find(m => m.m_id === session.m_id);
    if (!existing) {
      existing = {
        m_id: session.m_id,
        name: session.movie,
        poster: session.poster,
        sessions: []
      };
      groupedMovies.push(existing);
    }
    existing.sessions.push(session);
  });

  // Sort sessions by time
  groupedMovies.forEach(m => {
    m.sessions.sort((a, b) => a.time.localeCompare(b.time));
  });

  // Construct official booking URL based on theater and session
  const getBookingUrl = (session: Session) => {
    if (theater.id === 'cosmopark' || theater.id === 'alatoo' || theater.id === 'dordoi') {
      return `https://cinematica.kg/pay?cinema=${session.cinema_id}&hall=${session.hall_id}&movie=${session.m_id}&repertory=${session.id}`;
    } else if (theater.id === 'tsum') {
      return 'https://tsumcinema.kg/';
    } else {
      return 'https://ticket.kg/cinema';
    }
  };

  const handleReloadIframe = () => {
    setIframeKey(prev => prev + 1);
    setIframeLoading(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-textMain">
      {/* Header Image */}
      <div className="relative h-[250px] w-full">
        <img src={theater.image} alt={theater.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-10 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Theater Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-4xl font-black text-white mb-2">{theater.name}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80 text-sm font-medium">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-primary"/> {theater.address}</span>
            <span className="flex items-center gap-1"><Phone size={14} className="text-primary"/> +996 (312) 69-99-99</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Date Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {dates.map((date, i) => {
            const isSelected = i === selectedDateIndex;
            const label = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : 'Послезавтра';
            return (
              <button
                key={i}
                onClick={() => setSelectedDateIndex(i)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  isSelected 
                    ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(229,57,53,0.3)]' 
                    : 'bg-white/5 text-textMuted border-white/5 hover:bg-white/10'
                }`}
              >
                {label}, {formatDateDisplay(date)}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 gap-3">
            <Loader2 className="animate-spin text-primary" size={36} />
            <p className="text-sm text-textMuted">Загрузка расписания...</p>
          </div>
        ) : groupedMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center bg-white/5 border border-white/5 rounded-3xl p-6">
            <p className="text-textMuted font-medium mb-1">Нет сеансов</p>
            <p className="text-xs text-textMuted/70">На выбранный день сеансов в этом кинотеатре не найдено.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMovies.map((movie: GroupedMovie, idx: number) => {
              const posterUrl = movie.poster.startsWith('http') 
                ? movie.poster 
                : `https://cinematica.kg${movie.poster}`;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={movie.m_id} 
                  className="flex gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl backdrop-blur-md"
                >
                  {/* Poster */}
                  <div className="w-[100px] shrink-0">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-white/10">
                      <img src={posterUrl} alt={movie.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-lg font-bold text-textMain leading-tight mb-1">{movie.name}</h3>
                      <p className="text-xs text-textMuted mb-4">Жанры, Семейный • 2D / 3D / IMAX</p>
                    </div>
                    
                    {/* Sessions grid */}
                    <div>
                      <p className="text-[10px] text-textMuted uppercase tracking-wider mb-2 font-bold">Выберите время для покупки:</p>
                      <div className="flex flex-wrap gap-2">
                        {movie.sessions.map((session: Session) => (
                          <button 
                            key={session.id}
                            onClick={() => {
                              setActiveBookingSession(session);
                              setIframeLoading(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 text-textMain hover:text-primary font-bold text-xs transition-all active:scale-95 flex flex-col items-center gap-0.5 min-w-[70px]"
                          >
                            <span className="text-sm font-black">{session.time}</span>
                            <span className="text-[9px] opacity-75 font-medium">{session.price} с.</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen In-App Webview Modal */}
      <AnimatePresence>
        {activeBookingSession && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Native Styled Top Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 bg-background/90 backdrop-blur-md z-10">
              <button 
                onClick={() => {
                  setActiveBookingSession(null);
                  setIframeLoading(true);
                }} 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-textMain active:scale-95 transition-transform"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="text-center flex-1 mx-4">
                <h3 className="text-sm font-black text-textMain line-clamp-1">{activeBookingSession.movie}</h3>
                <p className="text-xs text-textMuted font-semibold">
                  {theater.name} • {activeBookingSession.hall} • {activeBookingSession.time}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={handleReloadIframe}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-textMain active:scale-95 transition-transform"
                  title="Обновить страницу"
                >
                  <RotateCw size={18} />
                </button>
              </div>
            </div>

            {/* Content Area containing Iframe */}
            <div className="flex-1 relative bg-black">
              {/* Iframe Loading Overlay */}
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-background z-20 gap-3">
                  <Loader2 className="animate-spin text-primary" size={40} />
                  <p className="text-sm font-bold text-textMain">Загрузка схемы залов и оплаты...</p>
                  <p className="text-xs text-textMuted">Безопасное соединение с {theater.name}</p>
                </div>
              )}

              {/* Iframe */}
              <iframe
                key={iframeKey}
                src={getBookingUrl(activeBookingSession)}
                title="Покупка билетов"
                className="w-full h-full border-none"
                onLoad={() => setIframeLoading(false)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
