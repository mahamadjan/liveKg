import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Loader2, MessageSquare, Briefcase, MapPin, Newspaper 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('life_kg_token');
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data || []);

      const hasUnread = data && Array.isArray(data) && data.some((n: any) => !n.isRead);
      if (hasUnread) {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        window.dispatchEvent(new CustomEvent('notifications_read'));
        
        // Satisfying delay to let user see unread accent state before fading to read
        setTimeout(() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNotifDetails = (title: string) => {
    const tLower = title.toLowerCase();
    if (tLower.includes('сообщение') || tLower.includes('отклик')) {
      return {
        icon: MessageSquare,
        color: 'text-primary',
        bg: 'bg-primary/10'
      };
    }
    if (tLower.includes('вакансия') || tLower.includes('работа')) {
      return {
        icon: Briefcase,
        color: 'text-green-500',
        bg: 'bg-green-500/10'
      };
    }
    if (tLower.includes('тур')) {
      return {
        icon: MapPin,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10'
      };
    }
    if (tLower.includes('новость') || tLower.includes('новости')) {
      return {
        icon: Newspaper,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
      };
    }
    return {
      icon: Bell,
      color: 'text-primary',
      bg: 'bg-primary/10'
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm h-full bg-[var(--color-background)] border-l border-white/10 shadow-2xl flex flex-col z-10"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Bell size={20} />
              </div>
              <h2 className="text-xl font-bold text-textMain">{t('home.notifications')}</h2>
            </div>
            <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 size={30} className="animate-spin text-primary" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-textMuted mt-10">
                <Bell size={40} className="mx-auto mb-4 opacity-50" />
                <p>{t('home.noNotifications')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((notification) => {
                  const details = getNotifDetails(notification.title);
                  const IconComponent = details.icon;
                  
                  return (
                    <motion.div 
                      key={notification.id}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        onClose();
                        const title = notification.title.toLowerCase();
                        if (title.includes('сообщение') || title.includes('отклик')) {
                          navigate('/messenger');
                        } else if (title.includes('вакансия') || title.includes('работа')) {
                          navigate('/jobs');
                        } else if (title.includes('тур')) {
                          navigate('/tourism');
                        } else if (title.includes('новость') || title.includes('новости')) {
                          navigate('/?scrollTo=news');
                        } else {
                          navigate('/');
                        }
                      }}
                      className={`flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border-y border-r border-white/5 border-l-4 hover:bg-white/10 shadow-sm ${
                        notification.isRead 
                          ? 'bg-white/5 border-l-textMuted/30' 
                          : 'bg-primary/5 dark:bg-primary/10 border-l-primary shadow-[0_4px_12px_rgba(229,57,53,0.08)]'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${details.bg}`}>
                        <IconComponent size={20} className={details.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-textMain text-sm truncate pr-2">{notification.title}</h4>
                          <span className="text-[10px] text-textMuted whitespace-nowrap shrink-0">
                            {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-textMuted line-clamp-2 leading-relaxed">{notification.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
