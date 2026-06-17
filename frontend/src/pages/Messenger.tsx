import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageSquare, Search, Send, User, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

export const Messenger = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setChats(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMessages(data);
      // Trigger instant unread badge update
      window.dispatchEvent(new Event('chat_read'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    setActiveChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempMessage = { id: 'temp', text: newMessage, sender: { name: 'Вы' } };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      await fetch(`/api/chats/${activeChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: tempMessage.text })
      });
      fetchMessages(activeChat.id);
      fetchChats(); // Update last message
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Determine chat partner name
  const getPartnerName = (chat: any) => {
    // Basic logic: if user1's name is not current user (this requires current user name or id). Since we don't have user object here, we just use user2 or user1.
    // In a real app we decode token to get our own ID.
    // Let's decode token here.
    const token = localStorage.getItem('token');
    let myId = '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        myId = payload.userId;
      } catch (e) {}
    }
    const partner = chat.user1Id === myId ? chat.user2 : chat.user1;
    return partner?.name || 'Пользователь';
  };

  const getMyId = () => {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) { return ''; }
  }

  return (
    <div className="pt-24 pb-24 px-4 container mx-auto max-w-6xl h-screen flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-textMain mb-2">Чаты</h1>
        <p className="text-textMuted">Переписки с работодателями и кандидатами</p>
      </motion.div>

      <GlassCard className="!p-0 flex-1 flex overflow-hidden !rounded-3xl border border-white/10 shadow-2xl">
        {/* Chats List Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-white/10 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-textMuted" />
              <input type="text" placeholder="Поиск диалогов..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-textMain placeholder-textMuted focus:border-primary/50 outline-none" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 size={30} className="animate-spin text-primary" /></div>
            ) : chats.length === 0 ? (
              <div className="text-center p-10 text-textMuted text-sm">У вас пока нет чатов.</div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => handleSelectChat(chat)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-primary/20' : 'hover:bg-white/5'}`}
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <User size={24} className="text-textMuted" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-textMain truncate">{getPartnerName(chat)}</h4>
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-textMain font-bold' : 'text-textMuted'}`}>
                      {chat.messages && chat.messages.length > 0 ? chat.messages[0].text : 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-[#121212]/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5 backdrop-blur-md">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 bg-white/10 rounded-full">
                  <ArrowLeft size={20} className="text-textMain" />
                </button>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-textMuted" />
                </div>
                <div>
                  <h3 className="font-bold text-textMain">{getPartnerName(activeChat)}</h3>
                  <p className="text-xs text-primary">В сети</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center p-10"><Loader2 size={30} className="animate-spin text-primary" /></div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === getMyId();
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                        <div className={`p-4 rounded-2xl ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 text-textMain rounded-bl-none'}`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-textMuted mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Только что'}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white/5 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..." 
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full py-3 px-6 text-textMain placeholder-textMuted outline-none focus:border-primary/50"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                  >
                    <Send size={20} className="ml-[-2px]" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-textMuted p-10 text-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-white/20" />
              </div>
              <h3 className="text-2xl font-bold text-textMain mb-2">Выберите чат</h3>
              <p className="max-w-xs">Выберите диалог слева, чтобы начать общение с работодателем или кандидатом.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
