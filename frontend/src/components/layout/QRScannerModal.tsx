import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal = ({ isOpen, onClose }: QRScannerModalProps) => {
  const { t } = useTranslation();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [status, setStatus] = useState<'scanning' | 'processing' | 'success'>('scanning');

  const handleScan = async (result: any) => {
    if (result && result.length > 0 && status === 'scanning') {
      const text = result[0].rawValue;
      setScannedData(text);
      setStatus('processing');

      try {
        const token = localStorage.getItem('life_kg_token');
        await fetch('/api/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: 17, // Standard bus fare
            title: `Оплата проезда: ${text.substring(0, 20)}`
          })
        });

        // Show success animation
        setTimeout(() => setStatus('success'), 1500);
      } catch (err) {
        console.error(err);
        setStatus('scanning');
      }
    }
  };

  const handleClose = () => {
    setScannedData(null);
    setStatus('scanning');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <motion.div 
          initial={{ opacity: 0, y: 100 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: 100 }}
          className="relative flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-[env(safe-area-inset-top,2rem)] flex items-center z-[200] bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-8 pointer-events-none">
            <button 
              onClick={handleClose} 
              className="pointer-events-auto flex items-center gap-1 text-white bg-white/20 hover:bg-white/30 backdrop-blur-2xl px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg border border-white/10"
            >
              <ChevronLeft size={20} />
              <span className="font-medium text-sm pr-1">{t('qr.back')}</span>
            </button>
          </div>

          {/* Scanner Area */}
          {status === 'scanning' && (
            <div className="flex-1 relative overflow-hidden bg-black">
              <Scanner 
                onScan={handleScan}
                formats={['qr_code']}
                classNames={{
                  container: 'h-full w-full object-cover',
                  video: 'h-full w-full object-cover'
                }}
              />
              
              {/* Custom Overlay */}
              <div className="absolute inset-0 border-[40px] border-black/50" style={{ pointerEvents: 'none' }}>
                <div className="absolute inset-0 border-2 border-primary/50 m-12 rounded-3xl relative">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-3xl" />
                  
                  {/* Scanning Laser */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(229,57,53,0.8)]"
                  />
                </div>
              </div>

              <div className="absolute bottom-12 left-0 right-0 text-center">
                <p className="text-white bg-black/50 inline-block px-6 py-3 rounded-full backdrop-blur-md">
                  {t('qr.pointCamera')}
                </p>
              </div>
            </div>
          )}

          {/* Processing / Success Overlay */}
          {status !== 'scanning' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-background px-6">
              {status === 'processing' ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                  <Loader2 size={64} className="text-primary animate-spin mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">{t('qr.processing')}</h3>
                  <p className="text-textMuted text-center">{t('qr.bankConnection')}</p>
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-sm">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                      <CheckCircle2 size={48} className="text-green-500" />
                    </motion.div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 text-center">17 ₸</h3>
                  <p className="text-green-400 font-medium mb-8">{t('qr.success')}</p>
                  
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                    <div className="flex justify-between mb-2">
                      <span className="text-textMuted">{t('qr.purpose')}</span>
                      <span className="text-white font-medium">Проезд (Тулпар)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textMuted">{t('qr.code')}</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{scannedData}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleClose}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    {t('qr.done')}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
