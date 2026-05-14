/**
 * 2026 世界杯夺冠概率看板
 * 数据来源：综合多家博彩赔率
 */

// 国旗表情映射（完整 48 队）
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
};

// 中文队名映射
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
};

let barChart = null;
let trendChart = null;

// ========== 数据加载 ==========
async function loadData() {
  try {
    const resp = await fetch('./data/latest.json');
    if (!resp.ok) throw new Error('数据未就绪');
    return await resp.json();
  } catch (e) {
    console.warn('无法加载数据，使用默认样本', e);
    return getDefaultData();
  }
}

function getDefaultData() {
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
  // 赔率概率：1/avgOdds
  const oddsProb = 1 / team.avgOdds;
  // 综合概率 = 赔率概率 * 0.6 + 模型概率 * 0.4
  return oddsProb * 0.6 + (team.modelProb || 0) * 0.4;
}

function normalizeProbs(teams) {
  // 计算综合概率并归一化（总和为 100%）
  const raw = teams.map(t => ({
    ...t,
    compositeProb: computeComposite(t, teams)
  }));
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

// ========== 更新徽标 ==========
function updateBadge(updated) {
  document.getElementById('updateBadge').textContent = `更新于：${updated}`;
}

// ========== 主入口 ==========
async function main() {
  const rawData = await loadData();
  // 确保有历史数据
  if (rawData.history && !Array.isArray(rawData.history)) {
    rawData.history = [];
  }
  const teams = normalizeProbs(rawData.teams || []);

  updateBadge(rawData.updated || '未知');
  renderCards(teams);
  renderBarChart(teams);

  // 排序切换事件
  document.getElementById('sortSelect').addEventListener('change', () => renderCards(teams));

  // 如果有历史数据，渲染趋势图
  if (rawData.history && rawData.history.length > 0) {
    renderTrendChart(rawData.history);
  }
}

document.addEventListener('DOMContentLoaded', main);
