import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

export interface GroupedOption {
  group: string;
  options: Option[];
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[] | GroupedOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const CustomSelect = ({ value, onChange, options, placeholder, icon, className = '' }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGrouped = options.length > 0 && 'group' in options[0];

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer text-textMain hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          {icon && <span className="text-textMuted">{icon}</span>}
          <span className="truncate">{value || placeholder}</span>
        </div>
        <ChevronDown size={18} className={`text-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {isGrouped ? (
              (options as GroupedOption[]).map((group, idx) => (
                <div key={idx}>
                  <div className="px-4 py-2 text-xs font-bold text-primary bg-black/40 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                    {group.group}
                  </div>
                  {group.options.map((opt) => (
                    <div 
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setIsOpen(false); }}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${value === opt.value ? 'bg-primary/20 text-primary' : 'text-textMain hover:bg-white/10'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              (options as Option[]).map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`px-4 py-3 cursor-pointer transition-colors ${value === opt.value ? 'bg-primary/20 text-primary' : 'text-textMain hover:bg-white/10'}`}
                >
                  {opt.label}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
