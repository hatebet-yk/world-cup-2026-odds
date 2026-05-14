#!/usr/bin/env python3
"""
2026 世界杯夺冠赔率爬虫

数据来源：
  1. The Odds API (https://the-odds-api.com) - 结构化赔率数据，首选
  2. 国内博彩网站 (备用，需手动配置)

用法：
  python3 fetch_odds.py                    # 使用 The Odds API
  python3 fetch_odds.py --source manual    # 手动输入模式
  python3 fetch_odds.py --source odds-api  # 指定使用 The Odds API

环境变量：
  ODDS_API_KEY - The Odds API 密钥（必填，除非用 manual 模式）
"""

import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# 项目路径
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# 参赛球队（2026世界杯扩军至48队）
ALL_TEAMS = [
    # 南美
    "Brazil", "Argentina", "Uruguay", "Ecuador", "Colombia", "Chile", "Peru", "Paraguay", "Venezuela",
    # 欧洲
    "France", "England", "Germany", "Spain", "Portugal", "Netherlands", "Italy", "Belgium", "Croatia",
    "Denmark", "Switzerland", "Serbia", "Poland", "Ukraine", "Sweden", "Norway", "Romania", "Czech Republic",
    "Greece", "Turkey", "Russia", "Austria", "Hungary", "Scotland", "Wales", "Slovakia", "Slovenia",
    "Bosnia and Herzegovina", "Iceland", "Finland", "North Macedonia", "Northern Ireland", "Luxembourg",
    "Latvia", "Estonia", "Lithuania", "Cyprus", "Montenegro", "Albania", "Kosovo", "Georgia",
    "Belarus", "Moldova", "Malta", "Faroe Islands", "Gibraltar", "Andorra", "San Marino",
    # 非洲
    "Morocco", "Senegal", "Nigeria", "Cameroon", "Ghana", "Tunisia", "Egypt", "Algeria",
    "Ivory Coast", "South Africa", "Burkina Faso", "Mali", "Congo DR", "Zambia", "Cape Verde",
    "Equatorial Guinea", "Guinea", "Gabon", "Benin", "Togo", "Mozambique", "Madagascar",
    "Comoros", "Sudan", "Tanzania", "Central African Republic", "Angola",
    # 亚洲
    "Japan", "South Korea", "Australia", "Iran", "Saudi Arabia", "Qatar", "UAE", "Iraq", "Oman",
    "Jordan", "Bahrain", "Uzbekistan", "China", "Syria", "Vietnam", "Thailand", "Kuwait",
    "Palestine", "Lebanon", "India", "Malaysia", "Indonesia", "Turkmenistan",
    # 中北美及加勒比
    "Mexico", "USA", "Canada", "Costa Rica", "Panama", "Jamaica", "Honduras", "El Salvador",
    "Haiti", "Trinidad and Tobago", "Cuba", "Guatemala", "Nicaragua", "Suriname", "Dominican Republic",
    "Puerto Rico", "Saint Kitts and Nevis", "Saint Lucia", "Grenada",
    # 大洋洲
    "New Zealand", "Fiji", "Solomon Islands", "Vanuatu", "New Caledonia", "Tahiti",
    "Papua New Guinea", "Samoa", "American Samoa",
]

# 中文队名映射（仅保留主要球队）
CN_NAMES = {
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
}

# 主要球队英文名列表（用于过滤有赔率的队伍）
TOP_TEAMS = [
    "Argentina", "Brazil", "England", "France", "Germany", "Spain",
    "Portugal", "Netherlands", "Italy", "Belgium", "Croatia", "Denmark",
    "Switzerland", "Uruguay", "Mexico", "USA", "Japan", "South Korea",
    "Australia", "Canada", "Morocco", "Senegal", "Nigeria", "Cameroon",
    "Ghana", "Tunisia", "Egypt", "Algeria", "Ivory Coast", "South Africa",
    "Iran", "Saudi Arabia", "Qatar", "Ecuador", "Colombia", "Chile",
    "Peru", "Paraguay", "Costa Rica", "Panama", "Jamaica", "New Zealand",
    "Serbia", "Poland", "Ukraine", "Sweden", "Norway",
]


def load_history():
    """加载历史数据"""
    history_file = DATA_DIR / "latest.json"
    if history_file.exists():
        try:
            with open(history_file, "r") as f:
                return json.load(f).get("history", [])
        except (json.JSONDecodeError, KeyError):
            return []
    return []


def save_data(teams, updated_str, history=None):
    """保存数据到 JSON 文件"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if history is None:
        history = []

    data = {
        "updated": updated_str,
        "note": "数据来源：The Odds API 综合多家博彩平台赔率",
        "teams": teams,
        "history": history,
    }

    output_path = DATA_DIR / "latest.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 数据已保存至 {output_path}")
    print(f"   共 {len(teams)} 支球队，历史记录 {len(history)} 条")
    return data


def fetch_from_odds_api(api_key):
    """从 The Odds API 获取世界杯夺冠赔率"""
    import urllib.request
    import urllib.error

    # The Odds API 体育项目ID
    # 世界杯可能为 'soccer_world_cup' 或 'soccer_fifa_world_cup_winner'
    # 先尝试获取赛事列表
    sports_url = f"https://api.the-odds-api.com/v4/sports/?apiKey={api_key}"
    
    print("🔍 获取赛事列表...")
    try:
        req = urllib.request.Request(sports_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            sports = json.loads(resp.read())
    except urllib.error.URLError as e:
        print(f"❌ API 连接失败: {e}")
        return None

    # 查找世界杯赛事
    wc_sport = None
    for s in sports:
        title = s.get("title", "").lower()
        key = s.get("key", "").lower()
        if "world cup" in title or "world cup" in key:
            wc_sport = s
            print(f"  找到赛事: {s['title']} (key: {s['key']})")
            break

    if not wc_sport:
        print("⚠️ 未找到世界杯赛事，尝试历史数据中存在的世界杯 key...")
        # 常见的世界杯 odds-api key
        for key in ["soccer_world_cup", "soccer_fifa_world_cup_winner",
                     "soccer_world_cup_winner", "soccer_world_cup_2026"]:
            wc_url = f"https://api.the-odds-api.com/v4/sports/{key}/odds/?apiKey={api_key}&regions=eu,us,au&markets=h2h"
            try:
                req = urllib.request.Request(wc_url)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read())
                    if isinstance(data, list) and len(data) > 0:
                        wc_sport = {"key": key, "title": key}
                        print(f"  ✓ 找到数据: {key}")
                        break
            except:
                continue

        if not wc_sport:
            print("❌ 无法找到世界杯赔率数据")
            return None

    # 获取赔率
    sport_key = wc_sport["key"]
    odds_url = (f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds/"
                f"?apiKey={api_key}&regions=eu,us,au&markets=h2h,outrights")

    print(f"🔍 获取赔率数据...")
    try:
        req = urllib.request.Request(odds_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            odds_data = json.loads(resp.read())
    except urllib.error.URLError as e:
        print(f"❌ 赔率获取失败: {e}")
        return None

    # 解析赔率数据
    teams_odds = {}
    if isinstance(odds_data, list):
        for market_data in odds_data:
            title = market_data.get("title", "")
            # 尝试从标题或书中提取球队名
            teams_found = set()
            for bookmaker in market_data.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    for outcome in market.get("outcomes", []):
                        name = outcome.get("name", "")
                        if name:
                            # 记录所有平台的赔率
                            if name not in teams_odds:
                                teams_odds[name] = []
                            price = outcome.get("price", 0)
                            if price > 1:
                                # 美式赔率转小数
                                teams_odds[name].append(price)
                            elif price > 0:
                                # decimal odds
                                teams_odds[name].append(price)

    # 如果没有 outrights 数据，再试一下 h2h
    if not teams_odds:
        print("⚠️ Outrights 市场无数据，尝试 h2h 市场...")
        odds_url_h2h = (f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds/"
                        f"?apiKey={api_key}&regions=eu,us,au&markets=h2h")
        try:
            req = urllib.request.Request(odds_url_h2h)
            with urllib.request.urlopen(req, timeout=15) as resp:
                odds_data = json.loads(resp.read())
            if isinstance(odds_data, list):
                for market_data in odds_data:
                    for bookmaker in market_data.get("bookmakers", []):
                        for market in bookmaker.get("markets", []):
                            for outcome in market.get("outcomes", []):
                                name = outcome.get("name", "")
                                if name:
                                    if name not in teams_odds:
                                        teams_odds[name] = []
                                    price = outcome.get("price", 0)
                                    if price > 1:
                                        teams_odds[name].append(price)
        except:
            pass

    if not teams_odds:
        print("❌ 未能解析到任何赔率数据")
        return None

    return teams_odds


def normalize_odds(teams_odds):
    """将赔率数据归一化为标准格式"""
    result = []
    for name, odds_list in teams_odds.items():
        # 只保留主要球队
        if name not in TOP_TEAMS:
            continue

        # 去除异常值（过高或过低）
        valid = [o for o in odds_list if 1.01 < o < 1000]
        if not valid:
            continue

        # 取平均值
        avg_odds = sum(valid) / len(valid)
        # 赔率概率
        odds_prob = 1.0 / avg_odds
        # 数据源数量
        sources = min(len(valid), 3)

        result.append({
            "name": name,
            "avgOdds": round(avg_odds, 2),
            "modelProb": round(odds_prob, 4),
            "sources": sources,
        })

    # 按赔率排序（概率高的在前）
    result.sort(key=lambda x: 1.0 / x["avgOdds"], reverse=True)

    return result


def fetch_manuel_mode():
    """手动输入模式 - 方便调试和第一次设置"""
    print("\n📝 手动输入模式")
    print("输入格式：球队名 赔率（如：Brazil 5.5）")
    print("输入空行结束\n")

    teams = []
    while True:
        line = input("> ").strip()
        if not line:
            break
        parts = line.rsplit(" ", 1)
        if len(parts) == 2:
            try:
                name = parts[0].strip()
                odds = float(parts[1])
                teams.append({
                    "name": name,
                    "avgOdds": odds,
                    "modelProb": round(1.0 / odds, 4),
                    "sources": 1,
                })
            except ValueError:
                print(f"  格式错误: {line}")
        else:
            # 只输入名字，尝试匹配
            keyword = parts[0].strip()
            match = [t for t in TOP_TEAMS if keyword.lower() in t.lower()]
            if match:
                print(f"  匹配到: {', '.join(match)}")
            else:
                print(f"  未找到: {keyword}")

    if not teams:
        print("⚠️ 未输入任何球队，使用默认数据")
        return None

    teams.sort(key=lambda x: 1.0 / x["avgOdds"], reverse=True)
    return teams


def main():
    parser = argparse.ArgumentParser(description="2026世界杯夺冠赔率爬虫")
    parser.add_argument("--source", choices=["odds-api", "manual"],
                        default="odds-api", help="数据来源")
    args = parser.parse_args()

    update_time = datetime.now().strftime("%Y-%m-%d %H:%M (CST)")
    history = load_history()

    if args.source == "manual":
        teams = fetch_manuel_mode()
        if teams is None:
            print("⚠️ 未获取到数据")
            return
        data = {"teams": teams}
    else:
        api_key = os.environ.get("ODDS_API_KEY", "")
        if not api_key:
            print("⚠️ 未设置 ODDS_API_KEY 环境变量")
            print("   如需使用 The Odds API，请设置: export ODDS_API_KEY=your_key")
            print("   或使用 --source manual 手动输入\n")

            # 示例：从赛前文章复制粘贴的数据
            print("📋 使用内置样本数据（请从博彩网站获取最新赔率后运行 --source manual）")
            from sample_data import SAMPLE_TEAMS
            teams = SAMPLE_TEAMS
        else:
            print(f"📡 从 The Odds API 获取数据...")
            odds_dict = fetch_from_odds_api(api_key)
            if odds_dict:
                teams = normalize_odds(odds_dict)
                print(f"  获取到 {len(teams)} 支球队的赔率数据")
            else:
                print("❌ API 获取失败，使用内置样本数据")
                from sample_data import SAMPLE_TEAMS
                teams = SAMPLE_TEAMS

    # 保存数据，同时保留历史
    if teams:
        save_data(teams, update_time, history)
    else:
        print("❌ 没有可保存的数据")


if __name__ == "__main__":
    main()
