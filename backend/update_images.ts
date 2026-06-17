import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reliableImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ala-Kul_lake.jpg/1024px-Ala-Kul_lake.jpg', // Ala-Kul
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Son-Kul_Lake.jpg/1024px-Son-Kul_Lake.jpg', // Son-Kul
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lenin_Peak_from_Base_Camp.jpg/1024px-Lenin_Peak_from_Base_Camp.jpg', // Lenin Peak
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Karakol_valley.jpg/1024px-Karakol_valley.jpg', // Karakol
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Burana_Tower%2C_Kyrgyzstan.jpg/1024px-Burana_Tower%2C_Kyrgyzstan.jpg' // Burana
];

async function updateImages() {
  console.log('Updating tour images to reliable Wikimedia URLs...');
  const tours = await prisma.tour.findMany();
  
  for (let i = 0; i < tours.length; i++) {
    await prisma.tour.update({
      where: { id: tours[i].id },
      data: {
        images: JSON.stringify([reliableImages[i % reliableImages.length]])
      }
    });
  }
  
  // Update Guide avatars
  const guides = await prisma.guide.findMany({ include: { user: true } });
  for (const guide of guides) {
    await prisma.user.update({
      where: { id: guide.userId },
      data: {
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Profile_avatar_placeholder_large.png/800px-Profile_avatar_placeholder_large.png'
      }
    });
  }
  
  console.log('Images updated successfully!');
}

updateImages().catch(console.error).finally(() => prisma.$disconnect());
