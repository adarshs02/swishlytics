"""
Central configuration file for the data pipeline.
"""

# --- Pipeline Configuration ---
CURRENT_YEAR = 2025
SEASONS = [f"{year}-{str(year+1)[-2:]}" for year in range(CURRENT_YEAR - 10, CURRENT_YEAR)]
MIN_GAMES_PLAYED = 20
MIN_AVG_MINUTES = 0
REQUEST_TIMEOUT = 30
REQUEST_DELAY = 0.6 # Still relevant for politeness, but less critical with parallel requests

Z_SCORE_COLUMNS = {
    'points_z_score':            1.185,   # Points
    'rebounds_z_score':          1.257,   # Rebounds
    'assists_z_score':           1.309,   # Assists
    'steals_z_score':            1.332,   # Steals
    'blocks_z_score':            1.356,   # Blocks
    'field_goal_pct_z_score':      1.286,   # Field-Goal %
    'three_pointers_made_z_score': 1.286,   # 3-Pointers Made
    'free_throw_pct_z_score':      1.276,   # Free-Throw %
    'turnovers_z_score':        -1.247    # Turnovers (penalty, stays negative)
}