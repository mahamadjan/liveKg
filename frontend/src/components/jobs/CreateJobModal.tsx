import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Building, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { CustomSelect } from '../ui/CustomSelect';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateJobModal = ({ isOpen, onClose, onSuccess }: CreateJobModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    profession: 'Frontend Разработчик',
    company: '',
    location: 'Бишкек',
    salary: '',
    type: 'Полный день',
    experience: 'Без опыта',
    education: 'Любое',
    ageRange: 'Любой',
    tags: ''
  });

  const cities = ['Бишкек', 'Ош', 'Жалал-Абад', 'Каракол', 'Нарын', 'Талас', 'Баткен', 'Удаленно'];
  
  const professions = {
    'IT & Разработка': ['Frontend Разработчик', 'Backend Разработчик', 'UI/UX Дизайнер', 'QA Инженер', 'Project Manager', 'Системный администратор'],
    'Торговля и Продажи': ['Менеджер по продажам', 'Кассир', 'Продавец-консультант', 'Супервайзер'],
    'Медицина': ['Врач', 'Медсестра', 'Фармацевт', 'Стоматолог'],
    'Строительство': ['Инженер-строитель', 'Архитектор', 'Прораб', 'Сварщик', 'Разнорабочий'],
    'Услуги и Рестораны': ['Официант', 'Повар', 'Курьер', 'Уборщица', 'Бариста'],
    'Другое': ['Бухгалтер', 'Юрист', 'Секретарь', 'Охранник', 'Водитель']
  };

  const experiences = ['Без опыта', '1-3 года', '3-6 лет', 'Более 6 лет'];
  const educations = ['Любое', 'Среднее', 'Среднее специальное', 'Высшее', 'Неоконченное высшее (Студент)'];
  const ageRanges = ['Любой', '18-25 лет', '25-35 лет', '35-50 лет', 'Старше 50 лет'];
  const types = ['Полный день', 'Частичная занятость', 'Проектная работа', 'Стажировка'];

  const cityOptions = cities.map(c => ({ value: c, label: c }));
  const profOptions = Object.entries(professions).map(([group, opts]) => ({
    group,
    options: opts.map(o => ({ value: o, label: o }))
  }));
  const expOptions = experiences.map(c => ({ value: c, label: c }));
  const eduOptions = educations.map(c => ({ value: c, label: c }));
  const ageOptions = ageRanges.map(c => ({ value: c, label: c }));
  const typeOptions = types.map(c => ({ value: c, label: c }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('life_kg_token');
    if (!token) {
      setError('Пожалуйста, авторизуйтесь для публикации.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
        setFormData({ title: '', profession: 'Frontend Разработчик', company: '', location: 'Бишкек', salary: '', type: 'Полный день', experience: 'Без опыта', education: 'Любое', ageRange: 'Любой', tags: '' });
      } else {
        setError(data.error || 'Ошибка публикации');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

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
          className="relative w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <GlassCard className="!p-6 !bg-background/95 !border-white/10 shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-textMain transition-colors">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <h2 className="text-2xl font-bold text-textMain">Разместить вакансию</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Название вакансии (Заголовок)</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3.5 text-textMuted" />
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" placeholder="Например: Ищем крутого дизайнера" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain placeholder-textMuted focus:border-primary/50 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Профессия</label>
                  <CustomSelect value={formData.profession} onChange={val => setFormData({...formData, profession: val})} options={profOptions} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Компания</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-3.5 text-textMuted" />
                    <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} type="text" placeholder="Название вашей компании" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain placeholder-textMuted focus:border-primary/50 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Город / Формат</label>
                  <CustomSelect value={formData.location} onChange={val => setFormData({...formData, location: val})} options={cityOptions} icon={<MapPin size={18} />} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Зарплата</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-textMuted" />
                    <input required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} type="text" placeholder="$1000 - $2000" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain placeholder-textMuted focus:border-primary/50 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Опыт работы</label>
                  <CustomSelect value={formData.experience} onChange={val => setFormData({...formData, experience: val})} options={expOptions} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Образование</label>
                  <CustomSelect value={formData.education} onChange={val => setFormData({...formData, education: val})} options={eduOptions} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Возраст</label>
                  <CustomSelect value={formData.ageRange} onChange={val => setFormData({...formData, ageRange: val})} options={ageOptions} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Тип занятости</label>
                  <CustomSelect value={formData.type} onChange={val => setFormData({...formData, type: val})} options={typeOptions} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Теги (через запятую)</label>
                  <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} type="text" placeholder="React, Node, UI/UX" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-textMain placeholder-textMuted focus:border-primary/50 outline-none" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full mt-4 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Опубликовать вакансию'}
              </button>
            </form>

          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
