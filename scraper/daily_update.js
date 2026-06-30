#!/usr/bin/env node
/**
 * 每日自动运行 (原定13:00 CST)
 * 从 FIFA API (2026世界杯) 抓取比赛结果数据
 * 更新 data/match_schedule.json 和 docs/index.html 中的 GROUP_MATCHES
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '..', 'data', 'match_schedule.json');
const INDEX_FILE = path.join(__dirname, '..', 'docs', 'index.html');
const REPO_DIR = path.join(__dirname, '..');

const FIFA_API = 'https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200';

// ===== Helpers =====
function tfmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTeamName(teamObj) {
  if (!teamObj || !teamObj.TeamName) return 'Unknown';
  return teamObj.TeamName[0]?.Description || 'Unknown';
}

function getStageName(r) {
  return r.StageName?.[0]?.Description || '';
}

function getGroupName(r) {
  return r.GroupName?.[0]?.Description || '';
}

function statusText(statusCode) {
  const map = { 0: 'finished', 1: 'upcoming', 2: 'live', 3: 'finished' };
  return map[statusCode] || 'upcoming';
}

// ===== Build match schedule from FIFA API data =====
function buildSchedule(fifaResults) {
  // Determine all groups from first-stage matches
  const groups = {};
  const firstStageMatches = fifaResults.filter(r => (getStageName(r) === 'First Stage' || getStageName(r) === 'First stage') && r.Home && r.Away);
  const knockoutMatches = fifaResults.filter(r => getStageName(r) !== 'First Stage' && getStageName(r) !== 'First stage' && r.Home && r.Away);

  for (const r of firstStageMatches) {
    const gname = getGroupName(r);
    if (!gname) continue;
    if (!groups[gname]) groups[gname] = { teams: new Set(), matches: [] };

    const home = getTeamName(r.Home);
    const away = getTeamName(r.Away);
    groups[gname].teams.add(home);
    groups[gname].teams.add(away);

    const hs = r.HomeTeamScore;
    const as_ = r.AwayTeamScore;
    const statusVal = statusText(r.MatchStatus);

    groups[gname].matches.push({
      id: r.IdMatch,
      date: (r.LocalDate || r.Date || '').slice(0, 10),
      team1: home,
      team2: away,
      score1: hs,
      score2: as_,
      status: statusVal,
      penalty1: r.HomeTeamPenaltyScore ?? undefined,
      penalty2: r.AwayTeamPenaltyScore ?? undefined,
    });
  }

  // Convert sets to arrays
  for (const g of Object.keys(groups)) {
    groups[g].teams = [...groups[g].teams];
  }

  // Build knockout bracket
  const knockout = {};
  for (const r of knockoutMatches) {
    const stage = getStageName(r);
    if (!knockout[stage]) knockout[stage] = [];
    const hs = r.HomeTeamScore;
    const as_ = r.AwayTeamScore;
    knockout[stage].push({
      id: r.IdMatch,
      date: (r.LocalDate || r.Date || '').slice(0, 10),
      team1: getTeamName(r.Home),
      team2: getTeamName(r.Away),
      score1: hs,
      score2: as_,
      status: statusText(r.MatchStatus),
      penalty1: r.HomeTeamPenaltyScore ?? undefined,
      penalty2: r.AwayTeamPenaltyScore ?? undefined,
    });
  }

  return {
    updated: tfmt(new Date()),
    groups,
    knockout,
    matchCount: fifaResults.length,
  };
}

// ===== Update index.html GROUP_MATCHES =====
function updateIndexHtml(data) {
  const html = fs.readFileSync(INDEX_FILE, 'utf-8');
  const jsVar = 'var GROUP_MATCHES = ' + JSON.stringify(data, null, 0).replace(/\n/g, '') + ';';

  // Match multi-line GROUP_MATCHES declaration
  const regex = /var GROUP_MATCHES = \{[\s\S]*?\};/;
  if (regex.test(html)) {
    const updated = html.replace(regex, jsVar);
    fs.writeFileSync(INDEX_FILE, updated);
    console.log('✅ 已更新 index.html 中的 GROUP_MATCHES');
    return true;
  } else {
    console.error('❌ 未找到 GROUP_MATCHES 声明');
    return false;
  }
}

// ===== Main =====
async function main() {
  const todayStr = tfmt(new Date());
  console.log(`\n=== 世界杯数据更新 (${todayStr}) ===\n`);

  console.log('📡 正在从 FIFA API 获取数据...');
  let fifaData;
  try {
    const resp = await fetch(FIFA_API, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    fifaData = await resp.json();
  } catch (e) {
    console.error(`❌ FIFA API 获取失败: ${e.message}`);
    console.log('⚠️ 保持现有数据不变');
    return;
  }

  const results = fifaData.Results || fifaData.results || [];
  if (!results.length) {
    console.log('⚠️ FIFA API 返回空数据');
    return;
  }
  console.log(`✅ 获取到 ${results.length} 场比赛数据`);

  // Build structured data
  const schedule = buildSchedule(results);

  // Count finished vs upcoming
  let finished = 0, upcoming = 0;
  for (const r of results) {
    if (r.HomeTeamScore != null) finished++;
    else upcoming++;
  }
  console.log(`📊 已完赛: ${finished} / 未开始: ${upcoming}`);

  // Save match_schedule.json
  fs.writeFileSync(DATA_FILE, JSON.stringify(schedule, null, 2));
  console.log('✅ 已保存 data/match_schedule.json');

  // Update index.html GROUP_MATCHES
  updateIndexHtml(schedule);

  // Try to update ODDS_DATA if latest.json exists
  const oddsFile = path.join(__dirname, '..', 'data', 'latest.json');
  if (fs.existsSync(oddsFile)) {
    try {
      let html = fs.readFileSync(INDEX_FILE, 'utf-8');
      const oddsData = JSON.parse(fs.readFileSync(oddsFile, 'utf-8'));
      const oddsJsVar = 'var ODDS_DATA = ' + JSON.stringify(oddsData, null, 0).replace(/\n/g, '') + ';';
      const oddsRegex = /var ODDS_DATA = \{[\s\S]*?\};/;
      if (oddsRegex.test(html)) {
        html = html.replace(oddsRegex, oddsJsVar);
        fs.writeFileSync(INDEX_FILE, html);
        console.log('✅ 已更新 index.html 中的 ODDS_DATA');
      }
    } catch (e) {
      console.log('⚠️ 赔率数据更新失败:', e.message);
    }
  }

  // Commit and push
  try {
    console.log('\n📤 提交并推送到 GitHub...');
    execSync('git add -A', { cwd: REPO_DIR, stdio: 'pipe' });
    execSync(`git commit -m "每日自动更新: ${todayStr}"`, { cwd: REPO_DIR, stdio: 'pipe' });
    execSync('git push', { cwd: REPO_DIR, stdio: 'pipe' });
    console.log('✅ 已推送至 GitHub Pages');
  } catch (e) {
    const msg = e.stderr?.toString() || e.message;
    if (msg.includes('nothing to commit')) {
      console.log('ℹ️ 无新变更，跳过提交');
    } else if (msg.includes('Could not read from remote') || msg.includes('Couldn\'t connect')) {
      console.log('⚠️ GitHub 连接失败（网络问题），稍后重试');
    } else {
      console.error('❌ Git 操作失败:', msg);
      console.log('⚠️ 需要手动提交推送');
    }
  }

  console.log('\n=== 更新完成 ===\n');
}

main().catch(e => console.error('❌ 更新异常:', e.message));
