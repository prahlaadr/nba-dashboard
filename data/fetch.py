# /// script
# requires-python = ">=3.11"
# dependencies = ["nba_api>=1.4", "requests"]
# ///
"""Fetch NBA game data from nba_api endpoints and save as JSON."""

import json
import sys
import time
from pathlib import Path

import requests

from nba_api.stats.endpoints import (
    BoxScoreSummaryV2,
    ShotChartDetail,
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Accept": "application/json",
    "Referer": "https://www.nba.com/",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
}

STATS_URL = "https://stats.nba.com/stats"


def fetch_raw(endpoint: str, params: dict) -> dict:
    """Fetch directly from stats.nba.com."""
    resp = requests.get(f"{STATS_URL}/{endpoint}", headers=HEADERS, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def save(data: dict, path: Path) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def fetch_game(game_id: str) -> None:
    out_dir = Path(__file__).parent / "games" / game_id
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Fetching game {game_id}...")

    # 1. Box Score Summary → meta.json
    if not (out_dir / "meta.json").exists():
        print("  [1/5] BoxScoreSummaryV2...")
        summary = BoxScoreSummaryV2(game_id=game_id, headers=HEADERS)
        save(summary.get_dict(), out_dir / "meta.json")
        time.sleep(1)
    else:
        print("  [1/5] meta.json exists, skipping")

    # 2. Shot Chart → shots.json
    if not (out_dir / "shots.json").exists():
        print("  [2/5] ShotChartDetail...")
        shots = ShotChartDetail(
            game_id_nullable=game_id,
            team_id=0,
            player_id=0,
            season_nullable="2023-24",
            season_type_all_star="Playoffs",
            context_measure_simple="FGA",
            headers=HEADERS,
        )
        save(shots.get_dict(), out_dir / "shots.json")
        time.sleep(1)
    else:
        print("  [2/5] shots.json exists, skipping")

    # 3. Play-by-Play V3 → playbyplay.json
    if not (out_dir / "playbyplay.json").exists():
        print("  [3/5] PlayByPlayV3...")
        pbp = fetch_raw("playbyplayv3", {
            "GameID": game_id,
            "StartPeriod": 0,
            "EndPeriod": 14,
        })
        save(pbp, out_dir / "playbyplay.json")
        time.sleep(1)
    else:
        print("  [3/5] playbyplay.json exists, skipping")

    # 4. Traditional Box Score → boxscore.json
    if not (out_dir / "boxscore.json").exists():
        print("  [4/5] BoxScoreTraditionalV2 (raw)...")
        box = fetch_raw("boxscoretraditionalv2", {
            "GameID": game_id,
            "StartPeriod": 0,
            "EndPeriod": 14,
            "RangeType": 0,
            "StartRange": 0,
            "EndRange": 0,
        })
        save(box, out_dir / "boxscore.json")
        time.sleep(1)
    else:
        print("  [4/5] boxscore.json exists, skipping")

    # 5. Advanced Box Score V3 → boxscore_advanced.json
    if not (out_dir / "boxscore_advanced.json").exists():
        print("  [5/5] BoxScoreAdvancedV3...")
        adv = fetch_raw("boxscoreadvancedv3", {
            "GameID": game_id,
            "StartPeriod": 0,
            "EndPeriod": 14,
            "RangeType": 0,
            "StartRange": 0,
            "EndRange": 0,
        })
        save(adv, out_dir / "boxscore_advanced.json")
    else:
        print("  [5/5] boxscore_advanced.json exists, skipping")

    print(f"Done! Files saved to {out_dir}")


if __name__ == "__main__":
    gid = sys.argv[1] if len(sys.argv) > 1 else "0042300237"
    fetch_game(gid)
