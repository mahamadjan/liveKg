import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Phone, Calendar, Clock, MapPin, Star, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  fee: number;
  clinic: Clinic;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  doctor: Doctor;
}

export const Health = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'appointments'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    // Call /api/clinics first to ensure seed runs if empty
    fetch('/api/clinics')
      .then(() => fetchDoctors())
      .then(() => fetchAppointments())
      .finally(() => setLoading(false));
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/appointments/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    if (!date || !time || !bookingDoctor) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ doctorId: bookingDoctor.id, date, time })
      });
      if (res.ok) {
        alert('Успешно записано!');
        setBookingDoctor(null);
        fetchAppointments();
        setActiveTab('appointments');
      }
    } catch (err) {
      alert('Ошибка при записи');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-textMain">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-textMain">Медицина</h1>
      </div>

      {/* SOS Button */}
      <div className="mb-6">
        <a href="tel:103">
          <GlassCard hoverEffect className="!p-4 bg-red-500/20 border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-red-500 text-lg">Экстренный вызов</h3>
                  <p className="text-sm text-red-400/80">Вызвать скорую помощь (103)</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-6 border border-white/10">
        <button 
          onClick={() => setActiveTab('doctors')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'doctors' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted'}`}
        >
          Врачи и Клиники
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted'}`}
        >
          Мои записи
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-textMuted">Загрузка...</div>
      ) : (
        <>
          {activeTab === 'doctors' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="relative mb-6">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
                <input 
                  type="text" 
                  placeholder="Поиск врача или специальности..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-textMain focus:border-primary/50 outline-none"
                />
              </div>

              {doctors.map(doctor => (
                <GlassCard key={doctor.id} className="!p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <UserIcon size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-textMain">{doctor.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <Star size={12} className="fill-yellow-500" />
                          {doctor.rating}
                        </div>
                      </div>
                      <p className="text-primary text-sm font-medium mb-1">{doctor.specialty} • Стаж {doctor.experience} лет</p>
                      <div className="flex items-center gap-1 text-textMuted text-xs mb-3">
                        <MapPin size={12} />
                        {doctor.clinic.name} ({doctor.clinic.address})
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-textMain">{doctor.fee} KGS</span>
                        <button 
                          onClick={() => setBookingDoctor(doctor)}
                          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-xl text-sm transition-colors"
                        >
                          Записаться
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-10 text-textMuted">У вас нет активных записей.</div>
              ) : (
                appointments.map(app => (
                  <GlassCard key={app.id} className="!p-4 border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-textMain">{app.doctor.name}</h3>
                        <p className="text-textMuted text-sm">{app.doctor.specialty}</p>
                      </div>
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-textMuted uppercase">
                        {app.status === 'pending' ? 'Ожидание' : app.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-textMain bg-white/5 px-3 py-2 rounded-lg flex-1">
                        <Calendar size={16} className="text-primary" />
                        {app.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-textMain bg-white/5 px-3 py-2 rounded-lg flex-1">
                        <Clock size={16} className="text-primary" />
                        {app.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textMuted mt-3">
                      <MapPin size={16} />
                      {app.doctor.clinic.name}, {app.doctor.clinic.address}
                    </div>
                  </GlassCard>
                ))
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBookingDoctor(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-textMain mb-4">Запись на прием</h2>
              <p className="text-textMuted text-sm mb-6">Врач: <strong className="text-textMain">{bookingDoctor.name}</strong></p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-textMuted mb-2">Выберите дату</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-textMain" />
                </div>
                <div>
                  <label className="block text-sm text-textMuted mb-2">Выберите время</label>
                  <select value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-textMain">
                    <option value="" className="text-black">Выберите время</option>
                    <option value="09:00" className="text-black">09:00</option>
                    <option value="10:30" className="text-black">10:30</option>
                    <option value="12:00" className="text-black">12:00</option>
                    <option value="14:00" className="text-black">14:00</option>
                    <option value="15:30" className="text-black">15:30</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setBookingDoctor(null)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-textMain">Отмена</button>
                <button onClick={handleBook} disabled={!date || !time} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white disabled:opacity-50">Подтвердить</button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};
