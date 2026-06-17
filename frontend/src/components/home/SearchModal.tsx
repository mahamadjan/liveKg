import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Loader2, FileText, HeartPulse, GraduationCap, 
  MapPin, ShoppingBag, Sparkles, Briefcase, ChevronLeft, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Define Custom Bus Icon since it is not in our imports
const BusIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="3" width="20" height="15" rx="2" ry="2" />
    <path d="M4 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    <path d="M17 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    <path d="M2 13h20" />
    <circle cx="6" cy="9" r="1.5" fill="currentColor" />
    <circle cx="18" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  image?: string;
  htmlContent?: string;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Load news and movies when modal is open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      const token = localStorage.getItem('token') || localStorage.getItem('life_kg_token');
      const newsHeaders: Record<string, string> = {};
      if (token) newsHeaders['Authorization'] = `Bearer ${token}`;

      Promise.all([
        fetch('/api/news', { headers: newsHeaders }).then(res => res.json()),
        fetch('/api/movies').then(res => res.json())
      ])
        .then(([newsData, moviesData]) => {
          setNews(newsData || []);
          setMovies(moviesData || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Services list with rich synonyms tags for smart searching
  const services = [
    { 
      title: t('home.services'), 
      icon: FileText, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10', 
      path: '/tunduk',
      tags: ['түндүк', 'tunduk', 'документы', 'паспорт', 'справка', 'госуслуги', 'пенсия', 'налоги', 'штрафы']
    },
    { 
      title: t('home.medicine'), 
      icon: HeartPulse, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10', 
      path: '/health',
      tags: ['врач', 'больница', 'здоровье', 'медицина', 'поликлиника', 'запись', 'лекарства', 'доктор', 'аптека']
    },
    { 
      title: t('home.education'), 
      icon: GraduationCap, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10', 
      path: '/education',
      tags: ['школа', 'вуз', 'университет', 'учеба', 'образование', 'курсы', 'аттестат', 'диплом', 'детсад']
    },
    { 
      title: t('home.tourism'), 
      icon: MapPin, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-500/10', 
      path: '/tourism',
      tags: ['туры', 'горы', 'гид', 'путешествия', 'озеро', 'иссык-куль', 'туризм', 'trip', 'поход']
    },
    { 
      title: t('home.market'), 
      icon: ShoppingBag, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10', 
      path: '/market',
      tags: ['купить', 'продать', 'объявления', 'вещи', 'товары', 'рынок', 'магазин', 'маркетплейс', 'шопинг']
    },
    { 
      title: t('home.ai'), 
      icon: Sparkles, 
      color: 'text-pink-500', 
      bg: 'bg-pink-500/10', 
      path: '/ai',
      tags: ['чат', 'гпт', 'помощник', 'вопрос', 'ии', 'gpt', 'ai', 'assistant', 'нейросеть', 'gemini']
    },
    { 
      title: 'Работа и Вакансии', 
      icon: Briefcase, 
      color: 'text-teal-500', 
      bg: 'bg-teal-500/10', 
      path: '/jobs',
      tags: ['работа', 'вакансии', 'резюме', 'объявления', 'jobs', 'work', 'офис', 'зарплата', 'работодатель']
    },
    { 
      title: 'Общественный Транспорт', 
      icon: BusIcon, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-500/10', 
      path: '/transport',
      tags: ['транспорт', 'автобус', 'троллейбус', 'маршрутка', 'карта', 'расписание', 'transport', 'bus', 'маршрут']
    }
  ];

  // Quick Suggestion Tags
  const suggestions = ['Түндүк', 'Туры', 'Погода', 'Кино', 'Работа', 'Врач', 'Чат ИИ'];

  // Filtering Logic
  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(query.toLowerCase()) || 
    n.contentSnippet.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMovies = movies.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredServices.length > 0 || filteredNews.length > 0 || filteredMovies.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex flex-col justify-start">
        {/* Glass backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose} 
          className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-3xl mx-auto px-4 pt-16 flex flex-col max-h-screen"
        >
          {/* Header Input Area */}
          <div className="relative flex items-center mb-6">
            <div className="absolute left-4 text-textMuted">
              <Search size={22} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск услуг, новостей и фильмов..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-textMain text-lg placeholder-textMuted focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all shadow-xl"
            />
            {query ? (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-14 text-textMuted hover:text-textMain transition-colors p-2"
              >
                <X size={20} />
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="absolute right-4 bg-white/10 hover:bg-white/20 text-textMain rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Results Area */}
          <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={36} className="animate-spin text-primary" />
              </div>
            ) : !query ? (
              /* Suggestion Tags */
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Популярные запросы</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-textMain text-sm px-4 py-2 rounded-full transition-all"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Fast Access Grid */}
                <div>
                  <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Быстрый запуск</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {services.slice(0, 4).map((service, idx) => (
                      <Link to={service.path} key={idx} onClick={onClose}>
                        <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-center h-28 group">
                          <service.icon size={28} className={`${service.color} mb-2 group-hover:scale-110 transition-transform`} />
                          <span className="text-xs font-semibold text-textMain line-clamp-1">{service.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasResults ? (
              <div className="space-y-8">
                {/* Services Section */}
                {filteredServices.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Услуги</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredServices.map((service, idx) => (
                        <Link to={service.path} key={idx} onClick={onClose}>
                          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 hover:border-primary/20 transition-all group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.bg} shrink-0`}>
                              <service.icon size={22} className={service.color} />
                            </div>
                            <div className="text-left">
                              <h5 className="font-bold text-textMain group-hover:text-primary transition-colors text-sm">{service.title}</h5>
                              <p className="text-xs text-textMuted line-clamp-1">Перейти к сервису</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Movies Section */}
                {filteredMovies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Фильмы</h4>
                    <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
                      {filteredMovies.map((movie: any) => (
                        <Link 
                          to="/movies" 
                          key={movie.id}
                          onClick={onClose}
                          className="shrink-0 w-[110px] text-center group"
                        >
                          <div className="relative w-[110px] h-[155px] rounded-xl overflow-hidden shadow-lg border border-white/10 mb-2">
                            <img 
                              src={`https://cinematica.kg${movie.file_poster_vertical}`} 
                              alt={movie.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          </div>
                          <h5 className="text-[11px] font-bold text-textMain line-clamp-1 group-hover:text-primary transition-colors">
                            {movie.name}
                          </h5>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* News Section */}
                {filteredNews.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">Новости</h4>
                    <div className="flex flex-col gap-3">
                      {filteredNews.map((item, idx) => (
                        <div 
                          key={item.id || idx} 
                          onClick={() => setSelectedNews(item)}
                          className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 cursor-pointer hover:bg-white/10 hover:border-primary/20 transition-all text-left"
                        >
                          {item.image && (
                            <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5">
                              <img src={item.image} alt="news" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-primary font-bold mb-0.5">
                              {new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <h5 className="text-sm font-bold text-textMain line-clamp-2 leading-tight">
                              {item.title}
                            </h5>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No Results state */
              <div className="text-center py-20 text-textMuted">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <h4 className="text-lg font-bold text-textMain mb-1">Ничего не найдено</h4>
                <p className="text-sm px-6">Попробуйте ввести другой запрос, например: «Түндүк», «погода» или «автобус»</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* News Article Modal inside Search (Z-index 2000 to overlay search) */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[2000] bg-background/95 backdrop-blur-3xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-white/10">
              <button 
                onClick={() => setSelectedNews(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-textMain"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-xs font-bold text-textMuted bg-white/10 px-2 py-1 rounded-lg">24.kg</span>
              <a href={selectedNews.link} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-textMain">
                <ExternalLink size={20} />
              </a>
            </div>
            <div className="max-w-2xl mx-auto pb-20">
              {selectedNews.image && (
                <img src={selectedNews.image} alt="Cover" className="w-full max-h-[40vh] object-cover" />
              )}
              <div className="p-4 md:p-8">
                <div className="text-sm text-primary font-bold mb-4">
                  {new Date(selectedNews.pubDate).toLocaleString()}
                </div>
                <h1 className="text-2xl font-bold text-textMain mb-6 leading-tight">
                  {selectedNews.title}
                </h1>
                <div 
                  className="text-textMain text-base leading-relaxed space-y-4 [&>p]:mb-4 [&>img]:rounded-xl [&>img]:w-full [&>img]:my-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-textMuted [&_a]:text-primary"
                  dangerouslySetInnerHTML={{ __html: selectedNews.htmlContent || selectedNews.contentSnippet }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
