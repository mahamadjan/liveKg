import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Bus, Navigation, Bell } from 'lucide-react';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Bus Icon
const busIcon = new L.DivIcon({
  html: `<div style="background-color: #E53935; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
  className: 'custom-bus-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Real GPS Routes in Bishkek
const ROUTES = [
  {
    id: 42,
    color: '#3B82F6', // Blue route
    path: [
      [42.8755, 74.6200], [42.8760, 74.6100], [42.8762, 74.6000],
      [42.8765, 74.5900], [42.8765, 74.5800], [42.8768, 74.5700],
      [42.8770, 74.5600], [42.8770, 74.5500], [42.8772, 74.5400]
    ] as [number, number][]
  },
  {
    id: 11, // Trolleybus
    color: '#10B981', // Green route
    path: [
      [42.8850, 74.5880], [42.8800, 74.5880], [42.8750, 74.5880],
      [42.8700, 74.5880], [42.8650, 74.5880], [42.8600, 74.5880],
      [42.8550, 74.5880]
    ] as [number, number][]
  }
];

// Helper to interpolate between two points
const interpolate = (p1: [number, number], p2: [number, number], fraction: number): [number, number] => {
  return [
    p1[0] + (p2[0] - p1[0]) * fraction,
    p1[1] + (p2[1] - p1[1]) * fraction
  ];
};

const BISHKEK_CENTER: [number, number] = [42.8746, 74.5880];

const LocationUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

export const Transport = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeRoute, setActiveRoute] = useState<number | null>(null);
  
  // State for simulated bus positions along the paths
  const [busPositions, setBusPositions] = useState<{ id: number; routeId: number; pos: [number, number] }[]>([]);

  // Simulation step
  const [, setProgress] = useState(0);

  useEffect(() => {
    // This effect runs an animation loop moving buses along their path
    let animationFrame: number;
    let currentProgress = 0;
    
    const animate = () => {
      currentProgress += 0.001; // Speed of the bus
      if (currentProgress > 1) currentProgress = 0; // Loop back
      setProgress(currentProgress);
      
      const newPositions = ROUTES.flatMap(route => {
        // Create 2 buses per route going in opposite "phases"
        return [0, 0.5].map((phase, idx) => {
          let p = currentProgress + phase;
          if (p > 1) p -= 1;
          
          const totalSegments = route.path.length - 1;
          const segmentFloat = p * totalSegments;
          const segmentIndex = Math.floor(segmentFloat);
          const segmentFraction = segmentFloat - segmentIndex;
          
          const p1 = route.path[segmentIndex];
          const p2 = route.path[Math.min(segmentIndex + 1, totalSegments)];
          
          return {
            id: Number(`${route.id}${idx}`),
            routeId: route.id,
            pos: interpolate(p1, p2, segmentFraction)
          };
        });
      });
      
      setBusPositions(newPositions);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        new Notification("Уведомления включены!", {
          body: "Теперь мы сможем сообщать вам, когда ваш автобус подъезжает.",
        });
      }
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(null);
        },
        () => {
          setLocationError("Не удалось получить локацию. Проверьте настройки браузера.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const visibleRoutes = activeRoute ? ROUTES.filter(r => r.id === activeRoute) : ROUTES;
  const visibleBuses = activeRoute ? busPositions.filter(b => b.routeId === activeRoute) : busPositions;

  return (
    <div className="relative h-screen w-full">
      <MapContainer 
        center={BISHKEK_CENTER} 
        zoom={14} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {userLocation && (
          <Marker position={userLocation}>
            <Popup><strong>Вы здесь</strong></Popup>
          </Marker>
        )}

        {/* Draw Route Polylines */}
        {visibleRoutes.map(route => (
          <Polyline 
            key={route.id} 
            positions={route.path} 
            color={route.color} 
            weight={5} 
            opacity={0.7} 
          />
        ))}

        {/* Live Bus Markers */}
        {visibleBuses.map(bus => (
          <Marker key={bus.id} position={bus.pos} icon={busIcon}>
            <Popup>
              <div className="text-center font-sans">
                <strong className="text-lg text-primary block">Маршрут #{bus.routeId}</strong>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full mt-1 inline-block">В пути</span>
              </div>
            </Popup>
          </Marker>
        ))}

        <LocationUpdater position={userLocation} />
      </MapContainer>

      {/* Floating UI Overlays */}
      <div className="absolute top-20 left-0 right-0 px-4 z-[400] pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 pointer-events-auto flex justify-between items-center max-w-lg mx-auto border border-gray-100"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-800">Транспорт Онлайн</h2>
            <p className="text-sm text-gray-500">Реалистичная симуляция маршрутов</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={requestNotifications}
              className={`p-3 rounded-full transition-colors ${notificationsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Bell size={20} />
            </button>
            <button 
              onClick={requestLocation}
              className="p-3 bg-primary text-textMain rounded-full hover:bg-primary/90 shadow-md shadow-primary/30"
            >
              <Navigation size={20} />
            </button>
          </div>
        </motion.div>
        
        {locationError && (
          <div className="mt-2 bg-red-100 text-red-700 p-3 rounded-xl text-sm max-w-lg mx-auto text-center border border-red-200 pointer-events-auto">
            {locationError}
          </div>
        )}
      </div>
      
      {/* Search Bus bar at bottom */}
      <div className="absolute bottom-24 left-0 right-0 px-4 z-[400] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md shadow-xl shadow-black/10 rounded-2xl p-2 pointer-events-auto max-w-lg mx-auto flex items-center border border-gray-100">
           <div className="p-3 text-gray-400"><Bus size={20}/></div>
           <select 
             className="w-full bg-transparent border-none outline-none text-gray-800 font-medium"
             value={activeRoute || ''}
             onChange={(e) => setActiveRoute(e.target.value ? Number(e.target.value) : null)}
           >
             <option value="">Все маршруты</option>
             <option value="42">Автобус №42 (Пр. Чуй)</option>
             <option value="11">Троллейбус №11 (Пр. Манаса)</option>
           </select>
           <button 
             onClick={() => setActiveRoute(null)}
             className="bg-gray-900 text-textMain px-6 py-3 rounded-xl font-medium ml-2 whitespace-nowrap"
           >
             Сброс
           </button>
        </div>
      </div>
    </div>
  );
};
