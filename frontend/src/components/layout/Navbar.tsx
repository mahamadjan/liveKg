import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, Bell, LogOut, Search } from 'lucide-react';
import { AnimatedLogo } from '../ui/AnimatedLogo';
import { AuthModal } from '../auth/AuthModal';
import { NotificationsModal } from '../home/NotificationsModal';
import { SearchModal } from '../home/SearchModal';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    if (localStorage.getItem('token') || localStorage.getItem('life_kg_token')) {
      setIsAuthenticated(true);
    }

    const handleNotifUpdate = (e: any) => {
      setUnreadNotifCount(e.detail.unreadCount || 0);
    };
    window.addEventListener('notifications_updated', handleNotifUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('notifications_updated', handleNotifUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('life_kg_token');
    setIsAuthenticated(false);
    window.location.reload();
  };

  const navLinks = [
    { name: 'Работа', path: '/jobs' },
    { name: 'Маркет', path: '/market' },
    { name: 'Транспорт', path: '/transport' },
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-surfaceBorder py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="z-50">
            <AnimatedLogo className="w-10 h-10" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className="text-sm font-medium text-textMuted hover:text-textMain transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-textMuted hover:text-textMain transition-colors mr-2">
              KG | RU
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="text-textMuted hover:text-textMain transition-colors"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => setIsNotifOpen(true)}
              className="text-textMuted hover:text-textMain transition-colors relative"
            >
              <Bell size={20} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-background"></span>
              )}
            </button>
            
            {isAuthenticated ? (
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-full transition-all text-sm font-medium">
                <LogOut size={16} />
                <span>Выйти</span>
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-textMain px-5 py-2 rounded-full transition-all text-sm font-medium shadow-lg shadow-primary/20">
                <User size={16} />
                <span>Войти</span>
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden z-50 text-textMain"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '100vh' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-xl z-40 pt-24 px-6"
            >
              <div className="flex flex-col gap-6 text-center">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    to={link.path} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl font-bold text-textMain"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-px bg-surfaceBorder w-full my-4" />
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="text-red-400 text-xl font-bold">Выйти</button>
                ) : (
                  <button onClick={() => { setMobileMenuOpen(false); setIsAuthOpen(true); }} className="text-primary text-xl font-bold">Войти в аккаунт</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
