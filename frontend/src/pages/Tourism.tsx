import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, DollarSign, Filter, Search, Star, Mountain, Users, Compass, Bot, X, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  difficulty: string;
  location: string;
  images: string;
  author: {
    name: string;
    avatar: string | null;
  };
}

interface Guide {
  id: string;
  languages: string;
  experience: number;
  rating: number;
  user: {
    name: string;
    avatar: string | null;
    phone: string | null;
  };
}

export const Tourism = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tours' | 'guides' | 'places'>('tours');
  const [searchQuery, setSearchQuery] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [toursRes, guidesRes] = await Promise.all([
        fetch('/api/tours'),
        fetch('/api/guides')
      ]);
      const toursData = await toursRes.json();
      const guidesData = await guidesRes.json();
      setTours(toursData);
      setGuides(guidesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTours = tours.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-b-[40px] shadow-lg">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1540304603-5178dc9c054e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
          alt="Кыргызстан" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 pb-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">Открой для себя</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">Кыргызстан</h1>
            <p className="text-white/90 text-sm md:text-base font-medium max-w-md drop-shadow-md">
              Горы, кристальные озера и нетронутая природа. Найдите свой идеальный тур или гида.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-6 relative z-30">
        <div className="bg-surface rounded-2xl p-1.5 flex gap-1 shadow-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('tours')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'tours' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:bg-white/5'}`}
          >
            <Compass size={18} /> Туры
          </button>
          <button 
            onClick={() => setActiveTab('guides')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'guides' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:bg-white/5'}`}
          >
            <Users size={18} /> Гиды
          </button>
          <button 
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'places' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:bg-white/5'}`}
          >
            <MapPin size={18} /> Места
          </button>
        </div>
      </div>

      <div className="p-4 mt-4">
        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder={activeTab === 'tours' ? 'Поиск туров (например, Ала-Куль)...' : 'Поиск...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface py-3 pl-10 pr-4 rounded-xl border border-white/10 text-textMain focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="bg-surface p-3 rounded-xl border border-white/10 text-textMain hover:bg-white/5 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-textMuted flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                Загрузка туров...
              </div>
            ) : filteredTours.length > 0 ? (
              filteredTours.map((tour) => {
                let images: string[] = [];
                try {
                  images = typeof tour.images === 'string' ? JSON.parse(tour.images || '[]') : (tour.images || []);
                } catch (e) {
                  console.error('Failed to parse tour images', e);
                }
                const mainImage = images[0] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg';
                
                return (
                  <motion.div 
                    key={tour.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl overflow-hidden shadow-lg border border-white/5"
                  >
                    <div className="h-48 w-full relative">
                      <img 
                        src={mainImage} 
                        alt={tour.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-bold">5.0</span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-bold shadow-lg">
                        {tour.price} KGS
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-textMuted text-xs font-medium mb-2 uppercase tracking-wide">
                        <MapPin size={14} className="text-primary" /> {tour.location}
                      </div>
                      <h3 className="text-lg font-bold text-textMain mb-2 leading-tight">{tour.title}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="bg-white/5 px-2.5 py-1 rounded-lg text-xs text-textMuted flex items-center gap-1.5">
                          <Clock size={14} /> {tour.duration} дней
                        </div>
                        <div className="bg-white/5 px-2.5 py-1 rounded-lg text-xs text-textMuted flex items-center gap-1.5">
                          <Mountain size={14} /> {tour.difficulty}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {tour.author?.avatar ? (
                              <img 
                                src={tour.author.avatar} 
                                alt={tour.author.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Users size={16} className="text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-textMuted">Организатор</p>
                            <p className="text-sm font-semibold text-textMain">{tour.author?.name || 'LifeKg Tours'}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedTour(tour)} className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                          Детали
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-10 text-textMuted bg-surface rounded-2xl border border-white/5">
                <Mountain size={48} className="mx-auto mb-4 opacity-20" />
                <p>Туры не найдены</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guides' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-textMuted flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                Загрузка гидов...
              </div>
            ) : guides.length > 0 ? (
              guides.map((guide) => {
                let languages: string[] = [];
                try {
                  languages = typeof guide.languages === 'string' ? JSON.parse(guide.languages || '[]') : (guide.languages || []);
                } catch (e) {
                  console.error('Failed to parse guide languages', e);
                }
                
                return (
                  <motion.div 
                    key={guide.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl p-4 shadow-lg border border-white/5 flex gap-4 items-start"
                  >
                    <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-white/5">
                      {guide.user?.avatar ? (
                        <img 
                          src={guide.user.avatar} 
                          alt={guide.user.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10">
                          <Users size={32} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-textMain text-lg">{guide.user?.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded text-yellow-500 font-bold text-xs">
                          <Star size={12} className="fill-yellow-500" />
                          {guide.rating.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-textMuted mb-2">Опыт: {guide.experience} лет</div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {languages.map((lang: string, i: number) => (
                          <span key={i} className="bg-white/10 text-textMain text-[10px] px-2 py-0.5 rounded uppercase font-semibold">
                            {lang}
                          </span>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          if (guide.user?.phone) {
                            window.open(`https://wa.me/${guide.user.phone.replace(/[^0-9]/g, '')}`, '_blank');
                          }
                        }}
                        className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Phone size={14} /> Связаться в WhatsApp
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 text-textMuted bg-surface rounded-2xl border border-white/5">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-textMain mb-2">Каталог Гидов</h3>
                <p className="text-sm px-6">Здесь пока нет гидов.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'places' && (
          <div className="text-center py-20 text-textMuted bg-surface rounded-2xl border border-white/5">
            <MapPin size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-textMain mb-2">Интересные места</h3>
            <p className="text-sm px-6">Интерактивная туристическая карта Кыргызстана находится в разработке.</p>
          </div>
        )}
      </div>

      {/* Floating AI Button */}
      <button 
        onClick={() => navigate('/ai')}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/30 text-white flex items-center gap-3 active:scale-95 transition-transform z-40 border border-white/20"
      >
        <Bot size={24} />
        <div className="text-left hidden sm:block">
          <div className="text-xs font-medium text-white/80">Не знаете куда поехать?</div>
          <div className="text-sm font-bold">Спросить ИИ-гида</div>
        </div>
      </button>

      {/* Tour Details Modal */}
      <AnimatePresence>
        {selectedTour && (
          <motion.div 
            key="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedTour(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
        )}
        {selectedTour && (
          <motion.div
            key="modal-content"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto bg-surface z-[101] rounded-t-[32px] shadow-2xl border-t border-white/10"
          >
            <div className="p-2 flex justify-center sticky top-0 bg-surface/80 backdrop-blur-md z-10">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="relative h-64 w-full">
              <img 
                src={(function(){
                  try {
                    const parsed = typeof selectedTour.images === 'string' ? JSON.parse(selectedTour.images || '[]') : (selectedTour.images || []);
                    return parsed[0] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg';
                  } catch(e) {
                    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg';
                  }
                })()} 
                alt={selectedTour.title} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg';
                }}
              />
              <button 
                onClick={() => setSelectedTour(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-wider text-xs">
                <MapPin size={16} /> {selectedTour.location}
              </div>
              <h2 className="text-2xl font-black text-textMain mb-4">{selectedTour.title}</h2>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <DollarSign size={24} className="mx-auto text-green-400 mb-1" />
                  <div className="font-bold text-textMain">{selectedTour.price} KGS</div>
                  <div className="text-xs text-textMuted">Стоимость</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <Clock size={24} className="mx-auto text-blue-400 mb-1" />
                  <div className="font-bold text-textMain">{selectedTour.duration} дней</div>
                  <div className="text-xs text-textMuted">Длительность</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <Mountain size={24} className="mx-auto text-purple-400 mb-1" />
                  <div className="font-bold text-textMain">{selectedTour.difficulty}</div>
                  <div className="text-xs text-textMuted">Сложность</div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-textMain mb-3">Описание маршрута</h3>
                <p className="text-textMuted text-sm leading-relaxed whitespace-pre-line">{selectedTour.description}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
                <h3 className="text-sm font-bold text-textMain mb-3">Организатор тура</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                    {selectedTour.author?.avatar ? (
                      <img 
                        src={selectedTour.author.avatar} 
                        alt={selectedTour.author.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary"><Users size={20} /></div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-textMain">{selectedTour.author?.name || 'LifeKg Tours'}</div>
                    <div className="text-xs text-textMuted flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" /> 4.9 рейтинг
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  window.open(`https://ticket.kg/event/${selectedTour.id}`, '_blank');
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
              >
                <Phone size={20} /> Купить билет на Ticket.kg
              </button>
              <div className="pb-safe"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
