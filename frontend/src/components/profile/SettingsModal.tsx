import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, LogOut, Camera, X, Palette, Globe, Smartphone, Fingerprint, MapPin, Save } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (user: any) => void;
}

export const SettingsModal = ({ isOpen, onClose, user, onUpdate }: SettingsModalProps) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'language'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  
  const [theme, setTheme] = useState(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  const [lang, setLang] = useState(i18n.language || 'ru');

  // Security States
  const [pin, setPin] = useState(localStorage.getItem('life_kg_pin') || '');
  const [biometricsEnabled, setBiometricsEnabled] = useState(localStorage.getItem('life_kg_biometrics') === 'true');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [isOpen, user]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleLangChange = (newLang: 'ru' | 'kg') => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('life_kg_token');
    window.location.reload();
  };

  const handleSetPin = () => {
    const newPin = prompt('Введите новый 4-значный пин-код:');
    if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
      setPin(newPin);
      localStorage.setItem('life_kg_pin', newPin);
    } else {
      alert('Ошибка: Пин-код должен состоять ровно из 4 цифр!');
    }
  };

  const handleRemovePin = () => {
    setPin('');
    localStorage.removeItem('life_kg_pin');
    localStorage.removeItem('life_kg_biometrics');
    setBiometricsEnabled(false);
  };

  const toggleBiometrics = () => {
    if (!pin) {
      alert('Сначала установите пин-код!');
      return;
    }
    const newVal = !biometricsEnabled;
    setBiometricsEnabled(newVal);
    localStorage.setItem('life_kg_biometrics', newVal.toString());
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('life_kg_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        onUpdate(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('life_kg_token');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setAvatar(data.avatarUrl);
        onUpdate(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl z-10"
        >
          <GlassCard className="!p-0 overflow-hidden flex flex-col md:flex-row h-[600px] max-h-[90vh]">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 bg-white/5 border-r border-surfaceBorder p-6 flex flex-col gap-2">
              <h2 className="text-xl font-bold text-textMain mb-6">{t('settings.title')}</h2>
              
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-primary/20 text-primary' : 'text-textMuted hover:bg-white/5'}`}>
                <User size={20} />
                <span className="font-medium">{t('nav.profile')}</span>
              </button>
              <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'security' ? 'bg-primary/20 text-primary' : 'text-textMuted hover:bg-white/5'}`}>
                <Shield size={20} />
                <span className="font-medium">{t('profile.security')}</span>
              </button>
              <button onClick={() => setActiveTab('appearance')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'appearance' ? 'bg-primary/20 text-primary' : 'text-textMuted hover:bg-white/5'}`}>
                <Palette size={20} />
                <span className="font-medium">{t('profile.theme')}</span>
              </button>
              <button onClick={() => setActiveTab('language')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'language' ? 'bg-primary/20 text-primary' : 'text-textMuted hover:bg-white/5'}`}>
                <Globe size={20} />
                <span className="font-medium">{t('profile.language')}</span>
              </button>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">{t('profile.logout')}</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-textMain transition-colors z-10">
                <X size={24} />
              </button>

              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-textMain mb-6">{t('nav.profile')}</h3>
                  
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-4 border-surfaceBorder">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-textMain/50">
                            {name ? name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full backdrop-blur-sm"
                      >
                        <Camera size={32} className="text-textMain" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-textMuted mb-2">{t('profile.name')}</label>
                      <input 
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-textMuted hover:text-textMain transition-colors">{t('profile.cancel')}</button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-6 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? '...' : t('profile.save')}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-textMain mb-6">{t('profile.security')}</h3>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="text-textMain font-bold text-lg">{t('profile.appSecurity')}</h4>
                        <p className="text-textMuted text-sm">{t('profile.passcodeBiometrics')}</p>
                      </div>
                    </div>
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-textMain">{t('profile.passcodeOnLogin')}</span>
                        {pin ? (
                          <button onClick={handleRemovePin} className="text-red-400 text-sm font-medium hover:underline">{t('profile.turnOff')}</button>
                        ) : (
                          <button onClick={handleSetPin} className="text-primary text-sm font-medium hover:underline">{t('profile.setup')}</button>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-textMain">{t('profile.faceId')}</span>
                        <button 
                          onClick={toggleBiometrics}
                          className={`w-12 h-6 rounded-full transition-colors relative ${biometricsEnabled ? 'bg-green-500' : 'bg-surfaceBorder'}`}
                        >
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${biometricsEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/5 border border-primary/30 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-textMain font-medium">Windows • Chrome</p>
                        <p className="text-textMuted text-sm">Бишкек, Кыргызстан • Сейчас</p>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md">Текущая</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-textMain font-medium">iPhone 14 Pro • Safari</p>
                        <p className="text-textMuted text-sm">Бишкек, Кыргызстан • 2 дня назад</p>
                      </div>
                      <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Завершить</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-textMain mb-6">{t('profile.theme')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                    >
                      <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 shadow-inner"></div>
                      <span className="text-textMain font-medium">{t('profile.lightTheme')}</span>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                    >
                      <div className="w-full h-24 bg-gray-900 rounded-lg mb-3 shadow-inner"></div>
                      <span className="text-textMain font-medium">{t('profile.darkTheme')}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'language' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-textMain mb-6">{t('profile.language')}</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleLangChange('ru')}
                      className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all ${lang === 'ru' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-textMain hover:bg-white/10'}`}
                    >
                      <span className="font-medium text-lg">Русский</span>
                      {lang === 'ru' && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </button>
                    <button 
                      onClick={() => handleLangChange('kg')}
                      className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all ${lang === 'kg' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-textMain hover:bg-white/10'}`}
                    >
                      <span className="font-medium text-lg">Кыргызча</span>
                      {lang === 'kg' && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
