import { NavLink, useLocation } from 'react-router-dom';
import { Home, Briefcase, QrCode, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { QRScannerModal } from './QRScannerModal';
import { useTranslation } from 'react-i18next';

export const BottomNav = () => {
  const location = useLocation();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch unread count periodically or once
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/chats/unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 3000); // Poll every 3s
    window.addEventListener('chat_read', fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener('chat_read', fetchUnread);
    };
  }, [location.pathname]); // Refetch when changing routes too

  const tabs = [
    { name: t('nav.home'), path: '/', icon: Home, isAction: false },
    { name: t('nav.jobs'), path: '/jobs', icon: Briefcase, isAction: false },
    { name: t('nav.pay'), icon: QrCode, isAction: true },
    { name: 'Чаты', path: '/messenger', icon: MessageSquare, isAction: false },
    { name: t('nav.profile'), path: '/profile', icon: User, isAction: false },
  ];

  const activeIndex = tabs.findIndex(tab => location.pathname === tab.path) === -1 ? 0 : tabs.findIndex(tab => location.pathname === tab.path);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden pointer-events-none">
      <nav className="pointer-events-auto relative w-full max-w-[360px] glass rounded-full shadow-xl p-1">
        
        {/* Sliding Drop Indicator */}
        <div className="absolute inset-y-1 left-1 right-1 pointer-events-none overflow-hidden rounded-full">
          <motion.div
            className="absolute top-0 bottom-0 w-[calc(20%)] bg-[var(--color-surfaceHover)] border border-[var(--color-surfaceBorder)] rounded-full"
            initial={false}
            animate={{ x: `calc(${activeIndex * 100}%)` }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </div>

        <div className="relative flex justify-between items-center h-[60px] z-10">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            
            if (tab.isAction) {
              return (
                <button
                  key="action"
                  onClick={() => setIsScannerOpen(true)}
                  className="relative flex flex-col items-center justify-center w-1/5 h-full transition-colors duration-300 text-textMuted hover:text-textMain z-10"
                >
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                  </motion.div>
                </button>
              );
            }

            const isActive = activeIndex === idx;
            
            return (
              <NavLink
                key={tab.path}
                to={tab.path!}
                className={`relative flex flex-col items-center justify-center w-1/5 h-full transition-colors duration-300 ${isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'}`}
              >
                <motion.div 
                  whileTap={{ scale: 0.8 }}
                  animate={{ y: isActive ? -2 : 0 }}
                  className="flex flex-col items-center justify-center relative"
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  
                  {/* Unread Badge for Chats */}
                  {tab.path === '/messenger' && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1a1a]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}

                  {/* Small dot below icon when active */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1 h-1 rounded-full bg-primary mt-1 absolute -bottom-3"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};
