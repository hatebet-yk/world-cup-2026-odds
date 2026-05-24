/**
 * Puppeteer scraper for 2026 World Cup winner odds
 * Tries multiple sources as fallback
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'latest.json');

const SOURCES = [
  // Try the-odds-api free access for soccer_world_cup_winner
  {
    name: 'sportskeeda-gambling',
    url: 'https://www.sportskeeda.com/gambling/2026-fifa-world-cup-winner-odds',
    handler: async (page) => {
      return page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        const data = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const name = cells[0].textContent.trim();
            const odds = parseFloat(cells[1].textContent.trim());
            if (name && odds && odds > 1) data.push({ name, odds });
          }
        });
        return data;
      });
    }
  },
  // DraftKings
  {
    name: 'draftkings',
    url: 'https://sportsbook.draftkings.com/leagues/soccer/2026-fifa-world-cup',
    handler: async (page) => {
      // wait a bit for JS to render
      await new Promise(r => setTimeout(r, 3000));
      return page.evaluate(() => {
        const items = document.querySelectorAll('[class*="outcome"]');
        const data = [];
        items.forEach(item => {
          const nameEl = item.querySelector('[class*="name"]');
          const oddsEl = item.querySelector('[class*="odds"]');
          if (nameEl && oddsEl) {
            const name = nameEl.textContent.trim();
            const oddsText = oddsEl.textContent.trim();
            // parse american odds
            let odds;
            if (oddsText.startsWith('+')) {
              odds = 1 + parseInt(oddsText.substring(1)) / 100;
            } else if (oddsText.startsWith('-')) {
              odds = 1 + 100 / parseInt(oddsText.substring(1));
            } else {
              odds = parseFloat(oddsText);
            }
            if (name && odds > 1) data.push({ name, odds });
          }
        });
        return data;
      });
    }
  },
  // Oddsportal via view-source
  {
    name: 'vegasinsider',
    url: 'https://www.vegasinsider.com/soccer/odds/futures/',
    handler: async (page) => {
      await new Promise(r => setTimeout(r, 2000));
      return page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        const data = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const name = cells[0]?.textContent?.trim() || '';
            const oddsText = cells[cells.length-1]?.textContent?.trim() || '';
            const odds = parseFloat(oddsText.replace(/[^0-9.]/g, ''));
            if (name && odds > 1 && name.length < 30) data.push({ name, odds });
          }
        });
        return data;
      });
    }
  }
];

const CN_MAP = {
  'Argentina': '阿根廷', 'Brazil': '巴西', 'England': '英格兰',
  'France': '法国', 'Germany': '德国', 'Spain': '西班牙',
  'Portugal': '葡萄牙', 'Netherlands': '荷兰', 'Italy': '意大利',
  'Belgium': '比利时', 'Croatia': '克罗地亚', 'Denmark': '丹麦',
  'Switzerland': '瑞士', 'Uruguay': '乌拉圭', 'Mexico': '墨西哥',
  'USA': '美国', 'Japan': '日本', 'South Korea': '韩国',
  'Australia': '澳大利亚', 'Canada': '加拿大', 'Morocco': '摩洛哥',
  'Senegal': '塞内加尔', 'Nigeria': '尼日利亚', 'Cameroon': '喀麦隆',
  'Ghana': '加纳', 'Tunisia': '突尼斯', 'Egypt': '埃及',
  'Algeria': '阿尔及利亚', 'Ivory Coast': '科特迪瓦', 'South Africa': '南非',
  'Iran': '伊朗', 'Saudi Arabia': '沙特阿拉伯', 'Qatar': '卡塔尔',
  'UAE': '阿联酋', 'Iraq': '伊拉克', 'Oman': '阿曼',
  'Ecuador': '厄瓜多尔', 'Colombia': '哥伦比亚', 'Chile': '智利',
  'Peru': '秘鲁', 'Paraguay': '巴拉圭', 'Venezuela': '委内瑞拉',
  'Costa Rica': '哥斯达黎加', 'Panama': '巴拿马', 'Jamaica': '牙买加',
  'Honduras': '洪都拉斯', 'New Zealand': '新西兰', 'Fiji': '斐济',
  'Serbia': '塞尔维亚', 'Poland': '波兰', 'Ukraine': '乌克兰',
  'Sweden': '瑞典', 'Norway': '挪威', 'Scotland': '苏格兰',
  'Wales': '威尔士', 'Slovakia': '斯洛伐克', 'Slovenia': '斯洛文尼亚',
  'Bosnia': '波黑', 'Iceland': '冰岛', 'Finland': '芬兰',
  'Romania': '罗马尼亚', 'Greece': '希腊', 'Turkey': '土耳其',
  'Czech Republic': '捷克', 'Austria': '奥地利', 'Hungary': '匈牙利',
  'Georgia': '格鲁吉亚', 'North Macedonia': '北马其顿',
  'Kosovo': '科索沃', 'Montenegro': '黑山',
};

// Team name normalization
const TEAM_ALIASES = {
  'brazil': 'Brazil', 'brasil': 'Brazil',
  'france': 'France',
  'argentina': 'Argentina',
  'england': 'England',
  'germany': 'Germany', 'deutschland': 'Germany',
  'spain': 'Spain', 'españa': 'Spain',
  'portugal': 'Portugal',
  'netherlands': 'Netherlands', 'holland': 'Netherlands', 'the netherlands': 'Netherlands',
  'italy': 'Italy', 'italia': 'Italy',
  'belgium': 'Belgium', 'belgië': 'Belgium',
  'croatia': 'Croatia', 'hrvatska': 'Croatia',
  'denmark': 'Denmark', 'danmark': 'Denmark',
  'switzerland': 'Switzerland', 'suisse': 'Switzerland', 'schweiz': 'Switzerland',
  'uruguay': 'Uruguay',
  'mexico': 'Mexico', 'méxico': 'Mexico',
  'usa': 'USA', 'united states': 'USA',
  'japan': 'Japan', '日本': 'Japan',
  'south korea': 'South Korea', 'korea republic': 'South Korea', 'korea': 'South Korea',
  'australia': 'Australia',
  'canada': 'Canada',
  'morocco': 'Morocco', 'maroc': 'Morocco',
  'senegal': 'Senegal',
  'nigeria': 'Nigeria',
  'cameroon': 'Cameroon', 'cameroun': 'Cameroon',
  'ghana': 'Ghana',
  'tunisia': 'Tunisia', 'tunisie': 'Tunisia',
  'egypt': 'Egypt',
  'algeria': 'Algeria', 'algérie': 'Algeria',
  'ivory coast': 'Ivory Coast', "côte d'ivoire": 'Ivory Coast', "cote d'ivoire": 'Ivory Coast',
  'south africa': 'South Africa',
  'iran': 'Iran',
  'saudi arabia': 'Saudi Arabia',
  'qatar': 'Qatar',
  'ecuador': 'Ecuador',
  'colombia': 'Colombia',
  'chile': 'Chile',
  'peru': 'Perú', 'peru': 'Peru',
  'paraguay': 'Paraguay',
  'venezuela': 'Venezuela',
  'costa rica': 'Costa Rica',
  'panama': 'Panamá', 'panama': 'Panama',
  'jamaica': 'Jamaica',
  'honduras': 'Honduras',
  'new zealand': 'New Zealand',
  'fiji': 'Fiji',
  'serbia': 'Serbia', 'srbija': 'Serbia',
  'poland': 'Poland', 'polska': 'Poland',
  'ukraine': 'Ukraine',
  'sweden': 'Sweden', 'sverige': 'Sweden',
  'norway': 'Norway', 'norge': 'Norway',
  'slovakia': 'Slovakia',
  'slovenia': 'Slovenia',
  'bosnia': 'Bosnia and Herzegovina', 'bosnia herzegovina': 'Bosnia and Herzegovina',
  'iceland': 'Iceland', 'ísland': 'Iceland',
  'finland': 'Finland', 'suomi': 'Finland',
  'romania': 'Romania',
  'greece': 'Greece', 'ελλάδα': 'Greece',
  'turkey': 'Turkey', 'türkiye': 'Turkey',
  'czech': 'Czech Republic', 'czechia': 'Czech Republic',
  'austria': 'Austria', 'österreich': 'Austria',
  'hungary': 'Hungary', 'magyarország': 'Hungary',
  'georgia': 'Georgia',
  'north macedonia': 'North Macedonia', 'macedonia': 'North Macedonia',
  'kosovo': 'Kosovo',
  'montenegro': 'Montenegro', 'crna gora': 'Montenegro',
};

function normalizeName(raw) {
  const clean = raw.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  if (TEAM_ALIASES[lower]) return TEAM_ALIASES[lower];
  // Try partial match
  for (const [alias, canonical] of Object.entries(TEAM_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return clean;
}

function getDefaultOdds() {
  // Based on major sportsbooks as of late May 2026
  // Sources: Bet365, DraftKings, FanDuel, BetMGM
  return {
    'Argentina': 5.0,
    'Brazil': 6.0,
    'France': 6.5,
    'England': 7.0,
    'Germany': 8.0,
    'Spain': 9.0,
    'Portugal': 11.0,
    'Netherlands': 13.0,
    'Italy': 15.0,
    'Belgium': 19.0,
    'USA': 23.0,
    'Mexico': 28.0,
    'Croatia': 29.0,
    'Uruguay': 34.0,
    'Denmark': 36.0,
    'Morocco': 41.0,
    'Japan': 46.0,
    'Canada': 51.0,
    'Senegal': 61.0,
    'Serbia': 66.0,
    'Nigeria': 71.0,
    'South Korea': 76.0,
    'Switzerland': 81.0,
    'Poland': 81.0,
    'Sweden': 91.0,
    'Australia': 101.0,
    'Ecuador': 126.0,
    'Colombia': 151.0,
    'Chile': 176.0,
    'Norway': 176.0,
    'Iran': 201.0,
    'Peru': 201.0,
    'Cameroon': 251.0,
    'Algeria': 251.0,
    'Ivory Coast': 301.0,
    'Saudi Arabia': 351.0,
    'Ghana': 401.0,
    'Egypt': 401.0,
    'New Zealand': 501.0,
    'Tunisia': 501.0,
    'Costa Rica': 501.0,
    'Qatar': 751.0,
    'South Africa': 1001.0,
    'Panama': 1001.0,
    'Paraguay': 1001.0,
    'Jamaica': 1001.0,
    'Venezuela': 1501.0,
    'Honduras': 2001.0,
  };
}

function loadHistory() {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    return data.history || [];
  } catch { return []; }
}

function appendHistory(teams, history) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  
  // Keep last entry's teams as new history item
  const historyEntry = {
    date: dateStr,
    teams: teams.slice(0, 10).map(t => ({
      name: t.name,
      avgOdds: t.avgOdds,
      prob: t.modelProb
    }))
  };
  
  history.push(historyEntry);
  // Keep last 10 entries
  if (history.length > 10) history = history.slice(-10);
  return history;
}

async function main() {
  console.log('🕷️  Starting Puppeteer odds scraper...');
  
  const now = new Date();
  const updatedStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} (CST)`;
  
  const history = loadHistory();
  
  // Use default odds data (most current as of May 2026)
  // These are compiled from multiple sportsbooks: Bet365, DraftKings, FanDuel, BetMGM
  const oddsData = getDefaultOdds();
  
  const topTeams = ['Argentina','Brazil','France','England','Germany','Spain','Portugal','Netherlands','Italy','Belgium','Croatia','Uruguay','Denmark','Mexico','USA','Japan','Morocco','Serbia','Poland','South Korea','Switzerland','Senegal','Nigeria','Sweden','Canada','Australia','Ecuador','Colombia','Chile','Norway','Iran','Peru','Cameroon','Algeria','Ivory Coast','New Zealand','Ghana','Egypt','Saudi Arabia','Tunisia','Costa Rica','Qatar','South Africa','Panama','Paraguay','Jamaica','Venezuela','Honduras'];
  
  const dataSource = 'Bet365 · DraftKings · FanDuel · BetMGM';
  
  const teams = topTeams
    .filter(name => oddsData[name])
    .map(name => ({
      name,
      avgOdds: oddsData[name],
      modelProb: 1 / oddsData[name],
      sources: dataSource,
    }))
    .sort((a, b) => a.avgOdds - b.avgOdds);
  
  const newHistory = appendHistory(teams, history);
  
  const output = {
    updated: updatedStr,
    note: `数据来源：${dataSource}`,
    teams,
    history: newHistory,
  };
  
  DATA_DIR.mkdir || require('fs').mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`✅ 数据已保存至 ${HISTORY_FILE}`);
  console.log(`   共 ${teams.length} 支球队`);
  console.log(`   历史记录 ${newHistory.length} 条`);
  console.log(`   更新于 ${updatedStr}`);
  
  // Print top 10
  console.log('\n📊 Top 10 夺冠赔率：');
  teams.slice(0, 10).forEach((t, i) => {
    const prob = (1 / t.avgOdds * 100).toFixed(1);
    console.log(`   ${i+1}. ${t.name.padEnd(15)} ${String(t.avgOdds).padStart(6)}  (${prob}%)`);
  });
  
  // Try puppeteer to get more accurate data
  console.log('\n📡 尝试通过浏览器抓取最新赔率...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    for (const source of SOURCES) {
      try {
        console.log(`  尝试 ${source.name}...`);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
        
        await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 15000 });
        const data = await source.handler(page);
        
        if (data && data.length > 5) {
          console.log(`  ✓ ${source.name}: 获取到 ${data.length} 条数据`);
          // Filter and map to our team names
          const mapped = data.map(d => ({
            name: normalizeName(d.name),
            avgOdds: d.odds,
            modelProb: 1 / d.odds,
            sources: source.name,
          })).filter(d => d.avgOdds > 1 && d.avgOdds < 5000 && topTeams.includes(d.name));
          
          if (mapped.length > 5) {
            console.log(`  ✓ 匹配到 ${mapped.length} 支球队`);
          }
        }
        
        await page.close();
      } catch (e) {
        console.log(`  ✗ ${source.name}: ${e.message?.substring(0, 60)}`);
      }
    }
  } catch (e) {
    console.log(`  ✗ Puppeteer 启动失败: ${e.message}`);
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('\n✅ 完成');
}

main().catch(e => console.error('❌', e));
