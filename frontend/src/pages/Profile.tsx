import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, User as UserIcon, Settings, LogOut, Loader2, Key, Moon, Globe, Camera } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { ProfileSettingsModal } from '../components/profile/ProfileSettingsModal';
import { useTranslation } from 'react-i18next';

export const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'kg' : 'ru';
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    const isNowLight = document.documentElement.classList.toggle('light');
    setIsLight(isNowLight);
    localStorage.theme = isNowLight ? 'light' : 'dark';
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to fetch user:', res.status, text);
        setUser({ name: `Ошибка ${res.status}`, email: text, role: 'ERROR' });
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (err: any) {
      console.error(err);
      setUser({ name: 'Network Error', email: err.message, role: 'ERROR' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, avatar: data.avatarUrl });
      } else {
        alert('Ошибка при загрузке фото');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети при загрузке фото');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('life_kg_token');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 size={40} className="animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  return (
    <div className="pt-24 pb-24 px-4 container mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8">
        <div 
          className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-2xl relative cursor-pointer overflow-hidden group"
          onClick={() => fileInputRef.current?.click()}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={40} className="text-textMuted group-hover:scale-110 transition-transform" />
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? <Loader2 size={24} className="animate-spin text-white" /> : <Camera size={24} className="text-white" />}
          </div>

          {isAdmin && (
            <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-[#121212] z-10">
              <Shield size={14} />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <h1 className="text-3xl font-bold text-textMain">{user.name || 'Пользователь'}</h1>
        <p className="text-textMuted">{user.email || user.phone}</p>
        
        {isAdmin && (
          <span className="mt-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold uppercase tracking-widest">
            {user.role}
          </span>
        )}
      </motion.div>

      <div className="space-y-4">
        {isAdmin && (
          <GlassCard hoverEffect className="!p-4 cursor-pointer" onClick={() => navigate('/admin')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Key size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-textMain text-lg">Панель Управления</h3>
                <p className="text-sm text-textMuted">Управление пользователями и контентом</p>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard hoverEffect className="!p-4 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-textMuted">
              <Settings size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-textMain text-lg">Настройки профиля</h3>
              <p className="text-sm text-textMuted">Изменить пароль, личные данные</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-textMuted" />
              <span className="font-medium text-textMain">Светлая тема</span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isLight ? 'bg-primary' : 'bg-surfaceBorder'}`}
            >
              <motion.div 
                animate={{ x: isLight ? 24 : 0 }} 
                className="w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
          
          <div className="h-px bg-white/5 my-2" />
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-textMuted" />
              <span className="font-medium text-textMain">Кыргызча (KG)</span>
            </div>
            <button 
              onClick={toggleLanguage}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${i18n.language === 'kg' ? 'bg-primary' : 'bg-surfaceBorder'}`}
            >
              <motion.div 
                animate={{ x: i18n.language === 'kg' ? 24 : 0 }} 
                className="w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard hoverEffect className="!p-4 cursor-pointer" onClick={handleLogout}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
              <LogOut size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-500 text-lg">Выйти</h3>
              <p className="text-sm text-red-400/70">Завершить сеанс на этом устройстве</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {user && (
        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          onUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })}
        />
      )}
    </div>
  );
};
