#!/usr/bin/env python3
"""
基于 wc-2026.com 和 FOX Sports/FanDuel 数据更新赔率
更新时间: 2026-06-11 21:26 (北京时间)
"""

import json, re, copy

INDEX_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/docs/index.html"
APP_JS_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/docs/app.js"
DATA_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/data/latest.json"

# ===== Latest Odds Data (June 11, 2026 - wc-2026.com + FanDuel) =====
# Format: avgOdds (from wc-2026.com Pinnacle), bestOdds (from FanDuel decimal)
NEW_ODDS = [
    # Top tier
    {"name": "Spain", "avgOdds": 5.5, "bestOdds": 5.5, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "France", "avgOdds": 5.5, "bestOdds": 6.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "England", "avgOdds": 7.0, "bestOdds": 8.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Portugal", "avgOdds": 8.0, "bestOdds": 9.5, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Brazil", "avgOdds": 9.0, "bestOdds": 9.5, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Argentina", "avgOdds": 10.0, "bestOdds": 11.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Germany", "avgOdds": 15.0, "bestOdds": 14.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Netherlands", "avgOdds": 19.0, "bestOdds": 17.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Norway", "avgOdds": 29.0, "bestOdds": 34.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    {"name": "Belgium", "avgOdds": 29.0, "bestOdds": 23.0, "sources": ["Pinnacle", "William Hill", "FanDuel"]},
    # Second tier
    {"name": "Colombia", "avgOdds": 41.0, "bestOdds": 41.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Morocco", "avgOdds": 51.0, "bestOdds": 51.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Japan", "avgOdds": 51.0, "bestOdds": 51.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Mexico", "avgOdds": 51.0, "bestOdds": 51.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "USA", "avgOdds": 67.0, "bestOdds": 67.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Switzerland", "avgOdds": 51.0, "bestOdds": 51.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Uruguay", "avgOdds": 67.0, "bestOdds": 67.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Ecuador", "avgOdds": 81.0, "bestOdds": 81.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Turkey", "avgOdds": 81.0, "bestOdds": 81.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Croatia", "avgOdds": 81.0, "bestOdds": 81.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Senegal", "avgOdds": 101.0, "bestOdds": 101.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Austria", "avgOdds": 101.0, "bestOdds": 101.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Sweden", "avgOdds": 81.0, "bestOdds": 81.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Ivory Coast", "avgOdds": 151.0, "bestOdds": 151.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Scotland", "avgOdds": 151.0, "bestOdds": 151.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Canada", "avgOdds": 151.0, "bestOdds": 151.0, "sources": ["Pinnacle", "William Hill"]},
    {"name": "Czech Republic", "avgOdds": 251.0, "bestOdds": 251.0, "sources": ["Pinnacle"]},
    {"name": "Paraguay", "avgOdds": 151.0, "bestOdds": 151.0, "sources": ["Pinnacle"]},
    {"name": "Algeria", "avgOdds": 301.0, "bestOdds": 301.0, "sources": ["Pinnacle"]},
    {"name": "Egypt", "avgOdds": 301.0, "bestOdds": 301.0, "sources": ["Pinnacle"]},
    {"name": "South Korea", "avgOdds": 301.0, "bestOdds": 301.0, "sources": ["Pinnacle"]},
    {"name": "Australia", "avgOdds": 401.0, "bestOdds": 401.0, "sources": ["Pinnacle"]},
    {"name": "Bosnia", "avgOdds": 201.0, "bestOdds": 201.0, "sources": ["Pinnacle"]},
    {"name": "Ghana", "avgOdds": 251.0, "bestOdds": 251.0, "sources": ["Pinnacle"]},
    {"name": "Tunisia", "avgOdds": 501.0, "bestOdds": 501.0, "sources": ["Pinnacle"]},
    {"name": "Iran", "avgOdds": 501.0, "bestOdds": 501.0, "sources": ["Pinnacle"]},
    {"name": "DR Congo", "avgOdds": 751.0, "bestOdds": 751.0, "sources": ["Pinnacle"]},
    {"name": "South Africa", "avgOdds": 501.0, "bestOdds": 501.0, "sources": ["Pinnacle"]},
    {"name": "Saudi Arabia", "avgOdds": 1001.0, "bestOdds": 1001.0, "sources": ["Pinnacle"]},
    {"name": "Panama", "avgOdds": 1001.0, "bestOdds": 1001.0, "sources": ["Pinnacle"]},
    {"name": "Qatar", "avgOdds": 1001.0, "bestOdds": 1001.0, "sources": ["Pinnacle"]},
    {"name": "Cape Verde", "avgOdds": 1001.0, "bestOdds": 1001.0, "sources": ["Pinnacle"]},
    {"name": "Iraq", "avgOdds": 1001.0, "bestOdds": 1001.0, "sources": ["Pinnacle"]},
    {"name": "New Zealand", "avgOdds": 1501.0, "bestOdds": 1501.0, "sources": ["Pinnacle"]},
    {"name": "Uzbekistan", "avgOdds": 1501.0, "bestOdds": 1501.0, "sources": ["Pinnacle"]},
    {"name": "Curacao", "avgOdds": 2001.0, "bestOdds": 2001.0, "sources": ["Pinnacle"]},
    {"name": "Haiti", "avgOdds": 2001.0, "bestOdds": 2001.0, "sources": ["Pinnacle"]},
    {"name": "Jordan", "avgOdds": 2001.0, "bestOdds": 2001.0, "sources": ["Pinnacle"]},
]

# ===== Build history for the time series chart =====
# Keep existing history entries and add new ones
HISTORY = [
    {"date": "2026-05-01", "teams": [
        {"name": "France", "avgOdds": 5.5},
        {"name": "Argentina", "avgOdds": 6.0},
        {"name": "England", "avgOdds": 6.5},
        {"name": "Brazil", "avgOdds": 7.0},
        {"name": "Spain", "avgOdds": 9.0},
        {"name": "Germany", "avgOdds": 11.0},
        {"name": "Portugal", "avgOdds": 12.0},
        {"name": "Netherlands", "avgOdds": 17.0},
    ]},
    {"date": "2026-05-07", "teams": [
        {"name": "France", "avgOdds": 6.0},
        {"name": "Argentina", "avgOdds": 7.0},
        {"name": "Spain", "avgOdds": 7.0},
        {"name": "England", "avgOdds": 8.0},
        {"name": "Brazil", "avgOdds": 8.0},
        {"name": "Germany", "avgOdds": 11.0},
        {"name": "Portugal", "avgOdds": 13.0},
        {"name": "Netherlands", "avgOdds": 17.0},
    ]},
    {"date": "2026-05-24", "teams": [
        {"name": "France", "avgOdds": 6.0},
        {"name": "Spain", "avgOdds": 7.0},
        {"name": "Brazil", "avgOdds": 8.0},
        {"name": "Argentina", "avgOdds": 7.0},
        {"name": "England", "avgOdds": 8.0},
        {"name": "Germany", "avgOdds": 11.0},
        {"name": "Portugal", "avgOdds": 13.0},
        {"name": "Netherlands", "avgOdds": 17.0},
    ]},
    {"date": "2026-06-11", "teams": [
        {"name": "Spain", "avgOdds": 5.5},
        {"name": "France", "avgOdds": 5.5},
        {"name": "England", "avgOdds": 7.0},
        {"name": "Portugal", "avgOdds": 8.0},
        {"name": "Brazil", "avgOdds": 9.0},
        {"name": "Argentina", "avgOdds": 10.0},
        {"name": "Germany", "avgOdds": 15.0},
        {"name": "Netherlands", "avgOdds": 19.0},
    ]},
]

# ===== Compute probabilities from odds =====
TEAMS = []
for o in NEW_ODDS:
    team = dict(o)
    team["prob"] = round(1 / team["avgOdds"], 4)
    team["note"] = ""
    TEAMS.append(team)

# ===== Build the complete data object =====
UPDATED = "2026-06-11 21:26 (CST)"
ODDS_DATA = {"updated": UPDATED, "teams": TEAMS, "history": HISTORY, "note": "来源: Pinnacle/William Hill/FanDuel (wc-2026.com + FOX Sports)"}

print(f"✅ 构建新赔率数据: {len(TEAMS)} 支球队, {len(HISTORY)} 条历史记录")

# ===== Update data/latest.json =====
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(ODDS_DATA, f, ensure_ascii=False, indent=2)
print("✅ 已保存 data/latest.json")

# ===== Update docs/index.html =====
with open(INDEX_FILE, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace ODDS_DATA
odds_js = 'var ODDS_DATA = ' + json.dumps(ODDS_DATA, ensure_ascii=False, separators=(',', ':')) + ';'
html = re.sub(r'var ODDS_DATA = \{.*?\};', odds_js, html, count=1)

# Also update PLAYER_DATA (Golden Boot + Golden Ball) based on wc-2026.com
# Latest Golden Boot odds from wc-2026.com
PLAYER_DATA = {
    "updated": "2026-06-11",
    "goldenBoot": [
        {"name": "Kylian Mbappé", "country": "France", "avgOdds": 6.5, "sources": ["Pinnacle", "William Hill"], "reason": "世界杯射手王热门"},
        {"name": "Harry Kane", "country": "England", "avgOdds": 7.0, "sources": ["Pinnacle", "William Hill"], "reason": "英格兰锋线核心"},
        {"name": "Mikel Oyarzabal", "country": "Spain", "avgOdds": 12.0, "sources": ["Pinnacle"], "reason": "西班牙进攻核心"},
        {"name": "Erling Haaland", "country": "Norway", "avgOdds": 15.0, "sources": ["Pinnacle", "William Hill"], "reason": "挪威超级前锋"},
        {"name": "Lionel Messi", "country": "Argentina", "avgOdds": 13.0, "sources": ["Pinnacle"], "reason": "卫冕冠军传奇"},
        {"name": "Cristiano Ronaldo", "country": "Portugal", "avgOdds": 21.0, "sources": ["Pinnacle"], "reason": "葡萄牙传奇"},
        {"name": "Lamine Yamal", "country": "Spain", "avgOdds": 15.0, "sources": ["Pinnacle"], "reason": "西班牙天才边锋"},
        {"name": "Julián Álvarez", "country": "Argentina", "avgOdds": 21.0, "sources": ["Pinnacle"], "reason": "阿根廷猎豹"},
        {"name": "Kai Havertz", "country": "Germany", "avgOdds": 26.0, "sources": ["Pinnacle"], "reason": "德国攻击手"},
        {"name": "Raphinha", "country": "Brazil", "avgOdds": 26.0, "sources": ["Pinnacle"], "reason": "巴西边路爆点"},
    ],
    "goldenBall": [
        {"name": "Kylian Mbappé", "country": "France", "avgOdds": 13.0, "sources": ["Pinnacle", "William Hill"], "reason": "法国绝对核心"},
        {"name": "Jude Bellingham", "country": "England", "avgOdds": 15.0, "sources": ["Pinnacle"], "reason": "英格兰中场引擎"},
        {"name": "Lamine Yamal", "country": "Spain", "avgOdds": 17.0, "sources": ["Pinnacle"], "reason": "西班牙天才少年"},
        {"name": "Pedri", "country": "Spain", "avgOdds": 21.0, "sources": ["Pinnacle"], "reason": "西班牙中场大脑"},
        {"name": "Lionel Messi", "country": "Argentina", "avgOdds": 21.0, "sources": ["Pinnacle"], "reason": "卫冕冠军灵魂"},
        {"name": "Erling Haaland", "country": "Norway", "avgOdds": 26.0, "sources": ["Pinnacle"], "reason": "挪威核武器"},
        {"name": "Cristiano Ronaldo", "country": "Portugal", "avgOdds": 26.0, "sources": ["Pinnacle"], "reason": "葡萄牙传奇最后一舞"},
        {"name": "Vitinha", "country": "Portugal", "avgOdds": 34.0, "sources": ["Pinnacle"], "reason": "葡萄牙中场指挥官"},
        {"name": "Rodri", "country": "Spain", "avgOdds": 34.0, "sources": ["Pinnacle"], "reason": "金球先生坐镇中场"},
        {"name": "Florian Wirtz", "country": "Germany", "avgOdds": 41.0, "sources": ["Pinnacle"], "reason": "德国创造核心"},
    ],
}
player_js = 'var PLAYER_DATA = ' + json.dumps(PLAYER_DATA, ensure_ascii=False, separators=(',', ':')) + ';'
html = re.sub(r'var PLAYER_DATA = \{.*?\};', player_js, html, count=1)

with open(INDEX_FILE, 'w', encoding='utf-8') as f:
    f.write(html)
print("✅ 已更新 docs/index.html (ODDS_DATA + PLAYER_DATA)")

# ===== Update docs/app.js =====
with open(APP_JS_FILE, 'r', encoding='utf-8') as f:
    app_js = f.read()

# Replace ODDS_DATA in app.js
app_js = re.sub(r'const ODDS_DATA = \{.*?\};', 'const ODDS_DATA = ' + json.dumps(ODDS_DATA, ensure_ascii=False, separators=(',', ':')) + ';', app_js, count=1)

with open(APP_JS_FILE, 'w', encoding='utf-8') as f:
    f.write(app_js)
print("✅ 已更新 docs/app.js")

# ===== Print summary of differences =====
OLD_DATA_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/data/latest.json.bak"
print(f"\n📊 赔率变化摘要 (从 5月24日 → 6月11日):")
print(f"{'球队':<12} {'旧赔率':>6} {'新赔率':>6} {'变化':>6}")
print("-" * 34)
# Read old data
try:
    with open(OLD_DATA_FILE) as f:
        old_data = json.load(f)
        old_odds = {t["name"]: t["avgOdds"] for t in old_data["teams"]}
        for t in TEAMS[:15]:
            old = old_odds.get(t["name"], "-")
            change = round(t["avgOdds"] - old, 1) if isinstance(old, (int, float)) else "-"
            change_str = f"{change:+.1f}" if isinstance(change, (int, float)) else "-"
            print(f"{t['name']:<12} {str(old):>6} {str(t['avgOdds']):>6} {change_str:>6}")
except:
    print("(无法读取旧数据做对比)")

print(f"\n✅ 所有数据已更新完成！")
