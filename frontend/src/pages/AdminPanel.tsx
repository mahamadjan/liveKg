import { useState, useEffect } from 'react';
import { Users, Briefcase, Trash2, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

export const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs'>('users');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (!statsRes.ok) {
        if (statsRes.status === 403) navigate('/');
        throw new Error('Forbidden');
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        setUsers(await res.json());
      } else {
        const res = await fetch('/api/admin/jobs', { headers });
        setJobs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Ошибка');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Точно удалить пользователя и все его данные?')) return;
    try {
      await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Точно удалить вакансию?')) return;
    try {
      await fetch(`http://localhost:3001/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pt-24 pb-24 px-4 container mx-auto max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/profile')} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="text-textMain" size={24} />
        </button>
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-textMain">Панель Управления</h1>
          <p className="text-primary mt-1">Super Admin Dashboard</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassCard className="!p-6 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/20 rounded-xl"><Users size={24} className="text-primary" /></div>
            <div><p className="text-textMuted text-sm">Всего пользователей</p><h2 className="text-2xl font-bold text-textMain">{stats.usersCount}</h2></div>
          </GlassCard>
          <GlassCard className="!p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-500/20 rounded-xl"><Briefcase size={24} className="text-blue-500" /></div>
            <div><p className="text-textMuted text-sm">Всего вакансий</p><h2 className="text-2xl font-bold text-textMain">{stats.jobsCount}</h2></div>
          </GlassCard>
          <GlassCard className="!p-6 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="p-3 bg-purple-500/20 rounded-xl"><Shield size={24} className="text-purple-500" /></div>
            <div><p className="text-textMuted text-sm">Активных чатов</p><h2 className="text-2xl font-bold text-textMain">{stats.chatsCount}</h2></div>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full w-max">
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'}`}>Пользователи</button>
        <button onClick={() => setActiveTab('jobs')} className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'jobs' ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'}`}>Вакансии</button>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 size={40} className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'users' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-textMuted text-sm">
                    <th className="p-4 font-medium">ID / Имя</th>
                    <th className="p-4 font-medium">Контакты</th>
                    <th className="p-4 font-medium">Роль</th>
                    <th className="p-4 font-medium">Регистрация</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-textMain">{u.name || 'Аноним'}</div>
                        <div className="text-xs text-textMuted">{u.id}</div>
                      </td>
                      <td className="p-4 text-sm text-textMain">{u.email || u.phone}</td>
                      <td className="p-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className={`bg-transparent border border-white/20 rounded px-2 py-1 text-xs outline-none ${u.role === 'SUPERADMIN' ? 'text-primary border-primary' : 'text-textMain'}`}
                        >
                          <option value="USER" className="bg-[#121212]">USER</option>
                          <option value="ADMIN" className="bg-[#121212]">ADMIN</option>
                          <option value="SUPERADMIN" className="bg-[#121212]">SUPERADMIN</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-textMuted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'jobs' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-textMuted text-sm">
                    <th className="p-4 font-medium">Вакансия</th>
                    <th className="p-4 font-medium">Компания</th>
                    <th className="p-4 font-medium">Автор</th>
                    <th className="p-4 font-medium">Дата</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.map(j => (
                    <tr key={j.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-textMain">{j.title}</div>
                        <div className="text-xs text-primary">{j.profession}</div>
                      </td>
                      <td className="p-4 text-sm text-textMain">{j.company} ({j.location})</td>
                      <td className="p-4 text-sm text-textMuted">{j.user?.name || j.user?.email}</td>
                      <td className="p-4 text-sm text-textMuted">{new Date(j.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteJob(j.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
