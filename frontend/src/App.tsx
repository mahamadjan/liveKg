import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';
import { Home } from './pages/Home';
import { Jobs } from './pages/Jobs';
import { Transport } from './pages/Transport';
import { Profile } from './pages/Profile';
import { Messenger } from './pages/Messenger';
import { AdminPanel } from './pages/AdminPanel';
import { Health } from './pages/Health';
import { Theaters } from './pages/Theaters';
import { TheaterSchedule } from './pages/TheaterSchedule';
import { Tunduk } from './pages/Tunduk';
import { AIAssistant } from './pages/AIAssistant';
import { Tourism } from './pages/Tourism';
import { AppLock } from './components/auth/AppLock';
import { AuthModal } from './components/auth/AuthModal';
import { QRScannerModal } from './components/layout/QRScannerModal';

function App() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('life_kg_token');
    if (token) {
      // Sync the key for future
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 2. Poll notifications
    const seenNotifIds = new Set<string>();
    let firstLoad = true;

    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('life_kg_token');
        if (!token) return;

        const res = await fetch('http://localhost:3001/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const unreadCount = data.filter((n: any) => !n.isRead).length;

        // Dispatch event for Navbar and Home page
        window.dispatchEvent(new CustomEvent('notifications_updated', { 
          detail: { unreadCount, list: data } 
        }));

        // Send native browser push notification for new ones
        if ('Notification' in window && Notification.permission === 'granted') {
          for (const notif of data) {
            if (!seenNotifIds.has(notif.id)) {
              seenNotifIds.add(notif.id);
              if (!firstLoad && !notif.isRead) {
                new Notification(notif.title, {
                  body: notif.message
                });
              }
            }
          }
        }
        firstLoad = false;
      } catch (err) {
        console.error('Notification poll error:', err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 8000); // Poll every 8s

    const handleReadEvent = () => {
      checkNotifications();
    };
    window.addEventListener('notifications_read', handleReadEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_read', handleReadEvent);
    };
  }, [isAuthenticated]);

  return (
    <HelmetProvider>
      <AppLock>
        <Router>
          <div className="min-h-screen bg-background text-textMain selection:bg-primary/30 pb-20 md:pb-0">
            <AnimatePresence mode="wait">
              {!isSplashFinished ? (
                <SplashScreen key="splash" onFinish={() => setIsSplashFinished(true)} />
              ) : (
                <div key="content" className="fade-in">
                  <main>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/messenger" element={<Messenger />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/market" element={<div className="pt-32 text-center text-2xl font-bold text-textMain">Раздел Маркетплейс (В разработке)</div>} />
                      <Route path="/health" element={<Health />} />
                      <Route path="/theaters" element={<Theaters />} />
                      <Route path="/theaters/:id" element={<TheaterSchedule />} />
                      <Route path="/tunduk" element={<Tunduk />} />
                      <Route path="/education" element={<div className="pt-32 text-center text-2xl font-bold text-textMain">Раздел Образование (В разработке)</div>} />
                      <Route path="/transport" element={<Transport />} />
                      <Route path="/events" element={<div className="pt-32 text-center text-2xl font-bold text-textMain">Раздел События (В разработке)</div>} />
                      <Route path="/tourism" element={<Tourism />} />
                      <Route path="/ai" element={<AIAssistant />} />
                      <Route path="/profile" element={isAuthenticated ? <Profile /> : <div className="pt-32 text-center"><button onClick={() => setIsAuthOpen(true)} className="bg-primary px-6 py-2 rounded-xl text-white font-bold">Войти в систему</button></div>} />
                    </Routes>
                  </main>
                  <BottomNav />
                </div>
              )}
            </AnimatePresence>
          </div>
        </Router>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <QRScannerModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} />
      </AppLock>
    </HelmetProvider>
  );
}

export default App;
