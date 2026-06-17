import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCw, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tunduk = () => {
  const navigate = useNavigate();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
    setIframeLoading(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col h-[100dvh] overflow-hidden">
      {/* Native App Header */}
      <div className="h-16 flex-none flex items-center justify-between px-4 bg-[#0A3D80] shadow-md z-10 pt-safe">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center flex-1 mx-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[16px] font-bold text-white tracking-wide">Түндүк портал</h3>
            <ShieldCheck size={16} className="text-[#00B4D8]" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Lock size={10} className="text-green-400" />
            <p className="text-[10px] text-white/80 font-medium">Безопасное гос. соединение</p>
          </div>
        </div>

        <button 
          onClick={handleReload}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
          title="Обновить страницу"
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* Iframe Wrapper */}
      <div className="flex-1 relative w-full bg-[#f4f6f8]">
        <AnimatePresence>
          {iframeLoading && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-white"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-[#0A3D80]/5 rounded-full animate-pulse absolute -inset-2" />
                <div className="w-16 h-16 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center relative z-10">
                  <ShieldCheck size={32} className="text-[#0A3D80]" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-20">
                  <Loader2 size={16} className="text-[#00B4D8] animate-spin" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-[#0A3D80] mb-2">Защищенный шлюз ЕСИА</h2>
              <p className="text-sm text-gray-500 font-medium text-center px-8 max-w-[300px]">
                Устанавливаем прямое соединение с серверами электронного правительства...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={iframeKey}
          src="https://portal.tunduk.kg/"
          title="Официальный портал Түндүк"
          className="absolute inset-0 w-full h-full border-none bg-transparent"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          onLoad={() => setIframeLoading(false)}
        />
      </div>
    </div>
  );
};
