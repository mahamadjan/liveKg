import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realTours = [
  {
    title: 'Треккинг на затерянное озеро Кёль-Суу',
    description: 'Трехдневный джип-тур и треккинг к одному из самых красивых и труднодоступных озер Кыргызстана, расположенному на высоте 3514 метров у границы с Китаем. Включено: трансфер на джипах, питание, проживание в юртах, пограничные пропуска.',
    price: 12500,
    duration: 3,
    difficulty: 'Средний',
    location: 'Нарын',
    images: JSON.stringify(['https://images.unsplash.com/photo-1595861114002-c9441a1a5b82?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1627885449216-70138d7c43df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'])
  },
  {
    title: 'Конный тур: Сон-Куль и Перевал 33 попугая',
    description: 'Ощутите себя настоящим кочевником! Двухдневный конный переход через живописные перевалы к высокогорному озеру Сон-Куль. Ночевка в настоящей кыргызской юрте, кумыс, национальная кухня и невероятное звездное небо.',
    price: 8500,
    duration: 2,
    difficulty: 'Легкий',
    location: 'Сон-Куль',
    images: JSON.stringify(['https://images.unsplash.com/photo-1540304603-5178dc9c054e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'])
  },
  {
    title: 'Восхождение в Базовый Лагерь Пика Ленина',
    description: 'Четырехдневный тур в самое сердце Памира. Мы доберемся до Базового лагеря (3600м) и прогуляемся до Луковой поляны. Потрясающие виды на ледники и 7-тысячник Пик Ленина.',
    price: 18000,
    duration: 4,
    difficulty: 'Сложный',
    location: 'Ош / Чон-Алай',
    images: JSON.stringify(['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'])
  },
  {
    title: 'Горячие источники Алтын-Арашан и озеро Ала-Куль',
    description: 'Идеальное сочетание тяжелого треккинга и расслабления. Подъем к изумрудному озеру Ала-Куль (3900м) и спуск в ущелье Алтын-Арашан для купания в природных горячих радоновых источниках.',
    price: 9500,
    duration: 3,
    difficulty: 'Сложный',
    location: 'Каракол',
    images: JSON.stringify(['https://images.unsplash.com/photo-1627885449216-70138d7c43df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'])
  },
  {
    title: 'Каньоны Конорчек и Башня Бурана',
    description: 'Однодневный легкий тур выходного дня из Бишкека. Посещение исторического минарета Башня Бурана (XI век) и хайкинг по марсианским пейзажам эоловых каньонов Конорчек.',
    price: 2000,
    duration: 1,
    difficulty: 'Легкий',
    location: 'Боомское ущелье',
    images: JSON.stringify(['https://images.unsplash.com/photo-1518544801976-3e159e50e108?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'])
  }
];

const realGuides = [
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
  },
  {
    name: 'Эльдар Исаев (Кеттик)',
    email: 'eldar.kettik@lifekg.com',
    phone: '+996500999888',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    languages: JSON.stringify(['Кыргызский', 'Русский']),
    experience: 12,
    rating: 4.8
  }
];

async function seed() {
  console.log('Seeding real tours and guides...');
  
  // Clear old tours
  await prisma.tour.deleteMany({});
  
  // Create Guides & their Users
  const guideUsers = [];
  for (const g of realGuides) {
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
    }
    
    // Create Guide profile
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
    
    guideUsers.push(user);
  }

  // Create Tours distributed among the guides
  for (let i = 0; i < realTours.length; i++) {
    const tourData = realTours[i];
    const author = guideUsers[i % guideUsers.length];
    
    await prisma.tour.create({
      data: {
        ...tourData,
        authorId: author.id
      }
    });
  }

  console.log('Successfully seeded REAL tours and guides!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
