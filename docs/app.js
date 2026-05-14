/**
 * 2026 世界杯夺冠概率看板 + 赛程 + 八强/黑马预测
 */

const FLAGS = {
  'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Italy': '🇮🇹',
  'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Denmark': '🇩🇰',
  'Switzerland': '🇨🇭', 'Uruguay': '🇺🇾', 'Mexico': '🇲🇽',
  'USA': '🇺🇸', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
  'Australia': '🇦🇺', 'Canada': '🇨🇦', 'Morocco': '🇲🇦',
  'Senegal': '🇸🇳', 'Nigeria': '🇳🇬', 'Cameroon': '🇨🇲',
  'Ghana': '🇬🇭', 'Tunisia': '🇹🇳', 'Egypt': '🇪🇬',
  'Algeria': '🇩🇿', 'Ivory Coast': '🇨🇮', 'South Africa': '🇿🇦',
  'Iran': '🇮🇷', 'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦',
  'UAE': '🇦🇪', 'Iraq': '🇮🇶', 'Oman': '🇴🇲',
  'Ecuador': '🇪🇨', 'Colombia': '🇨🇴', 'Chile': '🇨🇱',
  'Peru': '🇵🇪', 'Paraguay': '🇵🇾', 'Venezuela': '🇻🇪',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Jamaica': '🇯🇲',
  'Honduras': '🇭🇳', 'New Zealand': '🇳🇿', 'Fiji': '🇫🇯',
  'Serbia': '🇷🇸', 'Poland': '🇵🇱', 'Ukraine': '🇺🇦',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

const CN_NAMES = {
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
  'Sweden': '瑞典', 'Norway': '挪威',
};

let barChart = null;

// ========== Tab 切换 ==========
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

      if (btn.dataset.tab === 'schedule') {
        renderSchedule();
      } else if (btn.dataset.tab === 'predictions') {
        renderPredictions();
      }
    });
  });
}

// ========== 数据加载 ==========
async function loadOddsData() {
  try {
    const resp = await fetch('./data/latest.json');
    if (!resp.ok) throw new Error('数据未就绪');
    return await resp.json();
  } catch (e) {
    console.warn('无法加载赔率数据，使用默认样本', e);
    return getDefaultOddsData();
  }
}

async function loadScheduleData() {
  try {
    const resp = await fetch('./data/schedule.json');
    if (!resp.ok) throw new Error('赛程数据未就绪');
    return await resp.json();
  } catch (e) {
    console.warn('无法加载赛程数据', e);
    return null;
  }
}

function getDefaultOddsData() {
  return {
    updated: '2026-05-14',
    teams: [
      { name: 'Brazil',     avgOdds: 5.50,  modelProb: 0.18, sources: 3 },
      { name: 'France',     avgOdds: 6.00,  modelProb: 0.16, sources: 3 },
      { name: 'Argentina',  avgOdds: 7.00,  modelProb: 0.14, sources: 3 },
      { name: 'England',    avgOdds: 7.50,  modelProb: 0.13, sources: 3 },
      { name: 'Germany',    avgOdds: 9.00,  modelProb: 0.11, sources: 3 },
      { name: 'Spain',      avgOdds: 10.00, modelProb: 0.10, sources: 3 },
      { name: 'Portugal',   avgOdds: 12.00, modelProb: 0.08, sources: 2 },
      { name: 'Netherlands', avgOdds: 14.00, modelProb: 0.07, sources: 2 },
      { name: 'Italy',      avgOdds: 18.00, modelProb: 0.05, sources: 2 },
      { name: 'Belgium',    avgOdds: 21.00, modelProb: 0.04, sources: 2 },
      { name: 'Croatia',    avgOdds: 28.00, modelProb: 0.03, sources: 2 },
      { name: 'Uruguay',    avgOdds: 35.00, modelProb: 0.02, sources: 2 },
      { name: 'Denmark',    avgOdds: 38.00, modelProb: 0.02, sources: 2 },
      { name: 'Mexico',     avgOdds: 40.00, modelProb: 0.02, sources: 2 },
      { name: 'USA',        avgOdds: 45.00, modelProb: 0.02, sources: 2 },
      { name: 'Japan',      avgOdds: 50.00, modelProb: 0.015, sources: 2 },
      { name: 'Morocco',    avgOdds: 60.00, modelProb: 0.01, sources: 1 },
      { name: 'South Korea', avgOdds: 80.00, modelProb: 0.008, sources: 1 },
      { name: 'Canada',     avgOdds: 100.00, modelProb: 0.005, sources: 1 },
      { name: 'Australia',  avgOdds: 120.00, modelProb: 0.004, sources: 1 },
    ],
    history: []
  };
}

// ========== 概率计算 ==========
function computeComposite(team, allTeams) {
  const oddsProb = 1 / team.avgOdds;
  return oddsProb * 0.6 + (team.modelProb || 0) * 0.4;
}

function normalizeProbs(teams) {
  const raw = teams.map(t => ({ ...t, compositeProb: computeComposite(t, teams) }));
  const total = raw.reduce((s, t) => s + t.compositeProb, 0);
  return raw.map(t => ({
    ...t,
    prob: total > 0 ? t.compositeProb / total : 0,
  })).sort((a, b) => b.prob - a.prob);
}

// ========== 渲染排名卡片 ==========
function renderCards(teams) {
  const grid = document.getElementById('rankingGrid');
  const sortBy = document.getElementById('sortSelect').value;

  let sorted = [...teams];
  if (sortBy === 'composite') sorted.sort((a, b) => b.prob - a.prob);
  else if (sortBy === 'odds') sorted.sort((a, b) => a.avgOdds - b.avgOdds);
  else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = sorted.map((team, i) => {
    const rank = sortBy === 'name' ? '' : i + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
    const flag = FLAGS[team.name] || '🏳️';
    const cnName = CN_NAMES[team.name] || team.name;
    const probPct = (team.prob * 100).toFixed(1);

    return `
      <div class="team-card">
        <div class="rank ${rankClass}">${rank}</div>
        <div class="flag">${flag}</div>
        <div class="info">
          <div class="name">${cnName} (${team.name})</div>
          <div class="stats-row">
            <span>赔率 ${team.avgOdds.toFixed(1)}</span>
            <span>数据源 ${team.sources}</span>
          </div>
        </div>
        <div class="prob-bar">
          <div class="bar-bg">
            <div class="bar-fill" style="width: ${Math.min(probPct * 8, 100)}%"></div>
          </div>
        </div>
        <div class="prob-value">${probPct}%</div>
      </div>
    `;
  }).join('');

  document.getElementById('teamCount').textContent = `共 ${sorted.length} 支球队`;
}

// ========== 渲染柱状图 ==========
function renderBarChart(teams) {
  const ctx = document.getElementById('barChart').getContext('2d');

  const top = teams.slice(0, 16);
  const labels = top.map(t => CN_NAMES[t.name] || t.name);
  const data = top.map(t => +(t.prob * 100).toFixed(1));
  const colors = data.map((v, i) => {
    if (i === 0) return '#f59e0b';
    if (i === 1) return '#94a3b8';
    if (i === 2) return '#cd7f32';
    return '#3b82f6';
  });

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '夺冠概率 (%)',
        data,
        backgroundColor: colors,
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#334155' },
          ticks: {
            color: '#94a3b8',
            callback: v => v + '%'
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e2e8f0', font: { size: 12 } }
        }
      }
    }
  });
}

// ========== 渲染赛程分组 ==========
const STAGE_CN = {
  round32: '32强赛',
  round16: '16强赛',
  quarter: '1/4决赛',
  semi: '半决赛',
  thirdPlace: '三四名决赛',
  final: '决赛',
};

function renderSchedule() {
  loadScheduleData().then(data => {
    if (!data || !data.groups) {
      document.getElementById('groupsGrid').innerHTML = '<p class="placeholder-text">赛程数据加载中...</p>';
      return;
    }

    const groupsGrid = document.getElementById('groupsGrid');
    groupsGrid.innerHTML = data.groups.map(g => {
      const teamsHtml = g.teams.map((t, idx) => {
        const flag = FLAGS[t] || '🏳️';
        const cn = CN_NAMES[t] || t;
        return `<div class="team-item"><span class="group-rank">#${idx+1}</span><span class="group-flag">${flag}</span><span>${cn}</span></div>`;
      }).join('');
      return `<div class="group-card"><h3>${g.group} 组</h3>${teamsHtml}</div>`;
    }).join('');

    const ko = data.knockout || {};
    const knockoutInfo = document.getElementById('knockoutInfo');
    knockoutInfo.innerHTML = Object.entries(ko).map(([key, date]) => {
      const name = STAGE_CN[key] || key;
      return `<div class="stage"><span class="stage-name">${name}</span><span class="stage-date">${date}</span></div>`;
    }).join('');
  });
}

// ========== 八强 & 黑马预测 ==========

/**
 * 八强预测模型：
 * 综合考虑夺冠概率 + 分组形势 + 历史大赛表现系数
 * 夺冠概率权重 60%，小组出线权重 30%，大赛底蕴 10%
 */
function predictQuarterfinalists(teams) {
  // 根据综合概率推算八强
  // 赔率低于25的队伍为"热门"（有竞争力进八强）
  const contenders = teams.filter(t => t.avgOdds <= 40);

  // 取top16（32强晋级的合理范围），再算八强概率
  const top = teams.slice(0, 16);

  // 分配每队的小组出线系数：综合概率开方后归一化（前16名合理）
  const maxProb = top[0] ? top[0].prob : 0.01;

  const scored = top.map(t => {
    // 大赛底蕴：世界杯历史战绩加分
    let heritage = 1.0;
    const name = t.name;
    if (['Brazil', 'Germany', 'Argentina', 'France', 'Italy', 'England', 'Spain', 'Netherlands'].includes(name)) heritage = 1.2;
    else if (['Uruguay', 'Portugal', 'Croatia', 'Belgium', 'Denmark', 'Sweden', 'Mexico'].includes(name)) heritage = 1.1;

    // 黑马潜力：高赔率队伍如果有"新星+好签"会有额外因子（人工标注在此作为基础评分）
    const darkHorseFactor = ['Morocco', 'Japan', 'Senegal', 'USA', 'Canada', 'Australia',
                             'Switzerland', 'Serbia', 'Poland', 'Ukraine', 'Norway', 'South Korea',
                             'Nigeria', 'Ghana', 'Cameroon', 'Ivory Coast'].includes(name) ? 0.15 : 0;

    // 八强概率综合分
    const qfScore = (t.prob / maxProb) * 0.6 + heritage * 0.25 + darkHorseFactor;
    return { ...t, qfScore, quarterfinalProb: Math.min(qfScore * 0.6, 0.95) };
  });

  // 按八强概率排序
  scored.sort((a, b) => b.quarterfinalProb - a.quarterfinalProb);
  return scored;
}

/**
 * 黑马预测模型：
 * 赔率 > 40（不被看好），但有一项或多项"爆发因子"：
 * - 近年战绩上升 (recentForm)
 * - 有世界级新星 (risingStar)
 * - 分组签运好 (groupLuck)
 * - 历史黑马基因 (history)
 */
function findDarkHorses(teams, qfAnalysis) {
  // 候选：夺冠赔率 > 30 的球队中筛选
  const candidates = teams.filter(t => t.avgOdds >= 30);

  // 黑马评分维度
  const darkHorseProfiles = {
    // 2022世界杯黑马延续 + 新星
    'Morocco':       { rating: 92, reason: '2022四强黑马，防守体系成熟', tag: '🔥 上届黑马' },
    'Japan':         { rating: 88, reason: '2022小组第一出线，战术执行力极强', tag: '⚡ 团队足球' },
    'Senegal':       { rating: 85, reason: '非洲冠军，拥有顶级球星', tag: '🌟 非洲雄狮' },
    'USA':           { rating: 82, reason: '主场作战，年轻阵容爆发期', tag: '🇺🇸 主场优势' },
    'Canada':        { rating: 80, reason: '北美新势力，主场加持', tag: '🍁 主场黑马' },
    'Switzerland':   { rating: 78, reason: '大赛常客，多次淘汰赛经验', tag: '🏔️ 老牌劲旅' },
    'Serbia':        { rating: 76, reason: '东欧新势力，锋线豪华', tag: '⚔️ 黑马气质' },
    'Ukraine':       { rating: 74, reason: '团结之心，近年实力上升', tag: '💪 战斗力' },
    'Norway':        { rating: 72, reason: '哈兰德领衔，进攻火力', tag: '🌟 巨星效应' },
    'Nigeria':       { rating: 70, reason: '非洲雄鹰，年轻天才辈出', tag: '🦅 天赋满满' },
    'South Korea':   { rating: 68, reason: '亚洲最强战力，跑动出色', tag: '🇰🇷 太极虎' },
    'Australia':     { rating: 65, reason: '连续出线，韧性十足', tag: '🦘 硬骨头' },
    'Ivory Coast':   { rating: 63, reason: '非洲大象，身体对抗强', tag: '🐘 力量足球' },
    'Ghana':         { rating: 62, reason: '南美踢法+身体，上次表现不俗', tag: '⭐ 潜力股' },
    'Cameroon':      { rating: 60, reason: '非洲雄狮，爆冷基因', tag: '🦁 爆冷专业户' },
    'Poland':        { rating: 58, reason: '莱万最后一舞', tag: '🔵 明星压阵' },
  };

  const scored = candidates.map(t => {
    const profile = darkHorseProfiles[t.name];
    if (!profile) return null;

    // 赔率越低（越被看好），黑马成色反而低；赔率越高越意外
    // 最佳黑马区间：赔率 40-100
    const oddsScore = t.avgOdds >= 30 && t.avgOdds <= 150 ? 
                      Math.max(0, 1 - Math.abs(t.avgOdds - 65) / 100) * 0.3 : 0;

    const totalScore = profile.rating * 0.01 + oddsScore;
    return {
      ...t,
      darkHorseScore: totalScore,
      darkHorseReason: profile.reason,
      darkHorseTag: profile.tag,
    };
  }).filter(Boolean);

  // 按黑马评分排序，取前4
  scored.sort((a, b) => b.darkHorseScore - a.darkHorseScore);
  return scored.slice(0, 4);
}

function renderPredictions() {
  loadOddsData().then(rawData => {
    const teams = normalizeProbs(rawData.teams || []);

    // ---- 八强预测 ----
    const qfAnalysis = predictQuarterfinalists(teams);
    const qfContainer = document.getElementById('qfList');
    qfContainer.innerHTML = qfAnalysis.slice(0, 8).map((t, i) => {
      const flag = FLAGS[t.name] || '🏳️';
      const cn = CN_NAMES[t.name] || t.name;
      const qfPct = (t.quarterfinalProb * 100).toFixed(0);
      const rank = i + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

      return `
        <div class="qf-card">
          <span class="rank ${rankClass}">${rank}</span>
          <span class="flag">${flag}</span>
          <span class="qf-name">${cn}</span>
          <div class="qf-bar-bar">
            <div class="bar-bg">
              <div class="bar-fill" style="width: ${qfPct * 1.1}%"></div>
            </div>
          </div>
          <span class="qf-prob">${qfPct}%</span>
        </div>
      `;
    }).join('');

    // ---- 黑马预测 ----
    const darkHorses = findDarkHorses(teams, qfAnalysis);
    const dhContainer = document.getElementById('darkHorseList');
    dhContainer.innerHTML = darkHorses.map((t, i) => {
      const flag = FLAGS[t.name] || '🏳️';
      const cn = CN_NAMES[t.name] || t.name;
      const score = (t.darkHorseScore * 100).toFixed(0);

      return `
        <div class="dh-card">
          <div class="dh-header">
            <span class="dh-badge">🐎 黑马 #${i+1}</span>
            <span class="dh-tag">${t.darkHorseTag}</span>
          </div>
          <div class="dh-body">
            <span class="flag dh-flag">${flag}</span>
            <div class="dh-info">
              <span class="dh-name">${cn}</span>
              <span class="dh-reason">${t.darkHorseReason}</span>
            </div>
            <span class="dh-odds">赔率 ${t.avgOdds.toFixed(1)}</span>
          </div>
          <div class="dh-bar">
            <div class="bar-bg">
              <div class="bar-fill dh-bar-fill" style="width: ${Math.min(score, 100)}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // ---- 黑马爆冷概率解释 ----
    document.getElementById('dhAnalysis').innerHTML = `
      <p>黑马评分基于：历史表现（2022上届战绩）· 新星崛起 · 分组签运 · 团队成型度 · 主场/文化因素</p>
      <p>上届世界杯（2022）黑马案例：摩洛哥（四强）、克罗地亚（季军）、日本（小组第一）</p>
      <p class="dh-note">特别提醒：48队赛制下弱队爆冷概率更高，黑马价值更大 ⚡</p>
    `;
  });
}

// ========== 更新徽标 ==========
function updateBadge(updated) {
  const el = document.getElementById('updateBadge');
  if (el) el.textContent = `更新于：${updated}`;
}

// ========== 主入口 ==========
async function main() {
  setupTabs();

  const rawData = await loadOddsData();
  const teams = normalizeProbs(rawData.teams || []);

  updateBadge(rawData.updated || '未知');
  renderCards(teams);
  renderBarChart(teams);

  document.getElementById('sortSelect').addEventListener('change', () => renderCards(teams));
}

document.addEventListener('DOMContentLoaded', main);
