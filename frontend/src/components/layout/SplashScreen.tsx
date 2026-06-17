import { motion } from 'framer-motion';
import { useEffect } from 'react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    // 3.8 seconds for cinematic intro
    const timer = setTimeout(() => {
      onFinish();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center"
    >
      {/* Cinematic Realistic Background */}
      <motion.div
        initial={{ scale: 1.15, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1.0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 4, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img 
          src="/splash_bg.png" 
          alt="Kyrgyzstan Mountains and Yurt" 
          className="w-full h-full object-cover opacity-70"
        />
        {/* Premium Dark Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-[#0a0a0a]/90" />
      </motion.div>

      {/* Cinematic Text Appearance */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glowing Logo Mark appearing from the "light" */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.5, filter: "blur(20px)" }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 1.0, type: "spring", bounce: 0.2 }}
          className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.3)] mb-6 relative overflow-hidden"
        >
          {/* Internal shine effect */}
          <motion.div 
            animate={{ x: [-100, 100], opacity: [0, 1, 0] }}
            transition={{ delay: 2.0, duration: 1.5 }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent skew-x-12"
          />
          <span className="text-white text-4xl font-black tracking-tighter drop-shadow-2xl">KG</span>
        </motion.div>

        {/* Text elegantly emerging */}
        <div className="overflow-hidden">
          <motion.div
            initial={{ y: 40, opacity: 0, letterSpacing: "0px" }}
            animate={{ y: 0, opacity: 1, letterSpacing: "6px" }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          >
            Life
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
