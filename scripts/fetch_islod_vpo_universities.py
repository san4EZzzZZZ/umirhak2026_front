"""
Выгрузка полных наименований организаций ВПО из сводного реестра лицензий Рособрнадзора
и запись в src/data/islodVpoUniversities.js для подсказок в кабинете студента.

Требуется: pip install requests

Запуск из каталога umirhak2026_front:
  python scripts/fetch_islod_vpo_universities.py
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT_JS = ROOT / "src" / "data" / "islodVpoUniversities.js"
OUT_TXT = ROOT / "universities_ru.txt"

url = "https://islod.obrnadzor.gov.ru/rlic/api/search"

headers = {
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0",
}

page = 0
page_size = 100
all_universities: list[str] = []

while True:
    payload = {
        "page": page,
        "size": page_size,
        "sort": {"sorted": False, "unsorted": True, "empty": True},
        "query": {
            "region": None,
            "orgName": "",
            "orgType": "VPO",
        },
    }

    response = requests.post(url, json=payload, headers=headers, timeout=60)

    if response.status_code != 200:
        print("Ошибка запроса:", response.status_code)
        raise SystemExit(1)

    data = response.json()
    content = data.get("content", [])

    if not content:
        break

    for item in content:
        name = item.get("fullName")
        if name:
            all_universities.append(name)

    print(f"Страница {page} обработана, всего: {len(all_universities)}")

    page += 1
    time.sleep(0.5)

all_universities = sorted(set(all_universities))

with open(OUT_TXT, "w", encoding="utf-8") as f:
    for uni in all_universities:
        f.write(uni + "\n")

lines = ",\n  ".join(json.dumps(name, ensure_ascii=False) for name in all_universities)
js = f"""/**
 * Организации высшего профессионального образования (Рособрнадзор, orgType=VPO).
 * Автогенерация: python scripts/fetch_islod_vpo_universities.py
 */
export const ISLOD_VPO_UNIVERSITY_NAMES = [
  {lines}
];
"""
OUT_JS.write_text(js, encoding="utf-8")

print(f"\nГотово! Найдено вузов: {len(all_universities)}")
print(f"JS: {OUT_JS}")
print(f"TXT: {OUT_TXT}")
