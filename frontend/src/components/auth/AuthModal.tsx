import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useGoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [step, setStep] = useState<'contact' | 'otp' | 'setup_pin' | 'confirm_pin' | 'success'>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [, setMethod] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          setLoggedInUser(data.user);
          // Instead of success, go to PIN setup
          if (!localStorage.getItem(`pin_${data.user.id}`)) {
            setStep('setup_pin');
          } else {
            setStep('success');
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 2000);
          }
        } else {
          setError(data.error || 'Ошибка входа Google');
        }
      } catch (err) {
        setError('Ошибка сервера при входе Google');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Авторизация Google отменена или не удалась.');
    }
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Auto-detect method
    const actualMethod = contact.includes('@') ? 'email' : 'phone';
    setMethod(actualMethod);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, method: actualMethod })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep('otp');
      } else {
        setError(data.error || 'Ошибка отправки');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, code })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setLoggedInUser(data.user);
        
        if (!localStorage.getItem(`pin_${data.user.id}`)) {
          setStep('setup_pin');
        } else {
          setStep('success');
          setTimeout(() => {
            onClose();
            window.location.reload(); // Reload to update user state
          }, 2000);
        }
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handlePinKeyPress = (num: string, isConfirm: boolean) => {
    if (isConfirm) {
      if (confirmPin.length < 4) {
        const nextPin = confirmPin + num;
        setConfirmPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin === newPin) {
            // Success! Save PIN
            localStorage.setItem(`pin_${loggedInUser.id}`, nextPin);
            // Optionally prompt biometrics, but for now just save and finish
            // To be simple, we just enable biometrics by default if supported
            if (window.PublicKeyCredential) {
              localStorage.setItem(`biometrics_${loggedInUser.id}`, 'true');
            }
            setStep('success');
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 1500);
          } else {
            setError('PIN-коды не совпадают. Попробуйте еще раз.');
            setTimeout(() => {
              setConfirmPin('');
              setError('');
              setStep('setup_pin');
              setNewPin('');
            }, 1500);
          }
        }
      }
    } else {
      if (newPin.length < 4) {
        const nextPin = newPin + num;
        setNewPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => {
            setStep('confirm_pin');
          }, 200);
        }
      }
    }
  };

  const handleDeletePin = (isConfirm: boolean) => {
    if (isConfirm) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setNewPin(prev => prev.slice(0, -1));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md z-10"
        >
          <GlassCard className="!p-8 !bg-background/95 !border-white/10 shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-textMain transition-colors">
              <X size={24} />
            </button>

            {step === 'contact' && (
              <div>
                <h2 className="text-2xl font-bold text-textMain mb-2">Вход или Регистрация</h2>
                <p className="text-textMuted mb-8">Введите ваш номер телефона или Email, чтобы получить код доступа.</p>
                
                <form onSubmit={handleSendCode}>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {contact.includes('@') ? <Mail size={20}/> : <Phone size={20}/>}
                      </div>
                      <input 
                        type="text" 
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Email или +996 XXX XXX XXX" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-textMain placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                  
                  <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-primary/90 text-textMain py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    {loading ? 'Отправка...' : 'Получить код'} <ArrowRight size={20}/>
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-textMuted text-sm mb-4">Или войдите через:</p>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => loginWithGoogle()} type="button" className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-textMain font-medium transition-colors flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </button>
                    <button type="button" className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-textMain font-medium transition-colors">Apple</button>
                  </div>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div>
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-textMain mb-2 text-center">Введите код</h2>
                <p className="text-textMuted mb-8 text-center">
                  Мы отправили код на <strong>{contact}</strong>. 
                  <br/><span className="text-xs text-yellow-500/80 mt-2 block">(Тестовый режим: посмотрите в консоли сервера)</span>
                </p>
                
                <form onSubmit={handleVerify}>
                  <div className="mb-6">
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="XXXXXX" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-center text-2xl tracking-widest text-textMain placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  
                  {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                  
                  <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-primary/90 text-textMain py-4 rounded-xl font-bold transition-colors">
                    {loading ? 'Проверка...' : 'Войти'}
                  </button>
                </form>
                <button onClick={() => setStep('contact')} className="w-full mt-4 text-textMuted hover:text-textMain text-sm transition-colors">
                  Изменить контактные данные
                </button>
              </div>
            )}

            {(step === 'setup_pin' || step === 'confirm_pin') && (
              <div>
                <h2 className="text-2xl font-bold text-textMain mb-2 text-center">
                  {step === 'setup_pin' ? 'Создайте PIN-код' : 'Повторите PIN-код'}
                </h2>
                <p className="text-textMuted mb-8 text-center text-sm">
                  {step === 'setup_pin' 
                    ? 'Для быстрого и безопасного входа в приложение' 
                    : 'Убедитесь, что вы не ошиблись'}
                </p>

                <div className="flex justify-center gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => {
                    const currentPinLength = step === 'setup_pin' ? newPin.length : confirmPin.length;
                    return (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full transition-colors ${i < currentPinLength ? 'bg-primary' : 'bg-surfaceBorder border-2 border-surfaceBorder'}`}
                      />
                    );
                  })}
                </div>

                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handlePinKeyPress(num.toString(), step === 'confirm_pin')}
                      className="h-16 rounded-full flex items-center justify-center text-2xl font-bold text-textMain bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <div /> {/* Empty space for bottom left */}
                  <button
                    onClick={() => handlePinKeyPress('0', step === 'confirm_pin')}
                    className="h-16 rounded-full flex items-center justify-center text-2xl font-bold text-textMain bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleDeletePin(step === 'confirm_pin')}
                    className="h-16 rounded-full flex items-center justify-center text-textMain bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold text-textMain mb-2">Успешно!</h2>
                <p className="text-textMuted">Вы авторизованы. Выполняется вход...</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
