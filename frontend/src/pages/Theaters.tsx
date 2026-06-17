import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export const THEATERS = [
  { id: 'cosmopark', name: 'Cosmopark IMAX', address: '8 мкр, 4/1', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/3', rating: 4.8 },
  { id: 'alatoo', name: 'Ала-Тоо', address: 'пр. Чуй, 187', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/1', rating: 4.7 },
  { id: 'dordoi', name: 'Dordoi Plaza', address: 'ул. Ибраимова, 115', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop', url: 'https://cinematica.kg/cinemas/6', rating: 4.9 },
  { id: 'tsum', name: 'ЦУМ (Кыргыз Киносу)', address: 'пр. Чуй, 155', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop', url: 'https://kino.kg/cinema/22', rating: 4.5 },
  { id: 'russia', name: 'Россия', address: 'пр. Чуй, 213', image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop', url: 'https://kino.kg/cinema/3', rating: 4.4 },
];

export const Theaters = () => {
  return (
    <div className="min-h-screen pt-16 pb-24 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-textMain">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-textMain">Кинотеатры Бишкека</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {THEATERS.map((theater, idx) => (
          <motion.div 
            key={theater.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={`/theaters/${theater.id}`}
              className="relative block w-full h-[180px] rounded-3xl overflow-hidden shadow-lg border border-white/10 group cursor-pointer"
            >
              <img 
                src={theater.image} 
                alt={theater.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                <span className="text-yellow-500 font-bold text-sm">★</span>
                <span className="text-white text-sm font-bold">{theater.rating}</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-2xl font-black text-white leading-tight mb-1">{theater.name}</h3>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-white/80 font-medium flex items-center gap-1">
                    <MapPin size={14} className="text-primary" />
                    {theater.address}
                  </p>
                  <p className="text-sm text-white/80 font-medium flex items-center gap-1">
                    <Film size={14} className="text-primary" />
                    Расписание
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
