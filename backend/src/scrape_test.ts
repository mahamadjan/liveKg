import * as cheerio from 'cheerio';

async function scrapeTours() {
  try {
    const url = 'https://ticket.kg/events/tourism';
    console.log(`Fetching list from ${url}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find all event links.
    const items: any[] = [];
    $('a[href^="/event/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const slug = href.replace('/event/', '');
      const title = $(el).text().trim() || $(el).find('img').attr('alt') || '';
      
      // Let's avoid duplicates
      if (items.some(item => item.slug === slug)) return;
      
      // Find parent container
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
      
      // Extract price from text
      let price = 1000;
      const priceMatch = text.match(/от\s*(\d[\d\s]*)\s*c/i) || text.match(/(\d[\d\s]*)\s*сом/i);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
      }
      
      items.push({
        id: slug,
        slug,
        title,
        price,
        image: img,
        location: 'Кыргызстан', // fallback
        duration: 1, // fallback
        difficulty: 'Средний' // fallback
      });
    });
    
    console.log(`Found ${items.length} tours. Fetching details for first 5...`);
    
    const detailedTours = await Promise.all(items.slice(0, 5).map(async (tour) => {
      try {
        const detailUrl = `https://ticket.kg/event/${tour.slug}`;
        const detailRes = await fetch(detailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const detailHtml = await detailRes.text();
        const $detail = cheerio.load(detailHtml);
        
        // Extract location
        // Find location text: e.g. "Достук Отель"
        // It's usually a div or p or button content. Let's see if we can find typical locations.
        let location = 'Бишкек';
        $detail('div, p, span').each((idx, elem) => {
          const t = $detail(elem).text().trim();
          if (t === 'Достук Отель' || t.includes('Бульвар Эркиндик') || t.includes('Филармония') || t.includes('Токтогула')) {
            location = t;
          }
        });
        
        // Extract paragraphs inside article or main area
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
        if (tour.title.toLowerCase().includes('однодневный') || tour.title.toLowerCase().includes('1 день')) {
          duration = 1;
        } else if (tour.title.toLowerCase().includes('двухдневный') || tour.title.toLowerCase().includes('2 дня') || tour.title.toLowerCase().includes('2-х')) {
          duration = 2;
        } else if (tour.title.toLowerCase().includes('3 дня') || tour.title.toLowerCase().includes('трехдневный') || tour.title.toLowerCase().includes('3-х')) {
          duration = 3;
        } else if (tour.title.toLowerCase().includes('5 дней') || tour.title.toLowerCase().includes('5-ти')) {
          duration = 5;
        } else if (tour.title.toLowerCase().includes('гранд тур') || tour.title.toLowerCase().includes('вокруг иссык-куля')) {
          duration = 5;
        }
        
        // Guess difficulty
        let difficulty = 'Средний';
        const titleLower = tour.title.toLowerCase();
        if (titleLower.includes('поход') || titleLower.includes('пик') || titleLower.includes('восхождение') || titleLower.includes('треккинг')) {
          difficulty = 'Сложный';
        } else if (titleLower.includes('экскурсия') || titleLower.includes('кино') || titleLower.includes('аквапарк') || titleLower.includes('зоопарк') || titleLower.includes('родельбаны')) {
          difficulty = 'Легкий';
        }
        
        return {
          ...tour,
          location,
          description: description || 'Смотрите подробности при бронировании.',
          duration,
          difficulty,
          author: {
            name: 'PEGAS TRIP & Partners',
            avatar: 'https://ticket.kg/images/logo.png'
          }
        };
      } catch (err) {
        console.error(`Error details for ${tour.slug}:`, err);
        return tour;
      }
    }));
    
    console.log('Detailed tours sample:');
    console.log(JSON.stringify(detailedTours, null, 2));
  } catch (err) {
    console.error(err);
  }
}

scrapeTours();
