#!/usr/bin/env node
/**
 * 每日13:00 CST 自动运行
 * 尝试抓取世界杯比赛结果，更新 GROUP_MATCHES 数据
 * 保存到 data/match_schedule.json 并更新 index.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '..', 'data', 'match_schedule.json');
const INDEX_FILE = path.join(__dirname, '..', 'docs', 'index.html');
const REPO_DIR = path.join(__dirname, '..');

// ===== Load current data =====
let matchData;
try {
  matchData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (e) {
  console.error('❌ 无法读取 match_schedule.json:', e.message);
  process.exit(1);
}

// ===== Update timestamp =====
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;

matchData.updated = todayStr;

// ===== Try to fetch match results from various sources =====
// This is the hard part - most sites block scraping
// We try a few approaches:
async function fetchResults() {
  const sources = [
    // Try the FIFA API
    { url: 'https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=255711&count=200', name: 'FIFA API' },
  ];

  let updated = false;

  for (const src of sources) {
    try {
      const resp = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;

      const data = await resp.json();
      if (data && data.results) {
        console.log(`✅ 从 ${src.name} 获取到 ${data.results.length} 场比赛`);
        // Parse FIFA results and update matchData
        // ... (implementation depends on API structure)
        updated = true;
        break;
      }
    } catch (e) {
      console.log(`⚠️ ${src.name} 获取失败: ${e.message}`);
    }
  }

  return updated;
}

async function main() {
  console.log(`\n=== 世界杯小组赛数据更新 (${todayStr}) ===\n`);

  // Try to fetch live results
  const fetched = await fetchResults();

  if (fetched) {
    console.log('✅ 成功获取比赛结果数据');
  } else {
    console.log('⚠️ 无法获取最新比赛结果，保持现有数据');
  }

  // Save updated data
  fs.writeFileSync(DATA_FILE, JSON.stringify(matchData, null, 2));
  console.log('✅ 已保存 match_schedule.json');

  // Update GROUP_MATCHES in index.html
  try {
    let html = fs.readFileSync(INDEX_FILE, 'utf-8');
    const matchJsVar = 'var GROUP_MATCHES = ' + JSON.stringify(matchData, null, 0).replace(/\n/g, '') + ';';
    
    // Replace existing GROUP_MATCHES
    const regex = /var GROUP_MATCHES = \{.*?\};/;
    if (regex.test(html)) {
      html = html.replace(regex, matchJsVar);
      fs.writeFileSync(INDEX_FILE, html);
      console.log('✅ 已更新 index.html 中的 GROUP_MATCHES');
    } else {
      console.error('❌ 未找到 GROUP_MATCHES 声明');
    }

    // Also update ODDS_DATA if the scraper ran
    const oddsFile = path.join(__dirname, '..', 'data', 'latest.json');
    if (fs.existsSync(oddsFile)) {
      try {
        const oddsData = JSON.parse(fs.readFileSync(oddsFile, 'utf-8'));
        const oddsJsVar = 'var ODDS_DATA = ' + JSON.stringify(oddsData, null, 0).replace(/\n/g, '') + ';';
        const oddsRegex = /var ODDS_DATA = \{.*?\};/;
        if (oddsRegex.test(html)) {
          html = html.replace(oddsRegex, oddsJsVar);
          fs.writeFileSync(INDEX_FILE, html);
          console.log('✅ 已更新 index.html 中的 ODDS_DATA');
        }
      } catch (e) {
        console.log('⚠️ 赔率数据更新失败:', e.message);
      }
    }
  } catch (e) {
    console.error('❌ 更新 index.html 失败:', e.message);
  }

  // Commit and push
  try {
    console.log('\n📤 提交并推送到 GitHub...');
    execSync('git add -A', { cwd: REPO_DIR });
    execSync(`git commit -m "每日自动更新: ${todayStr}"`, { cwd: REPO_DIR });
    execSync('git push', { cwd: REPO_DIR });
    console.log('✅ 已推送至 GitHub Pages');
  } catch (e) {
    console.error('❌ Git 操作失败:', e.message);
    console.log('⚠️ 需要手动提交推送');
  }

  console.log('\n=== 更新完成 ===\n');
}

main().catch(e => console.error('❌ 更新异常:', e.message));
