# predmodel/config.py

# Stats to project with the model
STATS_TO_PROJECT = [
    'points',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'turnovers',
    'field_goal_pct',
    'free_throw_pct',
    'three_pointers_made',
    'games_played',
    'avg_minutes',
    'field_goals_made', # FGM
    'field_goal_attempts', # FGA
    'free_throws_made', # FTM
    'free_throw_attempts', # FTA
    'three_point_attempts', # 3PA
    'usage_rate',
    'true_shooting_pct',
]

# Stats for which to calculate z-scores
# Note: turnovers are inverted in fantasy value, so we'll handle that during z-score calculation
Z_SCORE_STATS = [
    'points',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'turnovers',
    'field_goal_pct',
    'free_throw_pct',
    'three_pointers_made',
]

Z_SCORE_COLUMNS = {
    'Points_ZScore':            1.195,   # Points
    'Rebounds_ZScore':          1.267,   # Rebounds
    'Assists_ZScore':           1.239,   # Assists
    'Steals_ZScore':            1.322,   # Steals
    'Blocks_ZScore':            1.426,   # Blocks
    'FieldGoalPct_ZScore':      1.380,   # Field-Goal %
    'ThreePointersMade_ZScore': 1.286,   # 3-Pointers Made
    'FreeThrowPct_ZScore':      1.256,   # Free-Throw %
    'Turnovers_ZScore':        -1.217    # Turnovers (penalty, stays negative)
}

