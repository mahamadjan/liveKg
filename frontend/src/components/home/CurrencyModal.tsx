import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Search } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTranslation } from 'react-i18next';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyModal = ({ isOpen, onClose }: CurrencyModalProps) => {
  const { t, i18n } = useTranslation();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [kgsBase, setKgsBase] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
          if (data && data.rates && data.rates.KGS) {
            setKgsBase(data.rates.KGS);
            setRates(data.rates);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const getCurrencyName = (code: string) => {
    try {
      const displayNames = new Intl.DisplayNames([i18n.language === 'kg' ? 'ky' : 'ru'], { type: 'currency' });
      return displayNames.of(code) || code;
    } catch (e) {
      return code;
    }
  };

  const allCurrencies = useMemo(() => {
    if (!kgsBase) return [];
    
    // Sort logic: Keep USD, EUR, RUB, KZT at the top, then alphabetically
    const topCodes = ['USD', 'EUR', 'RUB', 'KZT'];
    const codes = Object.keys(rates).filter(c => c !== 'KGS');
    
    const mapped = codes.map(code => ({
      code,
      name: getCurrencyName(code),
      rate: kgsBase / rates[code],
      isTop: topCodes.includes(code)
    }));

    mapped.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      if (a.isTop && b.isTop) return topCodes.indexOf(a.code) - topCodes.indexOf(b.code);
      return a.name.localeCompare(b.name);
    });

    return mapped;
  }, [rates, kgsBase, i18n.language]);

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return allCurrencies;
    const lowerQ = searchQuery.toLowerCase();
    return allCurrencies.filter(c => 
      c.code.toLowerCase().includes(lowerQ) || 
      c.name.toLowerCase().includes(lowerQ)
    );
  }, [searchQuery, allCurrencies]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md z-10 max-h-[90vh] flex flex-col"
        >
          <GlassCard className="!p-6 !bg-background/95 !border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-textMain transition-colors z-20">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                <DollarSign size={24} />
              </div>
              <h2 className="text-2xl font-bold text-textMain leading-tight">{t('home.exchangeRates')}</h2>
            </div>

            {/* Currency Search Bar */}
            <div className="relative mb-4 shrink-0">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="text-textMuted" size={18} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск валюты (USD, Евро...)"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {loading ? (
              <div className="py-10 text-center text-textMuted animate-pulse">Загрузка курсов мира...</div>
            ) : (
              <div className="overflow-y-auto pr-2 -mr-2 space-y-3 pb-2 flex-1 custom-scrollbar">
                <div className="grid grid-cols-3 text-xs text-textMuted mb-2 px-2 sticky top-0 bg-background/95 backdrop-blur-md py-2 z-10 border-b border-white/5">
                  <span>Валюта</span>
                  <span className="text-right">Покупка</span>
                  <span className="text-right">Продажа</span>
                </div>
                
                {filteredCurrencies.length === 0 ? (
                  <div className="text-center text-textMuted py-8">Валюта не найдена</div>
                ) : (
                  filteredCurrencies.map((c) => {
                    const buy = (c.rate * 0.995).toFixed(2);
                    const sell = (c.rate * 1.005).toFixed(2);
                    
                    return (
                      <div key={c.code} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 w-[40%]">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {c.code.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-textMain font-bold truncate">{c.code}</div>
                            <div className="text-textMuted text-xs truncate capitalize">{c.name}</div>
                          </div>
                        </div>
                        
                        <div className="w-[30%] text-right pr-2 border-r border-white/5">
                          <span className="text-textMain font-medium">{buy}</span>
                          <TrendingDown size={14} className="inline ml-1 text-red-400" />
                        </div>
                        <div className="w-[30%] text-right pl-2">
                          <span className="text-textMain font-medium">{sell}</span>
                          <TrendingUp size={14} className="inline ml-1 text-green-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
