import pandas as pd
import numpy as np
import joblib
import sys
import os

# Add python_scripts to the path to import feature_engineering and db_connector
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_scripts')))
from feature_engineering import (
    fetch_player_stats,
    fetch_players,
    create_per_minute_stats,
    create_historical_features,
    create_age_and_experience_features,
    create_team_context_features
)
from db_connector import get_supabase_client
from config import STATS_TO_PROJECT, Z_SCORE_STATS, Z_SCORE_COLUMNS

def predict_stats_for_next_season():
    """
    Loads the trained model, fetches the latest data, engineers features,
    and predicts the full stat line for all players for the next season.

    Args:
        model_filename (str): The filename of the trained multi-output model.

    Returns:
        tuple: A tuple containing the DataFrame of predictions, the original DataFrame
               used for prediction, and the prediction season string.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models = {}
    for segment in ['prime', 'veteran', 'senior']:
        model_path = os.path.join(script_dir, f'xgb_model_{segment}.joblib')
        try:
            models[segment] = joblib.load(model_path)
            print(f"Successfully loaded model for '{segment}' segment.")
        except FileNotFoundError:
            print(f"Error: Model file not found at {model_path}. Aborting.")
            return None, None, None, None
    
    # Use one of the models to get the feature list
    features = models['prime'].estimators_[0].get_booster().feature_names

    print("Fetching and engineering features for prediction...")
    player_stats_df = fetch_player_stats()
    if player_stats_df is None:
        print("Could not fetch player stats. Aborting.")
        return None, None, None, None

    most_recent_season = player_stats_df['season'].max()
    prediction_season = f"{int(most_recent_season.split('-')[0]) + 1}-{str(int(most_recent_season.split('-')[1]) + 1)[-2:]}"
    print(f"Predicting stats for {prediction_season} based on {most_recent_season} data.")

    player_stats_df = create_per_minute_stats(player_stats_df)
    player_stats_df = create_historical_features(player_stats_df)
    player_stats_df = create_age_and_experience_features(player_stats_df)
    player_stats_df = create_team_context_features(player_stats_df)

    df_for_prediction = player_stats_df[player_stats_df['season'] == most_recent_season].copy()

    missing_features = [f for f in features if f not in df_for_prediction.columns]
    if missing_features:
        print(f"Error: Missing required features for prediction: {missing_features}")
        return None, None, None, None

    print("Making predictions with segmented models...")
    all_predictions = []

    for index, player_row in df_for_prediction.iterrows():
        age = player_row['player_age']
        
        if age <= 28:
            model = models['prime']
        elif 29 <= age <= 33:
            model = models['veteran']
        else:
            model = models['senior']
            
        player_features = player_row[features].to_frame().T
        prediction = model.predict(player_features)
        
        pred_df = pd.DataFrame(prediction, columns=STATS_TO_PROJECT, index=[index])
        all_predictions.append(pred_df)

    df_predictions = pd.concat(all_predictions)
    print("Predictions complete.")

    return df_predictions, df_for_prediction, prediction_season, player_stats_df

def calculate_z_scores_and_swish_score(projections_df):
    """
    Calculates weighted z-scores for a predefined set of fantasy basketball stats
    and then sums them to create the swish_score.
    """
    df = projections_df.copy()
    print("Calculating z-scores...")
    for stat in Z_SCORE_STATS:
        col_name = f"{stat}_z_score"
        mean = df[stat].mean()
        std = df[stat].std()
        
        # Construct the key for the Z_SCORE_COLUMNS dictionary
        z_score_key_map = {
            'points': 'Points_ZScore',
            'rebounds': 'Rebounds_ZScore',
            'assists': 'Assists_ZScore',
            'steals': 'Steals_ZScore',
            'blocks': 'Blocks_ZScore',
            'turnovers': 'Turnovers_ZScore',
            'field_goal_pct': 'FieldGoalPct_ZScore',
            'free_throw_pct': 'FreeThrowPct_ZScore',
            'three_pointers_made': 'ThreePointersMade_ZScore'
        }
        weight_key = z_score_key_map.get(stat)
        weight = Z_SCORE_COLUMNS.get(weight_key, 1.0) # Default to 1.0 if not found

        if std > 0:
            z_score = (df[stat] - mean) / std
            if stat == 'turnovers':
                z_score *= -1  # Turnovers are negative in fantasy
            df[col_name] = z_score * weight
        else:
            df[col_name] = 0.0

    # Calculate the final Swish Score
    z_score_cols = [f"{s}_z_score" for s in Z_SCORE_STATS]
    df['swish_score'] = df[z_score_cols].sum(axis=1)
    
    print("Z-score and Swish Score calculation complete.")
    return df

def apply_reality_cap(projections_df, history_df, cap_increase_pct=0.20):
    """
    Caps the projected swish_score to prevent unrealistic leaps.

    Args:
        projections_df (pd.DataFrame): The projections with calculated swish_scores.
        history_df (pd.DataFrame): The full historical stats dataframe.
        cap_increase_pct (float): The maximum allowed percentage increase over a player's career-high swish_score.

    Returns:
        pd.DataFrame: Projections with the swish_score capped.
    """
    print("Applying reality cap to swish_score...")
    
    # Calculate career-high swish_score for each player
    career_highs = history_df.groupby('player_id')['swish_score'].max().reset_index()
    career_highs.rename(columns={'swish_score': 'career_high_swish_score'}, inplace=True)

    # Merge career highs into the projections
    projections_with_cap = pd.merge(projections_df, career_highs, on='player_id', how='left')
    projections_with_cap['career_high_swish_score'].fillna(0, inplace=True) # For rookies

    # Define the cap
    projections_with_cap['swish_score_cap'] = projections_with_cap['career_high_swish_score'] * (1 + cap_increase_pct)

    # Apply the cap
    projections_with_cap['original_swish_score'] = projections_with_cap['swish_score']
    projections_with_cap['swish_score'] = projections_with_cap[['swish_score', 'swish_score_cap']].min(axis=1)

    # Clean up columns
    projections_with_cap.drop(columns=['career_high_swish_score', 'swish_score_cap', 'original_swish_score'], inplace=True, errors='ignore')

    print("Reality cap applied.")
    return projections_with_cap

def upload_projections_to_db(projections_df, season):
    """
    Uploads the player stat projections and z-scores to the database.
    """
    if projections_df is None or projections_df.empty:
        print("No projections to upload.")
        return

    print(f"Connecting to the database to upload projections for {season}...")
    try:
        supabase = get_supabase_client(admin=True)
        upload_data = projections_df.copy()
        upload_data['season'] = season
        
        # Ensure required columns for DB exist
        if 'player_id' not in upload_data.columns:
             raise ValueError("Missing 'player_id' in projections DataFrame.")

        data_to_insert = upload_data.to_dict('records')

        response = supabase.table('player_projections').upsert(data_to_insert, on_conflict='player_id,season').execute()

        if len(response.data) > 0:
            print(f"Successfully uploaded/updated {len(response.data)} player projections.")
        else:
            print("Upload failed or nothing to upload. Response:", response.error or response.status_text)

    except Exception as e:
        print(f"An error occurred during database upload: {e}")

if __name__ == '__main__':
    projections, df_for_prediction, season, player_stats_df = predict_stats_for_next_season()

    if projections is not None:
        # Add player info (id, name, team) to the projections
        players_df = fetch_players()
        projections_with_info = projections.merge(df_for_prediction[['player_id', 'team', 'player_age']], left_index=True, right_index=True)
        projections_with_info = projections_with_info.merge(players_df[['player_id', 'full_name']], on='player_id', how='left')

        # Calculate z-scores and swish_score on the blended data
        projections_with_scores = calculate_z_scores_and_swish_score(projections_with_info)

        # Apply the reality cap as a final check
        final_projections = apply_reality_cap(projections_with_scores, player_stats_df)

        # Upload the results
        upload_projections_to_db(final_projections, season)

        # Display a sample of the predictions
        print("\n--- Predicted Player Stats for Next Season (Top 20 by Swish Score) ---")
        display_df = final_projections.sort_values(by='swish_score', ascending=False).head(20)
        display_cols = ['full_name', 'team', 'swish_score'] + STATS_TO_PROJECT
        # Ensure all display columns exist before trying to print
        display_cols = [col for col in display_cols if col in display_df.columns]
        print(display_df[display_cols].round(2).to_string(index=False, justify='right'))
        print("-------------------------------------------------------------------------------------")
