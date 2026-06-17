import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize AI
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const prisma = new PrismaClient();
const JWT_SECRET = 'super-secret-life-kg-key-2026';

// ---------------------------------------------------------
// Nodemailer Config (Real Gmail SMTP)
// ---------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yakhubovv0708@gmail.com',
    pass: 'mslrwdyytzxnxnrm'.replace(/\s/g, ''), // remove spaces just in case
  },
});
console.log('Real Gmail SMTP Configured.');

// ---------------------------------------------------------
// Endpoints
// ---------------------------------------------------------

// 1. Send OTP (Email or Phone)
app.post('/api/auth/send-code', async (req, res) => {
  const { contact, method } = req.body; // method: 'email' or 'phone'
  if (!contact || !method) return res.status(400).json({ error: 'Missing contact info' });

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to DB (valid for 5 mins)
  await prisma.otp.create({
    data: {
      target: contact,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }
  });

  if (method === 'email') {
    try {
      await transporter.sendMail({
        from: '"LifeKG Auth" <yakhubovv0708@gmail.com>',
        to: contact,
        subject: 'Ваш код подтверждения LifeKG',
        text: `Никому не сообщайте этот код: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #E53935; text-align: center;">LifeKG</h2>
            <p style="font-size: 16px;">Здравствуйте!</p>
            <p style="font-size: 16px;">Вы запросили вход в систему. Ваш секретный код подтверждения:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #666;">Если вы не запрашивали этот код, просто проигнорируйте данное письмо.</p>
          </div>
        `
      });
      console.log(`[EMAIL SENT VIA GMAIL] To: ${contact}, Code: ${code}`);
      return res.json({ success: true, message: 'Код успешно отправлен на вашу почту.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to send email via Gmail' });
    }
  } else {
    // Mock SMS sending
    console.log(`[SMS SENT] To: ${contact}, Code: ${code}`);
    return res.json({ success: true, message: 'Код отправлен по SMS (посмотрите консоль сервера)' });
  }
});

// 2. Verify OTP & Login/Register
app.post('/api/auth/verify', async (req, res) => {
  const { contact, code } = req.body;

  // Find valid OTP
  // Check for hardcoded admin password
  if (contact === 'admin@lifekg.com' && code === '1234') {
    // bypass otp check
  } else {
    const otpRecord = await prisma.otp.findFirst({
      where: {
        target: contact,
        code: code,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) return res.status(400).json({ error: 'Неверный код или срок действия истек' });

    // Delete used OTP
    await prisma.otp.delete({ where: { id: otpRecord.id } });
  }

  // Find or Create User
  let user = await prisma.user.findFirst({
    where: { OR: [{ email: contact }, { phone: contact }] }
  });

  if (!user) {
    user = await prisma.user.create({
      data: contact.includes('@') ? { email: contact, isVerified: true } : { phone: contact, isVerified: true }
    });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({ success: true, token, user });
});

// 3. Google OAuth Verification
app.post('/api/auth/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Missing access_token' });

  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    const data = await response.json();

    if (!data.email) {
      return res.status(400).json({ error: 'Invalid Google Token' });
    }

    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: data.email, name: data.name, isVerified: true }
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// 4. Get Profile (Protected)
app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// 5. Update Profile
app.put('/api/users/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    const { name, email, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { name, email, phone }
    });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 6. Upload Avatar
const upload = multer({ dest: path.join(__dirname, '../uploads/') });
app.post('/api/upload', upload.single('avatar'), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Construct image URL
    const avatarUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    
    // Save to DB
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatar: avatarUrl }
    });

    return res.json({ success: true, avatarUrl, user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload' });
  }
});

// 7. Process Payment
app.post('/api/pay', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    const { amount, title } = req.body;
    
    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: decoded.userId,
        amount: amount,
        title: title,
        type: 'expense'
      }
    });

    // We can also deduct balance here if needed
    // await prisma.user.update({ where: { id: decoded.userId }, data: { balance: { decrement: amount } } });

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// JOBS API
// ==========================================

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create a new job
app.post('/api/jobs', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const { title, profession, company, location, salary, type, experience, education, ageRange, tags } = req.body;
    
    if (!title || !profession || !company || !location || !salary || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        profession,
        company,
        location,
        salary,
        type,
        experience: experience || 'Без опыта',
        education: education || 'Любое',
        ageRange: ageRange || 'Любой',
        tags: tags || '',
        userId: decoded.userId
      }
    });

    try {
      const activeUsers = await prisma.user.findMany({
        where: { id: { not: decoded.userId } },
        take: 15
      });
      for (const u of activeUsers) {
        await prisma.notification.create({
          data: {
            title: 'Новая вакансия!',
            message: `${company} ищет: ${title} (${salary})`,
            userId: u.id
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify users about job:', err);
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// APPLY & MESSENGER API
// ==========================================

// Apply to a job
app.post('/api/jobs/:id/apply', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const applicantId = decoded.userId;

    const { resume } = req.body;
    if (!resume) return res.status(400).json({ error: 'Resume text is required' });

    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (job.userId === applicantId) {
      return res.status(400).json({ error: 'Cannot apply to your own job' });
    }

    const existingApp = await prisma.application.findFirst({
      where: { jobId: job.id, userId: applicantId }
    });
    if (existingApp) return res.status(400).json({ error: 'Already applied' });

    // 1. Create Application
    const application = await prisma.application.create({
      data: { resume, jobId: job.id, userId: applicantId }
    });

    // 2. Create Notification for Employer
    const applicant = await prisma.user.findUnique({ where: { id: applicantId }});
    await prisma.notification.create({
      data: {
        title: 'Новый отклик',
        message: `${applicant?.name || 'Кандидат'} откликнулся на вашу вакансию "${job.title}"`,
        userId: job.userId
      }
    });

    // 3. Create Chat (or find existing)
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: applicantId, user2Id: job.userId },
          { user1Id: job.userId, user2Id: applicantId }
        ]
      }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { user1Id: applicantId, user2Id: job.userId }
      });
    }

    // 4. Send resume as first message
    await prisma.message.create({
      data: {
        text: `--- Отклик на вакансию: ${job.title} ---\n\n${resume}`,
        chatId: chat.id,
        senderId: applicantId
      }
    });

    res.json({ success: true, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI Chat Route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, image, history } = req.body;
    if (!message && !image) return res.status(400).json({ error: 'Message or image is required' });

    if (!ai) {
      return res.status(500).json({ error: 'API ключ Gemini не настроен на сервере' });
    }

    let contents: any[] = [];
    
    // Add history if present
    if (history && Array.isArray(history)) {
      contents = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
    }

    // Add current message
    if (image) {
      contents.push({
        role: 'user',
        parts: [
          { text: message || "Опиши это изображение детально:" },
          { inlineData: { mimeType: image.mimeType, data: image.data } }
        ]
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    let liveContext = `\n[Системная информация]: Сегодня ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' })}.`;
    try {
      const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=42.87&longitude=74.59&current_weather=true', { signal: AbortSignal.timeout(2000) });
      const wData = await wRes.json();
      liveContext += ` Текущая погода в Бишкеке: ${wData.current_weather.temperature}°C, ветер ${wData.current_weather.windspeed} км/ч.`;
    } catch(e) {}

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: "Ты невероятно умный, мощный и продвинутый ИИ (основанный на Gemini). Твоя задача — быть полноценным персональным ассистентом в приложении LifeKg. Ты умеешь профессионально писать код на любых языках, решать сложные математические задачи, писать длинные эссе и отвечать на любые вопросы без ограничений." + liveContext,
      }
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('AI Error:', error);
    let errorMessage = 'Сбой связи с нейросетью. Попробуйте еще раз.';
    if (error?.status === 503 || error?.message?.includes('high demand')) {
      errorMessage = 'Серверы сейчас перегружены. Пожалуйста, подождите пару секунд и попробуйте снова! 🚀';
    } else if (error?.status === 429 || error?.message?.includes('quota')) {
      errorMessage = 'Вы задаете вопросы слишком быстро! 😅 Нейросети нужно 30 секунд на передышку. Пожалуйста, подождите немного и отправьте сообщение снова!';
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Get Notifications
app.get('/api/notifications', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const notifications = await prisma.notification.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
app.post('/api/notifications/read', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await prisma.notification.updateMany({
      where: { userId: decoded.userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Chats
app.get('/api/chats', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const chats = await prisma.chat.findMany({
      where: { OR: [{ user1Id: decoded.userId }, { user2Id: decoded.userId }] },
      include: {
        user1: { select: { id: true, name: true, avatar: true } },
        user2: { select: { id: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: decoded.userId },
                isRead: false
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedChats = chats.map(chat => ({
      ...chat,
      unreadCount: chat._count.messages
    }));

    res.json(formattedChats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread messages count
app.get('/api/chats/unread', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const unreadCount = await prisma.message.count({
      where: {
        chat: { OR: [{ user1Id: decoded.userId }, { user2Id: decoded.userId }] },
        senderId: { not: decoded.userId },
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Messages for a Chat
app.get('/api/chats/:id/messages', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Mark all unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        chatId: req.params.id,
        senderId: { not: decoded.userId },
        isRead: false
      },
      data: { isRead: true }
    });

    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true } } }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send Message
app.post('/api/chats/:id/messages', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message text required' });

    const message = await prisma.message.create({
      data: {
        text,
        chatId: req.params.id,
        senderId: decoded.userId
      },
      include: { sender: { select: { id: true, name: true } } }
    });

    await prisma.chat.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() }
    });

    try {
      const chat = await prisma.chat.findUnique({
        where: { id: req.params.id }
      });
      if (chat) {
        const recipientId = chat.user1Id === decoded.userId ? chat.user2Id : chat.user1Id;
        const sender = await prisma.user.findUnique({ where: { id: decoded.userId } });
        await prisma.notification.create({
          data: {
            title: 'Новое сообщение',
            message: `${sender?.name || 'Пользователь'}: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`,
            userId: recipientId
          }
        });
      }
    } catch (err) {
      console.error('Failed to create message notification:', err);
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// TOURISM API
// ==========================================

// Seed and get tours
let toursCache: any[] = [];
let toursLastFetched = 0;

// Seed and get tours
app.get('/api/tours', async (req: Request, res: Response): Promise<any> => {
  try {
    const now = Date.now();
    // Cache for 15 minutes (900000 ms)
    if (toursCache.length > 0 && now - toursLastFetched < 900000) {
      return res.json(toursCache);
    }

    const response = await fetch('https://ticket.kg/events/tourism', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items: any[] = [];
    $('a[href^="/event/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const slug = href.replace('/event/', '');
      const title = $(el).text().trim() || $(el).find('img').attr('alt') || '';
      if (!slug || items.some(item => item.id === slug)) return;

      let depth = 0;
      let temp = $(el).parent();
      let foundContainer = null;
      while (temp.length && depth < 5) {
        const text = temp.text().trim();
        const imgs = temp.find('img');
        if (imgs.length > 0 && text.length > title.length) {
          foundContainer = temp;
          break;
        }
        temp = temp.parent();
        depth++;
      }

      const host = foundContainer || $(el).parent();
      const img = host.find('img').attr('src') || '';
      const text = host.text().replace(/\s+/g, ' ').trim();

      let price = 1500;
      const priceMatch = text.match(/от\s*(\d[\d\s]*)\s*c/i) || text.match(/(\d[\d\s]*)\s*сом/i);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
      }

      items.push({
        id: slug,
        title,
        price,
        images: JSON.stringify([img]),
        location: 'Кыргызстан',
        duration: 1,
        difficulty: 'Средний',
        description: 'Загрузка...'
      });
    });

    const parsedTours = await Promise.all(items.slice(0, 12).map(async (tour) => {
      try {
        const detailRes = await fetch(`https://ticket.kg/event/${tour.id}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const detailHtml = await detailRes.text();
        const $detail = cheerio.load(detailHtml);

        let location = 'Кыргызстан';
        $detail('div, p, span').each((idx, elem) => {
          const t = $detail(elem).text().trim();
          if (t === 'Достук Отель' || t.includes('Бульвар Эркиндик') || t.includes('Филармония') || t.includes('Токтогула')) {
            location = t;
          }
        });

        const paragraphs: string[] = [];
        $detail('p').each((idx, elem) => {
          const t = $detail(elem).text().trim();
          if (t.length > 15 && !t.includes('Входные билеты') && !t.includes('Все права защищены') && !t.includes('Политика конфиденциальности')) {
            paragraphs.push(t);
          }
        });

        const description = paragraphs.join('\n\n');

        // Guess duration
        let duration = 1;
        const titleLower = tour.title.toLowerCase();
        if (titleLower.includes('однодневный') || titleLower.includes('1 день')) {
          duration = 1;
        } else if (titleLower.includes('двухдневный') || titleLower.includes('2 дня') || titleLower.includes('2-х')) {
          duration = 2;
        } else if (titleLower.includes('3 дня') || titleLower.includes('трехдневный') || titleLower.includes('3-х')) {
          duration = 3;
        } else if (titleLower.includes('5 дней') || titleLower.includes('5-ти') || titleLower.includes('гранд тур') || titleLower.includes('вокруг иссык-куля')) {
          duration = 5;
        }

        // Guess difficulty
        let difficulty = 'Средний';
        if (titleLower.includes('поход') || titleLower.includes('пик') || titleLower.includes('восхождение') || titleLower.includes('треккинг')) {
          difficulty = 'Сложный';
        } else if (titleLower.includes('экскурсия') || titleLower.includes('кино') || titleLower.includes('аквапарк') || titleLower.includes('зоопарк') || titleLower.includes('родельбаны')) {
          difficulty = 'Легкий';
        }

        return {
          ...tour,
          location,
          description: description || 'Смотрите подробности на сайте при бронировании.',
          duration,
          difficulty,
          author: {
            name: 'PEGAS TRIP & Partners',
            avatar: 'https://ticket.kg/images/logo.png'
          }
        };
      } catch (e) {
        console.error('Error parsing tour details:', tour.id, e);
        return {
          ...tour,
          description: 'Описание временно недоступно. Пожалуйста, попробуйте обновить позже.',
          author: {
            name: 'PEGAS TRIP & Partners',
            avatar: 'https://ticket.kg/images/logo.png'
          }
        };
      }
    }));

    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (e) {}
    }

    if (userId && toursCache.length > 0 && parsedTours.length > 0) {
      const latestCachedId = toursCache[0].id;
      const latestFetchedId = parsedTours[0].id;
      if (latestCachedId !== latestFetchedId) {
        await prisma.notification.create({
          data: {
            title: 'Новый тур в Кыргызстане!',
            message: parsedTours[0].title,
            userId: userId
          }
        });
      }
    }

    toursCache = parsedTours;
    toursLastFetched = now;
    res.json(toursCache);
  } catch (err) {
    console.error('Error fetching tours:', err);
    res.json(toursCache || []);
  }
});

// Create Tour
app.post('/api/tours', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { title, description, price, duration, difficulty, location, images } = req.body;
    const tour = await prisma.tour.create({
      data: {
        title, description, price, duration, difficulty, location,
        images: JSON.stringify(images || []),
        authorId: decoded.userId
      }
    });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Guides
app.get('/api/guides', async (req: Request, res: Response): Promise<any> => {
  try {
    let guides = await prisma.guide.findMany({
      include: { user: { select: { name: true, avatar: true, phone: true } } },
      orderBy: { rating: 'desc' }
    });

    if (guides.length === 0) {
      const defaultGuides = [
        {
          name: 'Эльдар Исаев (Кеттик)',
          email: 'eldar.kettik@lifekg.com',
          phone: '+996500999888',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          languages: JSON.stringify(['Кыргызский', 'Русский']),
          experience: 12,
          rating: 4.8
        },
        {
          name: 'Азамат Усубалиев',
          email: 'azamat.guide@lifekg.com',
          phone: '+996700111222',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          languages: JSON.stringify(['Кыргызский', 'Русский', 'English']),
          experience: 8,
          rating: 4.9
        },
        {
          name: 'Айдай Маратова',
          email: 'aiday.tour@lifekg.com',
          phone: '+996555333444',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          languages: JSON.stringify(['Кыргызский', 'Русский', 'French']),
          experience: 5,
          rating: 5.0
        }
      ];

      for (const g of defaultGuides) {
        let user = await prisma.user.findUnique({ where: { email: g.email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: g.name,
              email: g.email,
              phone: g.phone,
              avatar: g.avatar,
              isVerified: true
            }
          });
        } else {
          user = await prisma.user.update({
            where: { email: g.email },
            data: {
              avatar: g.avatar,
              phone: g.phone
            }
          });
        }

        const existingGuide = await prisma.guide.findUnique({ where: { userId: user.id } });
        if (!existingGuide) {
          await prisma.guide.create({
            data: {
              userId: user.id,
              languages: g.languages,
              experience: g.experience,
              rating: g.rating
            }
          });
        }
      }

      guides = await prisma.guide.findMany({
        include: { user: { select: { name: true, avatar: true, phone: true } } },
        orderBy: { rating: 'desc' }
      });
    }

    // Ensure guide users have nice avatars if they are placeholders
    for (const g of guides) {
      if (g.user?.avatar && (g.user.avatar.includes('placeholder') || g.user.avatar.includes('avatar_placeholder'))) {
        let newAvatar = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
        if (g.user.name && g.user.name.includes('Айдай')) {
          newAvatar = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
        } else if (g.user.name && g.user.name.includes('Эльдар')) {
          newAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
        }
        await prisma.user.update({
          where: { id: g.userId },
          data: { avatar: newAvatar }
        });
      }
    }

    // Refetch guides after dynamic updates
    guides = await prisma.guide.findMany({
      include: { user: { select: { name: true, avatar: true, phone: true } } },
      orderBy: { rating: 'desc' }
    });

    res.json(guides);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3001;
// Get Current User Info
app.get('/api/users/me', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// ADMIN DASHBOARD API
// ==========================================

const isAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    
    // Attach user to req for further use
    (req as any).adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error in auth' });
  }
};

// Admin: Get Dashboard Stats
app.get('/api/admin/stats', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const usersCount = await prisma.user.count();
    const jobsCount = await prisma.job.count();
    const chatsCount = await prisma.chat.count();
    res.json({ usersCount, jobsCount, chatsCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get Users
app.get('/api/admin/users', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, phone: true, name: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Change User Role (Only SuperAdmin can do this)
app.put('/api/admin/users/:id/role', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can change roles' });
    }

    const { role } = req.body;
    if (!['USER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    // Delete user's related data first (simplified for MVP, in real life you'd use cascade delete)
    await prisma.message.deleteMany({ where: { senderId: req.params.id } });
    await prisma.notification.deleteMany({ where: { userId: req.params.id } });
    await prisma.application.deleteMany({ where: { userId: req.params.id } });
    await prisma.job.deleteMany({ where: { userId: req.params.id } });
    await prisma.transaction.deleteMany({ where: { userId: req.params.id } });
    
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all Jobs
app.get('/api/admin/jobs', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const jobs = await prisma.job.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete Job
app.delete('/api/admin/jobs/:id', isAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    await prisma.application.deleteMany({ where: { jobId: req.params.id } });
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// HEALTH / MEDICINE API
// ==========================================

// Seed and get clinics
app.get('/api/clinics', async (req: Request, res: Response): Promise<any> => {
  try {
    let clinics = await prisma.clinic.findMany();
    if (clinics.length === 0) {
      // Seed data
      const clinic1 = await prisma.clinic.create({ data: { name: 'City Hospital #1', address: 'Bishkek, Kievskaya 114', phone: '+996312111111' } });
      const clinic2 = await prisma.clinic.create({ data: { name: 'MediCenter', address: 'Bishkek, Chuy 42', phone: '+996312222222' } });
      
      await prisma.doctor.create({ data: { name: 'Dr. Akylbekov N.', specialty: 'Кардиолог', experience: 15, rating: 4.8, fee: 1200, clinicId: clinic1.id } });
      await prisma.doctor.create({ data: { name: 'Dr. Zhumabaeva A.', specialty: 'Невролог', experience: 8, rating: 4.6, fee: 1000, clinicId: clinic1.id } });
      await prisma.doctor.create({ data: { name: 'Dr. Sadykov T.', specialty: 'Терапевт', experience: 20, rating: 4.9, fee: 800, clinicId: clinic2.id } });
      await prisma.doctor.create({ data: { name: 'Dr. Osmonova B.', specialty: 'Педиатр', experience: 5, rating: 4.5, fee: 900, clinicId: clinic2.id } });
      
      clinics = await prisma.clinic.findMany();
    }
    res.json(clinics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctors
app.get('/api/doctors', async (req: Request, res: Response): Promise<any> => {
  try {
    const doctors = await prisma.doctor.findMany({ include: { clinic: true } });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment
app.post('/api/appointments', async (req: Request, res: Response): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    const { doctorId, date, time } = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        userId: decoded.userId,
        doctorId,
        date,
        time,
        status: 'pending'
      }
    });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my appointments
app.get('/api/appointments/me', async (req: Request, res: Response): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    const appointments = await prisma.appointment.findMany({
      where: { userId: decoded.userId },
      include: { doctor: { include: { clinic: true } } },
      orderBy: [{ date: 'desc' }, { time: 'desc' }]
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// NEWS API (24.kg)
// ==========================================
const parser = new Parser();
let newsCache: any[] = [];
let newsLastFetched = 0;

app.get('/api/news', async (req: Request, res: Response): Promise<any> => {
  try {
    const now = Date.now();
    // Cache for 5 minutes (300,000 ms)
    if (newsCache.length > 0 && now - newsLastFetched < 300000) {
      return res.json(newsCache);
    }

    const feed = await parser.parseURL('https://24.kg/rss/');
    const topItems = feed.items.slice(0, 10); // get top 10 news

    const parsedItems = await Promise.all(topItems.map(async (item) => {
      let image = '';
      let htmlContent = '';
      try {
        const articleRes = await fetch(item.link || '');
        const articleHtml = await articleRes.text();
        const $ = cheerio.load(articleHtml);
        image = $('meta[property="og:image"]').attr('content') || '';
        
        // Extract the main content. 24.kg uses itemprop="articleBody"
        htmlContent = $('[itemprop="articleBody"]').html() || '';
        
        // Strip out scripts or iframe if any, but leave images
        const $content = cheerio.load(htmlContent);
        $content('script').remove();
        $content('iframe').remove();
        htmlContent = $content.html() || htmlContent;
      } catch(e) {
        console.error('Error parsing article:', item.link);
      }
      
      return {
        id: item.guid || item.link,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet || item.content || '',
        image,
        htmlContent
      };
    }));

    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (e) {}
    }

    if (userId && newsCache.length > 0 && parsedItems.length > 0) {
      const latestCachedTitle = newsCache[0].title;
      const latestFetchedTitle = parsedItems[0].title;
      if (latestCachedTitle !== latestFetchedTitle) {
        await prisma.notification.create({
          data: {
            title: 'Свежая новость!',
            message: latestFetchedTitle.substring(0, 80),
            userId: userId
          }
        });
      }
    }

    newsCache = parsedItems;
    newsLastFetched = now;
    res.json(newsCache);
  } catch (err) {
    console.error('Error fetching RSS:', err);
    // Return cached if available, else empty
    res.json(newsCache || []);
  }
});

// ==========================================
// MOVIES API (Cinematica Proxy)
// ==========================================
let moviesCache: any[] = [];
let moviesLastFetched = 0;

app.get('/api/movies', async (req: Request, res: Response): Promise<any> => {
  try {
    const now = Date.now();
    // Cache for 15 minutes
    if (moviesCache.length > 0 && now - moviesLastFetched < 900000) {
      return res.json(moviesCache);
    }
    const response = await fetch('https://cinematica.kg/api/v1/movies');
    const data = await response.json();
    moviesCache = data.list || [];
    moviesLastFetched = now;
    res.json(moviesCache);
  } catch(err) {
    console.error('Error fetching movies:', err);
    res.json(moviesCache || []);
  }
});

// ==========================================
// THEATER SCHEDULES API
// ==========================================
interface TheaterScheduleCacheItem {
  list: any[];
  timestamp: number;
}
const schedulesCache: Record<string, TheaterScheduleCacheItem> = {};

app.get('/api/theaters/:id/schedule', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const now = Date.now();

  // Mappings for Cinematica
  const cinematicaMapping: Record<string, number> = {
    cosmopark: 3,
    alatoo: 1,
    dordoi: 6
  };

  if (cinematicaMapping[id]) {
    const cinemaId = cinematicaMapping[id];
    const cacheKey = `cinematica_${cinemaId}`;

    if (schedulesCache[cacheKey] && now - schedulesCache[cacheKey].timestamp < 600000) {
      return res.json({ list: schedulesCache[cacheKey].list });
    }

    try {
      const response = await fetch(`https://cinematica.kg/api/v1/repertory/cinema/${cinemaId}/grouped`);
      const data = await response.json();
      const list = data.list || [];
      schedulesCache[cacheKey] = { list, timestamp: now };
      return res.json({ list });
    } catch (err) {
      console.error(`Error fetching schedule for cinema ${id}:`, err);
      return res.json({ list: schedulesCache[cacheKey]?.list || [] });
    }
  }

  // Fallback / mock real schedule for TSUM and Russia using real active movies from Cinematica API
  const cacheKey = `custom_${id}`;
  if (schedulesCache[cacheKey] && now - schedulesCache[cacheKey].timestamp < 600000) {
    return res.json({ list: schedulesCache[cacheKey].list });
  }

  try {
    // Ensure we have today's movies cached/fetched
    if (moviesCache.length === 0) {
      const response = await fetch('https://cinematica.kg/api/v1/movies');
      const data = await response.json();
      moviesCache = data.list || [];
      moviesLastFetched = now;
    }

    const activeMovies = moviesCache.slice(0, 6); // Take top 6 movies
    const list: any[] = [];
    let sessionCounter = 80000000;

    const dates: string[] = [];
    const dateObj = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(dateObj);
      d.setDate(dateObj.getDate() + i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      dates.push(`${dd}.${mm}.${yy}`);
    }

    const customCinemaInfo = id === 'tsum' 
      ? { cinema_id: 22, halls: ['Зал 1', 'Зал 2', 'VIP-Зал'] }
      : { cinema_id: 33, halls: ['Большой Зал', 'Малый Зал'] };

    // Standard showtimes
    const showtimes = ['10:20', '12:40', '15:00', '17:20', '19:40', '22:00'];

    for (const dateStr of dates) {
      activeMovies.forEach((movie, mIdx) => {
        // Give each movie 3 sessions per day
        const offset = mIdx % 2;
        const movieTimes = showtimes.filter((_, idx) => (idx + offset) % 2 === 0);

        movieTimes.forEach((timeStr, tIdx) => {
          sessionCounter++;
          const hallName = customCinemaInfo.halls[tIdx % customCinemaInfo.halls.length];
          const price = 250 + (tIdx * 40) + (hallName.includes('VIP') ? 150 : 0);

          list.push({
            id: sessionCounter,
            cinema_id: customCinemaInfo.cinema_id,
            hall_id: 40000000 + customCinemaInfo.cinema_id + tIdx,
            movie_id: movie.id,
            m_id: movie.id,
            movie: movie.name,
            poster: movie.file_poster_vertical,
            date: dateStr,
            time: timeStr,
            price: price.toString(),
            hall: hallName
          });
        });
      });
    }

    schedulesCache[cacheKey] = { list, timestamp: now };
    return res.json({ list });
  } catch (err) {
    console.error(`Error generating custom schedule for ${id}:`, err);
    return res.json({ list: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
