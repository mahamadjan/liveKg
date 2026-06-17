import { motion } from 'framer-motion';

export const AnimatedLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        initial="hidden"
        animate="visible"
      >
        {/* Network dots */}
        <motion.circle cx="20" cy="80" r="3" fill="#FADB14" 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} />
        <motion.circle cx="50" cy="20" r="3" fill="#E53935" 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
        <motion.circle cx="80" cy="80" r="3" fill="#FADB14" 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />

        {/* Network lines */}
        <motion.path 
          d="M 20 80 L 50 20 L 80 80" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1" 
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* The Mountain / L shape */}
        <motion.path 
          d="M 20 80 L 50 20 L 80 80 L 50 50 Z" 
          fill="url(#mountainGrad)"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />
        
        {/* The prominent 'L' integrated into the mountain */}
        <motion.path 
          d="M 35 35 L 35 70 L 65 70" 
          stroke="#fff" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        />

        <defs>
          <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E53935" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FADB14" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </motion.svg>
      <motion.span 
        className="text-2xl font-bold tracking-tight text-textMain hidden sm:block"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        Life<span className="text-primary">KG</span>
      </motion.span>
    </div>
  );
};
