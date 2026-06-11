#!/usr/bin/env python3
"""
Inject GROUP_MATCHES data, tab, rendering JS, and CSS into index.html
"""

import json, re

DATA_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/data/match_schedule.json"
INDEX_FILE = "/Users/mac/.openclaw/workspace/world-cup-dashboard/docs/index.html"

with open(DATA_FILE) as f:
    match_data = json.load(f)

with open(INDEX_FILE, 'r') as f:
    html = f.read()

# =============================================
# 1. Inject GROUP_MATCHES var declaration
#    Place it right after var CN = ...;
# =============================================
match_js_var = 'var GROUP_MATCHES = ' + json.dumps(match_data, ensure_ascii=False, separators=(',', ':')) + ';\n\n'

# Find where to insert - right after CN decl (before the blank line before FLAGS)
insert_point = html.find('var FLAGS')
if insert_point == -1:
    print("ERROR: Could not find 'var FLAGS'")
    exit(1)

# Find the end of the CN line and insert before FLAGS
before = html[:insert_point]
after = html[insert_point:]
html = before + match_js_var + after
print("✅ Injected GROUP_MATCHES var")

# =============================================
# 2. Add tab button
# =============================================
# Find the closing </nav> tag and insert before it
nav_end = html.find('</nav>')
if nav_end == -1:
    print("ERROR: Could not find </nav>")
    exit(1)

tab_button = '<button class="tab-btn" data-tab="matches">📋 小组赛程</button>\n'
html = html[:nav_end] + tab_button + html[nav_end:]
print("✅ Injected tab button")

# =============================================
# 3. Add tab-content section (just before <footer>)
# =============================================
tab_content = '''<main id="tab-matches" class="tab-content">
<section id="matchSection"><h2>📋 小组赛对阵结果</h2>
<p class="section-note">每组4队单循环 · 前两名+8个最佳第三名晋级32强 · 每日13:00更新比分</p>
<div id="matchResultsContainer"><p class="placeholder-text">加载小组赛数据...</p></div></section>
</main>
'''

footer_pos = html.find('<footer>')
if footer_pos == -1:
    print("ERROR: Could not find <footer>")
    exit(1)

# Insert after the last </main> and before footer
# Find the closing </main> that precedes <footer>
last_main_close = html.rfind('</main>', 0, footer_pos)
if last_main_close != -1:
    # Insert after the </main> tag
    insert_after = last_main_close + len('</main>\n')
    html = html[:insert_after] + '\n' + tab_content + html[insert_after:]
else:
    # Fallback: insert before footer
    html = html[:footer_pos] + tab_content + html[footer_pos:]
print("✅ Injected tab content")

# =============================================
# 4. Add rendering JS in the first <script> block
#    (after the FLAGS/CN/closing brace section, before "// ===== Helper functions")
# =============================================
match_render_js = '''
// ===== Group Matches =====
(function() {
  var d = GROUP_MATCHES;
  var c = $id('matchResultsContainer');
  if (!c) return;
  if (!d || !d.groups) { c.innerHTML = '<p class="placeholder-text">小组赛数据加载中...</p>'; return; }
  
  var gt = d.groups;
  var keys = Object.keys(gt).sort();
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  
  var h = '';
  for (var gi = 0; gi < keys.length; gi++) {
    var gk = keys[gi];
    var gr = gt[gk];
    var teams = gr.teams;
    var matches = gr.matches;
    
    // Compute standings
    var st = {};
    for (var ti = 0; ti < teams.length; ti++) {
      st[teams[ti]] = {pts:0,gp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0};
    }
    for (var mi = 0; mi < matches.length; mi++) {
      var m = matches[mi];
      if (m.status !== 'finished' || m.score1 === null) continue;
      var t1 = m.team1, t2 = m.team2;
      st[t1].gp++; st[t2].gp++;
      st[t1].gf += m.score1; st[t1].ga += m.score2;
      st[t2].gf += m.score2; st[t2].ga += m.score1;
      if (m.score1 > m.score2) { st[t1].w++; st[t1].pts += 3; st[t2].l++; }
      else if (m.score1 < m.score2) { st[t2].w++; st[t2].pts += 3; st[t1].l++; }
      else { st[t1].d++; st[t2].d++; st[t1].pts++; st[t2].pts++; }
    }
    for (var ti = 0; ti < teams.length; ti++) {
      st[teams[ti]].gd = st[teams[ti]].gf - st[teams[ti]].ga;
    }
    
    // Sort standings: pts desc, gd desc, gf desc
    var sortedTeams = teams.slice().sort(function(a,b){
      if (st[b].pts !== st[a].pts) return st[b].pts - st[a].pts;
      if (st[b].gd !== st[a].gd) return st[b].gd - st[a].gd;
      return st[b].gf - st[a].gf;
    });
    
    h += '<div class="gm-group-card">';
    h += '<div class="gm-header"><h3>' + gk + ' 组</h3><span class="gm-updated">' + (gr.matches.length) + ' 场</span></div>';
    
    // Standings table
    h += '<table class="gm-standings"><thead><tr><th>#</th><th></th><th>球队</th><th>赛</th><th>胜</th><th>平</th><th>负</th><th>进</th><th>失</th><th>净</th><th>分</th></tr></thead><tbody>';
    for (var ti = 0; ti < sortedTeams.length; ti++) {
      var t = sortedTeams[ti];
      var s = st[t];
      var rankClass = ti === 0 ? ' gm-rank-top' : ti === 1 ? ' gm-rank-top' : '';
      h += '<tr class="gm-standings-row' + rankClass + '"><td class="gm-rank">' + (ti+1) + '</td><td class="gm-flag-cell">' + flag(t) + '</td><td class="gm-team-cell">' + cn(t) + '</td><td>' + s.gp + '</td><td>' + s.w + '</td><td>' + s.d + '</td><td>' + s.l + '</td><td>' + s.gf + '</td><td>' + s.ga + '</td><td class="gm-gd' + (s.gd > 0 ? ' gm-gd-pos' : s.gd < 0 ? ' gm-gd-neg' : '') + '">' + (s.gd > 0 ? '+' : '') + s.gd + '</td><td class="gm-pts">' + s.pts + '</td></tr>';
    }
    h += '</tbody></table>';
    
    // Matches list
    h += '<div class="gm-matches">';
    for (var mi = 0; mi < matches.length; mi++) {
      var m = matches[mi];
      var statusClass = m.status === 'finished' ? ' gm-match-done' : '';
      var isToday = m.date === todayStr;
      var dateDisplay = isToday ? '<span class="gm-today-badge">今天</span>' : m.date;
      var scoreDisplay = m.status === 'finished' ? '<span class="gm-score">' + m.score1 + ' - ' + m.score2 + '</span>' :
                         (m.status === 'live' ? '<span class="gm-score gm-score-live">进行中...</span>' :
                          '<span class="gm-score gm-score-upcoming">—</span>');
      h += '<div class="gm-match' + statusClass + '"><span class="gm-match-date">' + dateDisplay + '</span>' +
        '<span class="gm-team">' + flag(m.team1) + ' ' + cn(m.team1) + '</span>' +
        scoreDisplay +
        '<span class="gm-team">' + flag(m.team2) + ' ' + cn(m.team2) + '</span></div>';
    }
    h += '</div></div>';
  }
  
  c.innerHTML = h + '<p class="gm-footnote">🔄 每天13:00自动更新比赛结果 · 绿色背景 = 已完赛</p>';
})();
'''

# Find the "// ===== Helper functions" section to insert before it
helper_pos = html.find('// ===== Helper functions')
if helper_pos == -1:
    print("ERROR: Could not find Helper functions section")
    exit(1)

html = html[:helper_pos] + match_render_js + '\n' + html[helper_pos:]
print("✅ Injected rendering JS")

# =============================================
# 5. Add CSS styles
# =============================================
group_matches_css = '''

/* ===== Group Matches Tab (小組賽) ===== */
.gm-group-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}
.gm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.gm-header h3 {
  font-size: 1.2rem;
  color: var(--accent-light);
}
.gm-updated {
  font-size: 0.8rem;
  color: var(--text-dim);
}
.gm-standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.gm-standings th {
  color: var(--text-dim);
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  padding: 6px 4px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}
.gm-standings th:nth-child(3) { text-align: left; }
.gm-standings td {
  padding: 8px 4px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}
.gm-standings-row.gm-rank-top td:first-child {
  color: var(--gold);
  font-weight: 700;
}
.gm-flag-cell { font-size: 1.2rem; padding: 4px; }
.gm-team-cell { text-align: left !important; font-weight: 500; }
.gm-gd { font-weight: 600; }
.gm-gd-pos { color: #22c55e; }
.gm-gd-neg { color: #ef4444; }
.gm-pts { color: var(--gold); font-weight: 700; font-size: 1rem; }
.gm-matches { display: flex; flex-direction: column; gap: 6px; }
.gm-match {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  font-size: 0.85rem;
}
.gm-match.gm-match-done {
  background: rgba(34,197,94,0.08);
}
.gm-match-date {
  color: var(--text-dim);
  font-size: 0.75rem;
  min-width: 80px;
  white-space: nowrap;
}
.gm-today-badge {
  background: var(--accent);
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}
.gm-team {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
}
.gm-score {
  font-weight: 700;
  min-width: 50px;
  text-align: center;
  color: var(--accent-light);
}
.gm-score-upcoming { color: var(--text-faint); }
.gm-score-live { color: #f59e0b; }
.gm-footnote {
  font-size: 0.8rem;
  color: var(--text-faint);
  text-align: center;
  margin-top: 10px;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .gm-standings { font-size: 0.78rem; }
  .gm-standings td, .gm-standings th { padding: 4px 2px; }
  .gm-match { font-size: 0.78rem; gap: 6px; }
  .gm-match-date { min-width: 65px; }
}
'''

# Inject CSS before the closing </style> tag
style_close = html.find('</style>')
if style_close == -1:
    # Find the end of the CSS file content section and inject there
    # The CSS is in a separate file, so add before the closing </head>
    head_close = html.find('</head>')
    if head_close == -1:
        print("ERROR: Could not find </head>")
        exit(1)
    html = html[:head_close] + '<style>' + group_matches_css + '</style>\n' + html[head_close:]
    print("✅ Injected CSS in head")
else:
    html = html[:style_close] + group_matches_css + '\n' + html[style_close:]
    print("✅ Injected CSS in existing style block")

# =============================================
# Write back
# =============================================
with open(INDEX_FILE, 'w') as f:
    f.write(html)

print("\n✅ All injections done!")
