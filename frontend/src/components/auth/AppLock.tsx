import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AppLockProps {
  children: React.ReactNode;
}

export const AppLock = ({ children }: AppLockProps) => {
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if device supports biometrics (WebAuthn)
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((available) => {
        setIsBiometricSupported(available);
      });
    }
    
    // Only lock if user is authenticated and has a PIN
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const uid = payload.userId;
        setUserId(uid);
        
        const pin = localStorage.getItem(`pin_${uid}`);
        if (pin) {
          setSavedPin(pin);
          setBiometricsEnabled(localStorage.getItem(`biometrics_${uid}`) === 'true');
        } else {
          setIsLocked(false);
        }
      } catch (e) {
        setIsLocked(false);
      }
    } else {
      setIsLocked(false);
    }
  }, []);

  const handleBiometricUnlock = async () => {
    try {
      // Simulate or call real WebAuthn depending on setup
      // For this prototype, we'll try to trigger a generic credentials request
      if (!window.PublicKeyCredential) return;
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: "required",
        }
      });
      
      if (credential) {
        setIsLocked(false);
      }
    } catch (err) {
      console.warn("Biometrics failed or cancelled", err);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (newPin === savedPin) {
          setIsLocked(false);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (!savedPin && !isLocked) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[999] bg-background/90 backdrop-blur-3xl flex flex-col items-center justify-center px-6"
          >
            <div className="flex flex-col items-center mb-12">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-2xl">LKG</span>
              </div>
              <h2 className="text-2xl font-bold text-textMain mb-2">{t('lock.enterPin')}</h2>
              <p className="text-textMuted text-sm">{t('lock.locked')}</p>
            </div>

            <motion.div 
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-4 mb-16"
            >
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-primary' : 'bg-surfaceBorder border-2 border-surfaceBorder'}`}
                />
              ))}
            </motion.div>

            <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-20 rounded-full flex items-center justify-center text-3xl text-textMain hover:bg-white/10 transition-colors active:scale-90"
                >
                  {num}
                </button>
              ))}
              
              <button
                onClick={biometricsEnabled ? handleBiometricUnlock : undefined}
                className={`h-20 rounded-full flex items-center justify-center text-textMain transition-colors active:scale-90 ${!biometricsEnabled ? 'opacity-0 cursor-default' : 'hover:bg-white/10'}`}
              >
                {biometricsEnabled && <Fingerprint size={32} />}
              </button>
              
              <button
                onClick={() => handleKeyPress('0')}
                className="h-20 rounded-full flex items-center justify-center text-3xl text-textMain hover:bg-white/10 transition-colors active:scale-90"
              >
                0
              </button>
              
              <button
                onClick={handleDelete}
                className="h-20 rounded-full flex items-center justify-center text-textMain hover:bg-white/10 transition-colors active:scale-90"
              >
                <Delete size={28} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
