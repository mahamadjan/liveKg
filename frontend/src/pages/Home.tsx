import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, User, FileText, HeartPulse, MapPin, ShoppingBag, 
  Sparkles, GraduationCap, Snowflake, Loader2, Search,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { NotificationsModal } from '../components/home/NotificationsModal';
import { CurrencyModal } from '../components/home/CurrencyModal';
import { SearchModal } from '../components/home/SearchModal';

import { Newspaper, ChevronRight, ChevronLeft, ExternalLink, Film } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  image?: string;
  htmlContent?: string;
}

const SmartWeatherWidget = ({ code, temp, city, loading }: any) => {
  if (loading) return <GlassCard className="h-32 flex-center mb-4"><Loader2 className="animate-spin text-textMuted" size={32} /></GlassCard>;

  let isRain = code >= 50 && code <= 69;
  let isSnow = code >= 70 && code <= 79;
  let isClear = code === 0 || code === 1;
  let isCloudy = !isRain && !isSnow && !isClear;

  let bgGradient = "from-blue-500/20 to-cyan-500/5";
  let border = "border-blue-500/20";
  
  if (isClear) {
    bgGradient = "from-orange-500/20 to-yellow-500/5";
    border = "border-orange-500/20";
  } else if (isRain) {
    bgGradient = "from-indigo-600/20 to-blue-800/10";
    border = "border-indigo-500/20";
  } else if (isSnow) {
    bgGradient = "from-white/20 to-blue-200/5";
    border = "border-white/20";
  }

  return (
    <div className={`relative overflow-hidden rounded-[24px] border ${border} bg-gradient-to-br ${bgGradient} p-4 shadow-xl backdrop-blur-xl group cursor-pointer transition-transform active:scale-[0.98] h-[140px]`}>
      {/* 3D Visuals */}
      <div className="absolute -right-6 -top-4 w-32 h-32 pointer-events-none drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-700">
        {isClear && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-yellow-300 rounded-full shadow-[0_0_30px_rgba(250,219,20,0.8),inset_0_-6px_12px_rgba(239,68,68,0.6)] animate-[pulse_4s_ease-in-out_infinite]" />
          </div>
        )}
        {isCloudy && (
          <div className="absolute inset-0 flex items-center justify-center mt-6">
            <div className="relative drop-shadow-[0_8px_12px_rgba(0,0,0,0.3)] scale-75">
               <div className="absolute -top-4 left-2 w-16 h-16 bg-gradient-to-br from-white to-gray-300 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2)]" />
               <div className="absolute top-2 -left-6 w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2)]" />
               <div className="absolute top-0 left-10 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2)]" />
            </div>
          </div>
        )}
        {isRain && (
          <div className="absolute inset-0 flex items-center justify-center mt-6">
             <div className="relative drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)] scale-75">
               <div className="absolute -top-4 left-2 w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.4)]" />
               <div className="absolute top-2 -left-6 w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.4)]" />
               <div className="absolute top-0 left-10 w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.4)]" />
               {/* Raindrops */}
               <div className="absolute top-16 left-0 w-1.5 h-4 bg-blue-400 rounded-full animate-bounce" />
               <div className="absolute top-14 left-8 w-1.5 h-4 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}/>
               <div className="absolute top-18 left-16 w-1.5 h-4 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}/>
             </div>
          </div>
        )}
        {isSnow && (
          <div className="absolute inset-0 flex items-center justify-center mt-8 text-white drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]">
             <Snowflake size={64} className="animate-[spin_10s_linear_infinite]" />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h3 className="text-4xl font-black text-textMain drop-shadow-md mb-0.5 tracking-tighter">
            {temp !== null ? `${temp > 0 ? '+' : ''}${temp}°` : '--°'}
          </h3>
          <p className="text-textMain/90 font-bold text-xs flex items-center gap-1 drop-shadow-sm truncate max-w-[80px]">
            <MapPin size={12} /> {city}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-textMain/90 uppercase tracking-widest drop-shadow-sm">
            {isClear ? 'Ясно' : isRain ? 'Дождь' : isSnow ? 'Снег' : 'Облачно'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface Theater {
  id: string;
  name: string;
  address: string;
  image: string;
  url: string;
}

const THEATERS: Theater[] = [
  { id: 'cosmopark', name: 'Cosmopark IMAX', address: '8 мкр, 4/1', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/3' },
  { id: 'alatoo', name: 'Ала-Тоо', address: 'пр. Чуй, 187', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/1' },
  { id: 'dordoi', name: 'Dordoi Plaza', address: 'ул. Ибраимова, 115', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/6' },
  { id: 'tsum', name: 'ЦУМ (Кыргыз Киносу)', address: 'пр. Чуй, 155', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop', url: 'https://kino.kg/cinema/22' },
  { id: 'russia', name: 'Россия', address: 'пр. Чуй, 213', image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop', url: 'https://kino.kg/cinema/3' },
];

export const Home = () => {
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [user, setUser] = useState<{ name?: string, avatar?: string } | null>(null);
  
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [city, setCity] = useState<string>(t('home.bishkek'));
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [usdRate, setUsdRate] = useState<{buy: string, sell: string} | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  const location = useLocation();

  // Modals state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Handle query parameter actions (focus search or scroll to news)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focusSearch') === 'true') {
      setIsSearchOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('scrollTo') === 'news') {
      setTimeout(() => {
        const newsSection = document.getElementById('news-section');
        if (newsSection) {
          newsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  useEffect(() => {
    // 1. Fetch User Profile
    const token = localStorage.getItem('token') || localStorage.getItem('life_kg_token');
    if (token) {
      fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.id) setUser(data); })
        .catch(console.error);
    }

    // 2. Fetch News & Movies
    const newsHeaders: Record<string, string> = {};
    if (token) newsHeaders['Authorization'] = `Bearer ${token}`;

    fetch('/api/news', { headers: newsHeaders })
      .then(res => res.json())
      .then(data => setNews(data || []))
      .catch(console.error);

    fetch('/api/movies')
      .then(res => res.json())
      .then(data => setMovies(data || []))
      .catch(console.error);

    // 3. Set Greeting
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting(t('home.goodMorning'));
    else if (hour >= 12 && hour < 18) setGreeting(t('home.goodAfternoon'));
    else if (hour >= 18 && hour < 22) setGreeting(t('home.goodEvening'));
    else setGreeting(t('home.goodNight'));

    // 3. Fetch Real Exchange Rates (from open.er-api.com)
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.KGS) {
          const kgs = data.rates.KGS;
          setUsdRate({
            buy: (kgs * 0.995).toFixed(2),
            sell: (kgs * 1.005).toFixed(2)
          });
        }
      })
      .catch(console.error)
      .finally(() => setRatesLoading(false));

    // 4. Geolocation & Weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherAndCity(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation denied or error, falling back to Bishkek coords", error);
          fetchWeatherAndCity(42.87, 74.59); // Bishkek fallback
        }
      );
    } else {
      fetchWeatherAndCity(42.87, 74.59);
    }

    // 5. Listen to notification updates
    const handleNotifUpdate = (e: any) => {
      setUnreadNotifCount(e.detail.unreadCount || 0);
    };
    window.addEventListener('notifications_updated', handleNotifUpdate);

    return () => {
      window.removeEventListener('notifications_updated', handleNotifUpdate);
    };
  }, [t]);

  const fetchWeatherAndCity = async (lat: number, lon: number) => {
    try {
      // Reverse Geocoding (Nominatim OpenStreetMap)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await geoRes.json();
      const detectedCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || t('home.bishkek');
      setCity(detectedCity);

      // Open-Meteo Weather
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherRes.json();
      setTemp(Math.round(weatherData.current_weather.temperature));
      setWeatherCode(weatherData.current_weather.weathercode);
    } catch (err) {
      console.error(err);
    } finally {
      setWeatherLoading(false);
    }
  };


  const services = [
    { title: t('home.services'), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/tunduk' },
    { title: t('home.medicine'), icon: HeartPulse, color: 'text-green-500', bg: 'bg-green-500/10', path: '/health' },
    { title: t('home.education'), icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/education' },
    { title: t('home.tourism'), icon: MapPin, color: 'text-yellow-500', bg: 'bg-yellow-500/10', path: '/tourism' },
    { title: t('home.market'), icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/market' },
    { title: t('home.ai'), icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-500/10', path: '/ai' },
  ];

  const displayName = user?.name ? user.name.split(' ')[0] : t('profile.user');

  return (
    <div className="min-h-screen pt-6 pb-24 px-4 overflow-x-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/30 transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
          </Link>
          <div>
            <p className="text-textMuted text-sm">{greeting},</p>
            <h2 className="text-textMain font-bold text-xl">{displayName}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-textMain hover:bg-white/10 transition-colors"
          >
            <Search size={24} />
          </button>
          <button 
            onClick={() => setIsNotifOpen(true)} 
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-textMain hover:bg-white/10 transition-colors relative"
          >
            <Bell size={24} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#121212]"></span>
            )}
          </button>
        </div>
      </motion.div>
          {/* Widgets Row (Weather & Currency) */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Smart 3D Weather Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="h-full">
              <SmartWeatherWidget code={weatherCode} temp={temp} city={city} loading={weatherLoading} />
            </motion.div>

            {/* Currency Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="h-full">
              <GlassCard onClick={() => setIsCurrencyOpen(true)} className="!p-4 h-[140px] flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="text-sm font-bold text-textMain">Курс Валют</p>
                     <p className="text-[10px] text-textMuted uppercase tracking-wide">USD / KGS</p>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                     <span className="font-bold text-sm">$</span>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between items-baseline">
                     <span className="text-textMuted text-xs">{t('home.buy')}</span>
                     <span className="text-textMain font-bold">{ratesLoading ? '...' : usdRate?.buy || '--'}</span>
                   </div>
                   <div className="flex justify-between items-baseline mt-1">
                     <span className="text-textMuted text-xs">{t('home.sell')}</span>
                     <span className="text-textMain font-bold">{ratesLoading ? '...' : usdRate?.sell || '--'}</span>
                   </div>
                 </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Tunduk Banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
            <Link to="/tunduk">
              <div className="relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg shadow-blue-500/20 cursor-pointer group active:scale-[0.98] transition-transform">
                {/* Background elements */}
                <div className="absolute -right-4 -top-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck size={180} />
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="text-white" size={24} />
                      <h3 className="text-2xl font-black text-white tracking-wide">Түндүк</h3>
                    </div>
                    <p className="text-blue-100 font-medium text-sm max-w-[200px]">Все ваши документы и гос. услуги в одном месте</p>
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner group-hover:bg-white/30 transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Services Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-xl font-bold text-textMain">{t('home.allServices')}</h3>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {services.map((service, index) => (
                <Link to={service.path} key={index}>
                  <motion.div 
                    whileHover={{ y: -4, scale: 1.02 }} 
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    {/* Clean Frosted Glass Container (VisionOS style) */}
                    <div className="relative w-[68px] h-[68px] rounded-[20px] flex items-center justify-center overflow-hidden shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 group-hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.4)]">
                      
                      {/* Subtle Colored Liquid Glow behind the icon */}
                      <div className={`absolute inset-0 ${service.bg.replace('/10', '/40')} blur-[24px] opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity duration-300`} />
                      
                      {/* Soft top highlight edge */}
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                      {/* Icon */}
                      <service.icon 
                        size={30} 
                        strokeWidth={1.5}
                        className={`relative z-10 ${service.color} drop-shadow-sm`} 
                      />
                    </div>
                    <span className="text-textMuted text-xs font-medium text-center leading-tight transition-colors group-hover:text-textMain">
                      {service.title}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Live News Section */}
          {news.length > 0 && (
            <motion.div id="news-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
                  <Newspaper className="text-primary" size={24} />
                  Свежие новости
                </h3>
                <span className="text-xs font-bold text-textMuted bg-white/10 px-2 py-1 rounded-lg">24.kg</span>
              </div>

              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
                {news.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    onClick={() => setSelectedNews(item)}
                    className="snap-center shrink-0 w-[280px] sm:w-[320px] group cursor-pointer"
                  >
                    <GlassCard className="h-full !p-0 flex flex-col hover:border-primary/30 transition-colors overflow-hidden">
                      {item.image && (
                        <div className="w-full h-32 overflow-hidden bg-white/5">
                          <img src={item.image} alt="news" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="text-xs text-primary font-bold mb-2 flex justify-between items-center">
                          {new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-sm font-bold text-textMain mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        {!item.image && (
                          <p className="text-xs text-textMuted line-clamp-2 mt-auto">
                            {item.contentSnippet}
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Theaters Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
                <Film className="text-primary" size={24} />
                Кинотеатры
              </h3>
              <Link to="/theaters" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                Все
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
              {THEATERS.map((theater) => (
                <Link 
                  to={`/theaters/${theater.id}`}
                  key={theater.id}
                  className="snap-center shrink-0 w-[240px] group cursor-pointer"
                >
                  <div className="relative w-full h-[140px] rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                    <img 
                      src={theater.image} 
                      alt={theater.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-lg font-black text-white leading-tight">{theater.name}</h4>
                      <p className="text-xs text-white/70 font-medium">{theater.address}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Movies / Afisha Section */}
          {movies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-2 mb-8">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-bold text-textMain">
                  Сейчас в прокате
                </h3>
              </div>

              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
                {movies.slice(0, 10).map((movie: any) => (
                  <Link 
                    to="/movies"
                    key={movie.id}
                    className="snap-center shrink-0 w-[140px] group cursor-pointer"
                  >
                    <div className="relative w-[140px] h-[200px] rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-2">
                      <img 
                        src={`https://cinematica.kg${movie.file_poster_vertical}`} 
                        alt={movie.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-white text-xs font-bold bg-primary px-2 py-0.5 rounded-full">{movie.age_restriction}</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-textMain line-clamp-1 group-hover:text-primary transition-colors text-center">
                      {movie.name}
                    </h4>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

      {/* Native Article Modal */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl overflow-y-auto"
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

      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <CurrencyModal isOpen={isCurrencyOpen} onClose={() => setIsCurrencyOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
