#!/usr/bin/env python3
"""
2026世界杯夺冠赔率 - 样本数据
当 The Odds API 不可用时使用此内置数据。
请每周从可靠的博彩网站获取最新赔率后更新此文件。

数据来源基准：2026年5月 综合多家博彩平台赔率
"""

# 格式：[球队名, 平均赔率, 数据源数量]
# 更新于 2026-05-24，综合 Bet365 · DraftKings · FanDuel · BetMGM
SAMPLE_RAW = [
    # 第一梯队（赔率 < 10）
    ("Argentina",     5.00,  4),
    ("Brazil",        6.00,  4),
    ("France",        6.50,  4),
    ("England",       7.00,  4),
    ("Germany",       8.00,  4),
    # 第二梯队（赔率 10-19）
    ("Spain",         9.00,  4),
    ("Portugal",     11.00,  4),
    ("Netherlands",  13.00,  4),
    ("Italy",        15.00,  4),
    # 第三梯队（赔率 20-40）
    ("Belgium",      19.00,  4),
    ("USA",          23.00,  4),
    ("Mexico",       28.00,  4),
    ("Croatia",      29.00,  4),
    ("Uruguay",      34.00,  4),
    ("Denmark",      36.00,  4),
    # 第四梯队（赔率 41-70）
    ("Morocco",      41.00,  4),
    ("Japan",        46.00,  4),
    ("Canada",       51.00,  4),
    ("Senegal",      61.00,  4),
    ("Serbia",       66.00,  4),
    # 第五梯队（赔率 71-100）
    ("Nigeria",      71.00,  4),
    ("South Korea",  76.00,  4),
    ("Poland",       81.00,  4),
    ("Switzerland",  81.00,  4),
    ("Sweden",       91.00,  4),
    # 第六梯队（赔率 > 100）
    ("Australia",   101.00,  4),
    ("Ecuador",     126.00,  4),
    ("Colombia",    151.00,  4),
    ("Chile",       176.00,  4),
    ("Norway",      176.00,  4),
    ("Iran",        201.00,  4),
    ("Peru",        201.00,  4),
    ("Cameroon",    251.00,  4),
    ("Algeria",     251.00,  4),
    ("Ivory Coast", 301.00,  4),
    ("Saudi Arabia",351.00,  4),
    ("Ghana",       401.00,  4),
    ("Egypt",       401.00,  4),
    ("New Zealand", 501.00,  4),
    ("Tunisia",     501.00,  4),
    ("Costa Rica",  501.00,  4),
    ("Qatar",       751.00,  4),
    ("South Africa",1001.00, 4),
    ("Panama",      1001.00, 4),
    ("Paraguay",    1001.00, 4),
    ("Jamaica",     1001.00, 4),
    ("Venezuela",   1501.00, 4),
    ("Honduras",    2001.00, 4),
]

SAMPLE_TEAMS = [
    {
        "name": name,
        "avgOdds": odds,
        "modelProb": round(1.0 / odds, 4),
        "sources": sources,
    }
    for name, odds, sources in SAMPLE_RAW
]
