#!/usr/bin/env python3
"""
2026世界杯夺冠赔率 - 样本数据
当 The Odds API 不可用时使用此内置数据。
请每周从可靠的博彩网站获取最新赔率后更新此文件。

数据来源基准：2026年5月 综合多家博彩平台赔率
"""

# 格式：[球队名, 平均赔率, 数据源数量]
SAMPLE_RAW = [
    # 第一梯队（赔率 < 10）
    ("Brazil",        5.50,  3),
    ("France",        6.00,  3),
    ("Argentina",     7.00,  3),
    ("England",       7.50,  3),
    ("Germany",       9.00,  3),
    # 第二梯队（赔率 10-19）
    ("Spain",         10.00, 3),
    ("Portugal",      12.00, 3),
    ("Netherlands",   14.00, 3),
    ("Italy",         18.00, 3),
    # 第三梯队（赔率 20-40）
    ("Belgium",       21.00, 2),
    ("Croatia",       28.00, 2),
    ("Uruguay",       35.00, 2),
    ("Denmark",       38.00, 2),
    ("Mexico",        40.00, 2),
    # 第四梯队（赔率 41-70）
    ("USA",           45.00, 2),
    ("Japan",         50.00, 2),
    ("Morocco",       60.00, 2),
    ("Serbia",        65.00, 1),
    ("Poland",        70.00, 1),
    # 第五梯队（赔率 71-100）
    ("South Korea",   80.00, 1),
    ("Switzerland",   80.00, 1),
    ("Senegal",       85.00, 1),
    ("Nigeria",       90.00, 1),
    ("Sweden",        95.00, 1),
    # 第六梯队（赔率 > 100）
    ("Canada",       100.00, 1),
    ("Australia",    120.00, 1),
    ("Ecuador",      130.00, 1),
    ("Colombia",     140.00, 1),
    ("Iran",         150.00, 1),
    ("Chile",        160.00, 1),
    ("Peru",         170.00, 1),
    ("Norway",       180.00, 1),
    ("Cameroon",     200.00, 1),
    ("New Zealand",  250.00, 1),
    ("Algeria",      300.00, 1),
    ("Saudi Arabia", 350.00, 1),
    ("Costa Rica",   400.00, 1),
    ("Ghana",        450.00, 1),
    ("Egypt",        500.00, 1),
    ("Ivory Coast",  500.00, 1),
    ("Qatar",        600.00, 1),
    ("Panama",       700.00, 1),
    ("Jamaica",      800.00, 1),
    ("Paraguay",     900.00, 1),
    ("Venezuela",   1000.00, 1),
    ("Tunisia",     1000.00, 1),
    ("South Africa",1200.00, 1),
    ("Honduras",    1500.00, 1),
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
