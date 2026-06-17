import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Lock } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (user: any) => void;
}

export const ProfileSettingsModal = ({ isOpen, onClose, user, onUpdate }: ProfileSettingsModalProps) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, email, phone })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (pin && pin.length === 4) {
          localStorage.setItem(`pin_${user.id}`, pin);
        }
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md"
        >
          <GlassCard className="p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-textMuted hover:text-textMain transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-textMain mb-6">Настройки профиля</h2>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Имя</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain focus:border-primary/50 outline-none"
                    placeholder="Ваше имя"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain focus:border-primary/50 outline-none"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Телефон</label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain focus:border-primary/50 outline-none"
                    placeholder="+996"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Новый PIN-код (если хотите изменить)</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain focus:border-primary/50 outline-none tracking-[1em] font-mono text-lg"
                    placeholder="****"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-textMain font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-6 transition-colors"
              >
                {loading ? 'Сохранение...' : (
                  <>
                    <Save size={20} />
                    <span>Сохранить изменения</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
