import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, FileText, Loader2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

export const ApplyModal = ({ isOpen, onClose, jobId, jobTitle }: ApplyModalProps) => {
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resume })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при отклике');
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setResume('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        />
        
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg z-10"
        >
          <GlassCard className="!p-6 w-full !rounded-3xl md:!rounded-2xl shadow-2xl">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} className="text-textMain" />
            </button>

            {success ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Send size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-textMain mb-2">Отклик отправлен!</h2>
                <p className="text-textMuted">Работодатель получил ваше резюме и сообщение.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-textMain mb-1 pr-10">Отклик на вакансию</h2>
                <p className="text-primary font-medium mb-6">{jobTitle}</p>

                {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Ваше резюме или сопроводительное письмо</label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-3 top-3.5 text-textMuted" />
                      <textarea 
                        required 
                        value={resume} 
                        onChange={e => setResume(e.target.value)} 
                        rows={6} 
                        placeholder="Напишите немного о себе, своем опыте и прикрепите ссылку на резюме/портфолио..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-textMain placeholder-textMuted focus:border-primary/50 outline-none resize-none custom-scrollbar"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading || !resume.trim()} 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> Отправить отклик</>}
                  </button>
                </form>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
