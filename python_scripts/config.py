"""
Central configuration file for the data pipeline.
"""

# --- Pipeline Configuration ---
CURRENT_YEAR = 2025
SEASONS = [f"{year}-{str(year+1)[-2:]}" for year in range(CURRENT_YEAR - 10, CURRENT_YEAR)]
MIN_GAMES_PLAYED = 20
MIN_AVG_MINUTES = 25.0
REQUEST_TIMEOUT = 30
REQUEST_DELAY = 0.6 # Still relevant for politeness, but less critical with parallel requests
