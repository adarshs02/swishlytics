import pandas as pd
from db_connector import get_supabase_client

def fetch_players():
    """
    Fetches all players from the players table.
    """
    print("Fetching players...")
    supabase = get_supabase_client()
    try:
        response = supabase.table('players').select('player_id, full_name').execute()
        if response.data:
            df = pd.DataFrame(response.data)
            print("Successfully fetched players.")
            return df
        else:
            print("No data returned from players table.")
            return None
    except Exception as e:
        print(f"An error occurred while fetching players: {e}")
        return None

def fetch_player_stats():
    """
    Fetches all player stats from the player_stats_by_season table, handling pagination.
    """
    supabase = get_supabase_client()
    all_data = []
    current_page = 0
    page_size = 1000  # Default Supabase limit

    while True:
        start_index = current_page * page_size
        response = supabase.table('player_stats_by_season').select('*', count='exact').range(start_index, start_index + page_size - 1).execute()
        
        if response.data:
            all_data.extend(response.data)
            # Check if we've fetched all the rows
            if len(all_data) >= response.count:
                break
        else:
            break
        current_page += 1

    if all_data:
        print(f"Successfully fetched {len(all_data)} player stat records.")
        df = pd.DataFrame(all_data)
        return df
    else:
        print("No player stats found.")
        return None

def create_per_minute_stats(df):
    """
    Calculates per-36-minute statistics for key categories.

    Args:
        df (pd.DataFrame): DataFrame with player stats, including 'avg_minutes'.

    Returns:
        pd.DataFrame: DataFrame with added per-36-minute stats.
    """
    if 'avg_minutes' not in df.columns or df['avg_minutes'].isnull().all():
        print("'avg_minutes' column is missing or empty. Skipping per-minute stats.")
        return df

    # Avoid division by zero
    df_filtered = df[df['avg_minutes'] > 0].copy()

    stats_to_normalize = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'three_pointers_made']
    
    for stat in stats_to_normalize:
        if stat in df_filtered.columns:
            per_minute_stat_name = f'{stat}_per_36_min'
            df_filtered[per_minute_stat_name] = (df_filtered[stat] / df_filtered['avg_minutes']) * 36

    print("Successfully created per-36-minute stats.")
    return df_filtered


def create_yoy_stats(df):
    """
    Calculates the year-over-year change in stats for each player.

    Args:
        df (pd.DataFrame): DataFrame with player stats, sorted by player and season.

    Returns:
        pd.DataFrame: DataFrame with added year-over-year difference columns.
    """
    df_sorted = df.sort_values(by=['player_id', 'season'])
    
    stats_to_diff = [
        'points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 
        'three_pointers_made', 'swish_score', 'usage_rate', 'true_shooting_pct'
    ]
    
    # Select only numeric columns for diff calculation to avoid errors
    numeric_cols = df_sorted.select_dtypes(include='number').columns
    stats_to_diff = [stat for stat in stats_to_diff if stat in numeric_cols]

    # Group by player and calculate the difference from the previous season
    yoy_diff = df_sorted.groupby('player_id')[stats_to_diff].diff()
    yoy_diff.columns = [f'{col}_yoy_diff' for col in yoy_diff.columns]

    df_with_yoy = pd.concat([df_sorted, yoy_diff], axis=1)

    print("Successfully created year-over-year stats.")
    return df_with_yoy


def create_age_and_experience_features(df):
    """
    Creates age-based and experience-based features.

    Args:
        df (pd.DataFrame): DataFrame with player stats, including 'player_age' and 'season'.

    Returns:
        pd.DataFrame: DataFrame with added age and experience features.
    """
    # Create age squared feature to model the age curve
    if 'player_age' in df.columns:
        df['player_age_sq'] = df['player_age'] ** 2
        print("Successfully created 'player_age_sq' feature.")

    # Calculate years of experience
    # First, convert season string to the starting year integer
    df['season_start_year'] = df['season'].apply(lambda x: int(x.split('-')[0]))
    
    # Find the rookie year for each player
    rookie_year = df.groupby('player_id')['season_start_year'].min().reset_index()
    rookie_year.rename(columns={'season_start_year': 'rookie_year'}, inplace=True)
    
    # Merge rookie year back into the main dataframe
    df = pd.merge(df, rookie_year, on='player_id', how='left')
    
    # Calculate years in league
    df['years_in_league'] = df['season_start_year'] - df['rookie_year']
    
    # Clean up helper columns
    df.drop(columns=['season_start_year', 'rookie_year'], inplace=True)
    
    print("Successfully created 'years_in_league' feature.")
    
    return df


def create_team_context_features(df):
    """
    Calculates the usage rate vacated by players leaving a team from the previous season.

    Args:
        df (pd.DataFrame): The main player stats dataframe.

    Returns:
        pd.DataFrame: DataFrame with a new 'vacated_usage' feature.
    """
    print("Engineering team context features...")

    if 'usage_rate' not in df.columns or 'team' not in df.columns:
        print("Warning: 'usage_rate' or 'team' not found. Skipping team context features.")
        return df

    # Ensure data is sorted correctly
    df_sorted = df.sort_values(by=['player_id', 'season'])

    # Get the previous season's team for each player
    df_sorted['prev_season_team'] = df_sorted.groupby('player_id')['team'].shift(1)

    # Get the next season to link vacated usage
    df_sorted['season_start_year'] = df_sorted['season'].apply(lambda x: int(x.split('-')[0]))
    df_sorted['next_season_start_year'] = df_sorted['season_start_year'] + 1
    df_sorted['next_season'] = df_sorted['next_season_start_year'].apply(lambda y: f"{y}-{str(y+1)[-2:]}")

    # Calculate the total usage for each team in each season
    team_season_usage = df_sorted.groupby(['team', 'season'])['usage_rate'].sum().reset_index()
    team_season_usage.rename(columns={'usage_rate': 'total_usage'}, inplace=True)

    # Calculate the usage of players who *stayed* with the team
    stayers_df = df_sorted[df_sorted['team'] == df_sorted['prev_season_team']]
    stayers_usage = stayers_df.groupby(['team', 'season'])['usage_rate'].sum().reset_index()
    stayers_usage.rename(columns={'usage_rate': 'stayers_usage'}, inplace=True)

    # Merge total and stayers usage
    vacated_df = pd.merge(team_season_usage, stayers_usage, on=['team', 'season'], how='left')
    vacated_df['stayers_usage'].fillna(0, inplace=True)

    # Vacated usage is the total usage from last season minus the usage of players who stayed
    vacated_df['vacated_usage'] = vacated_df['total_usage'] - vacated_df['stayers_usage']

    # We want to map this vacated usage to the *next* season
    vacated_df['season_start_year'] = vacated_df['season'].apply(lambda x: int(x.split('-')[0]))
    vacated_df['next_season_start_year'] = vacated_df['season_start_year'] + 1
    vacated_df['next_season'] = vacated_df['next_season_start_year'].apply(lambda y: f"{y}-{str(y+1)[-2:]}")

    # Prepare for merge: we need vacated_usage for the season a player arrives
    vacated_to_merge = vacated_df[['team', 'next_season', 'vacated_usage']]
    vacated_to_merge.rename(columns={'next_season': 'season'}, inplace=True)

    # Merge this back into the main dataframe
    df_final = pd.merge(df, vacated_to_merge, on=['team', 'season'], how='left')
    df_final['vacated_usage'].fillna(0, inplace=True)

    print("Successfully created 'vacated_usage' feature.")
    return df_final


if __name__ == '__main__':
    player_stats_df = fetch_player_stats()
    if player_stats_df is not None:
        player_stats_df = create_per_minute_stats(player_stats_df)
        player_stats_df = create_yoy_stats(player_stats_df)
        player_stats_df = create_age_and_experience_features(player_stats_df)
        print("\nDataFrame with Age and Experience features:")
        # Display the new columns for a player with multiple seasons
        player_with_multiple_seasons = player_stats_df['player_id'].value_counts().index[0]
        print(player_stats_df[player_stats_df['player_id'] == player_with_multiple_seasons][['season', 'player_age', 'player_age_sq', 'years_in_league']].tail())
