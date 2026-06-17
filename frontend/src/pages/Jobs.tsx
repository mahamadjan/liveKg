import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Search, MapPin, DollarSign, Briefcase, Plus, Loader2, Send } from 'lucide-react';
import { CreateJobModal } from '../components/jobs/CreateJobModal';
import { ApplyModal } from '../components/jobs/ApplyModal';
import { CustomSelect } from '../components/ui/CustomSelect';

export const Jobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyModalJob, setApplyModalJob] = useState<{id: string, title: string} | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');

  const categories = ['Все', 'IT & Разработка', 'Дизайн', 'Маркетинг', 'Продажи', 'Строительство'];
  const cities = ['Все города', 'Бишкек', 'Ош', 'Жалал-Абад', 'Каракол', 'Нарын', 'Талас', 'Баткен', 'Удаленно'];
  const cityOptions = cities.map(city => ({ value: city === 'Все города' ? '' : city, label: city }));

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setJobs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (job.title && job.title.toLowerCase().includes(searchLower)) ||
      (job.company && job.company.toLowerCase().includes(searchLower)) ||
      (job.tags && job.tags.toLowerCase().includes(searchLower));

    // 2. City Filter
    const matchesCity = !selectedCity || job.location === selectedCity;

    // 3. Category Filter (very basic tag matching for demo)
    let matchesCategory = true;
    if (selectedCategory !== 'Все') {
      const catLower = selectedCategory.toLowerCase();
      // Assume if any tag includes category name (like "Дизайн" -> "design", "дизайн")
      matchesCategory = !!job.tags && job.tags.toLowerCase().includes(catLower.substring(0, 4));
    }

    return matchesSearch && matchesCity && matchesCategory;
  });

  return (
    <div className="pt-24 pb-12 px-4 container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-textMain mb-4">Поиск работы</h1>
          <p className="text-textMuted">Найдите идеальную вакансию или разместите свою.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95"
        >
          <Plus size={20} /> Разместить вакансию
        </button>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-2 flex flex-col md:flex-row gap-2 mb-10"
      >
        <div className="flex-[2] flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <Search size={20} className="text-textMuted mr-3" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Профессия, должность или компания" 
            className="bg-transparent border-none outline-none w-full text-textMain placeholder:text-textMuted/70"
          />
        </div>
        <div className="flex-1 flex items-center min-w-[200px]">
          <CustomSelect 
            value={selectedCity || 'Все города'} 
            onChange={setSelectedCity} 
            options={cityOptions} 
            icon={<MapPin size={20} />} 
          />
        </div>
      </motion.div>

      {/* Categories / Filters */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full border transition-all ${selectedCategory === cat ? 'bg-primary border-primary text-textMain' : 'bg-transparent border-surfaceBorder text-textMuted hover:text-textMain hover:border-white/30'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <motion.div layout className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex justify-center text-primary">
              <Loader2 size={40} className="animate-spin" />
            </motion.div>
          ) : filteredJobs.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 text-textMuted bg-white/5 rounded-2xl border border-white/5">
              {jobs.length === 0 ? 'Пока нет размещенных вакансий. Будьте первыми!' : 'По вашему запросу ничего не найдено.'}
            </motion.div>
          ) : (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <GlassCard hoverEffect={true} className="!p-5 cursor-pointer group">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Briefcase size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-textMain mb-1">{job.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-primary font-medium">{job.company}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span className="text-textMuted text-sm">{job.profession || 'Другое'}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-textMuted mb-3">
                          <div className="flex items-center gap-1"><MapPin size={16}/> {job.location}</div>
                          <div className="flex items-center gap-1"><DollarSign size={16}/> <span className="font-semibold text-textMain">{job.salary}</span></div>
                        </div>

                        {/* Extra Requirements Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-textMuted">Опыт: {job.experience || 'Без опыта'}</span>
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-textMuted">Образование: {job.education || 'Любое'}</span>
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-textMuted">Возраст: {job.ageRange || 'Любой'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0">
                      <span className="px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                        {job.type}
                      </span>
                      <div className="flex gap-2 mb-2">
                        {job.tags ? String(job.tags).split(',').map((tag: string, i: number) => (
                          <span key={i} className="text-xs text-textMuted bg-surfaceHover px-2 py-1 rounded">
                            {tag.trim()}
                          </span>
                        )) : null}
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setApplyModalJob({ id: job.id, title: job.title }); }}
                        className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Send size={16} /> Откликнуться
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchJobs} 
      />

      <ApplyModal
        isOpen={!!applyModalJob}
        onClose={() => setApplyModalJob(null)}
        jobId={applyModalJob?.id || ''}
        jobTitle={applyModalJob?.title || ''}
      />
    </div>
  );
};
