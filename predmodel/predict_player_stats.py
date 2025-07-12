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
    create_yoy_stats,
    create_age_and_experience_features,
    create_team_context_features
)
from db_connector import get_supabase_client
from config import STATS_TO_PROJECT, Z_SCORE_STATS, Z_SCORE_COLUMNS

def predict_stats_for_next_season(model_filename='multi_output_xgb_model.joblib'):
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
    model_path = os.path.join(script_dir, model_filename)

    print(f"Loading model from {model_path}...")
    model = joblib.load(model_path)
    print("Model loaded successfully.")

    print("Fetching and engineering features for prediction...")
    player_stats_df = fetch_player_stats()
    if player_stats_df is None:
        print("Could not fetch player stats. Aborting.")
        return None, None, None

    most_recent_season = player_stats_df['season'].max()
    prediction_season = f"{int(most_recent_season.split('-')[0]) + 1}-{str(int(most_recent_season.split('-')[1]) + 1)[-2:]}"
    print(f"Predicting stats for {prediction_season} based on {most_recent_season} data.")

    player_stats_df = create_per_minute_stats(player_stats_df)
    player_stats_df = create_yoy_stats(player_stats_df)
    player_stats_df = create_age_and_experience_features(player_stats_df)
    player_stats_df = create_team_context_features(player_stats_df)

    df_for_prediction = player_stats_df[player_stats_df['season'] == most_recent_season].copy()
    features = model.estimators_[0].get_booster().feature_names

    missing_features = [f for f in features if f not in df_for_prediction.columns]
    if missing_features:
        print(f"Error: Missing required features for prediction: {missing_features}")
        return None, None, None

    X_for_prediction = df_for_prediction[features]
    print("Making predictions...")
    predicted_stats = model.predict(X_for_prediction)

    df_predictions = pd.DataFrame(predicted_stats, columns=STATS_TO_PROJECT, index=df_for_prediction.index)
    print("Predictions complete.")

    return df_predictions, df_for_prediction, prediction_season

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
    projections, df_for_prediction, season = predict_stats_for_next_season()

    if projections is not None:
        # Add player info (id, name, team) to the projections
        players_df = fetch_players()
        projections = projections.merge(df_for_prediction[['player_id', 'team', 'player_age']], left_index=True, right_index=True)
        projections = projections.merge(players_df[['player_id', 'full_name']], on='player_id', how='left')

        # Calculate z-scores and swish_score
        projections_with_scores = calculate_z_scores_and_swish_score(projections)

        # Upload the results
        upload_projections_to_db(projections_with_scores, season)

        # Display a sample of the predictions
        print("\n--- Predicted Player Stats for Next Season (Top 20 by Swish Score) ---")
        display_df = projections_with_scores.sort_values(by='swish_score', ascending=False).head(20)
        display_cols = ['full_name', 'team', 'swish_score'] + STATS_TO_PROJECT
        # Ensure all display columns exist before trying to print
        display_cols = [col for col in display_cols if col in display_df.columns]
        print(display_df[display_cols].round(2).to_string(index=False, justify='right'))
        print("-------------------------------------------------------------------------------------")
