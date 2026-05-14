# 🏆 2026 世界杯夺冠概率排行榜

> 数据综合自主流博彩赔率，每周自动更新

## 目标

归集网上多家博彩平台的夺冠赔率，计算并发布各国夺冠的综合概率，每周更新一次，展示趋势变化。

## 技术栈

- **前端**：原生 HTML + CSS + JavaScript，Chart.js 图表
- **数据**：Python 爬虫采集 → JSON 数据文件
- **托管**：GitHub Pages（静态站点）
- **自动化**：GitHub Actions 每周自动运行爬虫
- **API**：The Odds API（结构化赔率数据）

## 项目结构

```
world-cup-dashboard/
├── docs/                    # GitHub Pages 静态站点
│   ├── index.html          # 主页面
│   ├── style.css           # 样式
│   └── app.js              # 前端交互逻辑
├── scraper/                 # 数据采集
│   ├── fetch_odds.py       # 爬虫主程序
│   └── sample_data.py      # 内置样本数据（备用）
├── data/
│   └── latest.json         # 最新赔率数据
├── .github/workflows/
│   └── update-odds.yml     # 每周自动更新
└── README.md
```

## 数据来源

主要数据源：

1. **The Odds API** - 综合多家博彩平台赔率（Bet365, William Hill, DraftKings 等）
2. **备用方案** - 手动输入或从博彩资讯站获取

## 本地使用

```bash
# 1. 安装依赖
#（无额外依赖，使用 Python 标准库）

# 2. 设置 API Key（可选，不使用时会使用内置样本数据）
export ODDS_API_KEY=your_key_here

# 3. 运行爬虫
python3 scraper/fetch_odds.py

# 4. 预览站点
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/docs/
```

## 部署

1. Fork 此仓库
2. 在 GitHub 仓库 Settings → Pages 中，选择 `docs/` 目录作为发布源
3. （可选）在 Settings → Secrets and variables → Actions 中添加 `ODDS_API_KEY`
4. 每周一自动更新，也可手动在 Actions 中触发

## 概率计算方式

- **赔率概率** = 1 / 平均赔率 × 60%
- **模型概率** = 归一化赔率概率 × 40%
- **综合概率** = 赔率概率 + 模型概率（最后归一化到 100%）

## 注意事项

⚠️ 所有概率仅供参考，不构成投注建议
⚠️ 赔率数据可能有滞后，以实际博彩平台为准
