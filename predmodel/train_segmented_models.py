import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor
import joblib
import sys
import os

# Add python_scripts to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_scripts')))
from feature_engineering import (
    fetch_player_stats,
    create_per_minute_stats,
    create_historical_features,
    create_age_and_experience_features,
    create_team_context_features
)
from config import STATS_TO_PROJECT

# Define age segments for model training
AGE_SEGMENTS = {
    'prime': {'max_age': 28, 'model_name': 'xgb_model_prime.joblib'},
    'veteran': {'min_age': 29, 'max_age': 33, 'model_name': 'xgb_model_veteran.joblib'},
    'senior': {'min_age': 34, 'model_name': 'xgb_model_senior.joblib'}
}

def train_and_save_models_by_age():
    """
    Fetches data, engineers features, segments data by player age,
    and trains a separate model for each segment.
    """
    print("Fetching player data...")
    player_stats_df = fetch_player_stats()
    if player_stats_df is None:
        print("Could not fetch player stats. Aborting training.")
        return

    print("Engineering features...")
    # Apply the same feature engineering pipeline as the prediction script
    player_stats_df = create_per_minute_stats(player_stats_df)
    player_stats_df = create_historical_features(player_stats_df)
    player_stats_df = create_age_and_experience_features(player_stats_df)
    player_stats_df = create_team_context_features(player_stats_df)
    
    # Drop rows with NaNs created by feature engineering
    player_stats_df.dropna(subset=STATS_TO_PROJECT, inplace=True)

    # Use the feature list from the existing model to ensure consistency
    script_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        original_model_path = os.path.join(script_dir, 'multi_output_xgb_model.joblib')
        original_model = joblib.load(original_model_path)
        features = original_model.estimators_[0].get_booster().feature_names
        print(f"Successfully loaded feature list from {original_model_path}")
    except Exception as e:
        print(f"Could not load original model to get feature list: {e}")
        print("Aborting: A consistent feature list is required for training.")
        return

    player_stats_df.dropna(subset=features, inplace=True)

    y = player_stats_df[STATS_TO_PROJECT]
    X = player_stats_df[features]

    # Train a model for each segment
    for segment, params in AGE_SEGMENTS.items():
        print(f"\n--- Training model for {segment} segment ---")
        
        min_age = params.get('min_age', 0)
        max_age = params.get('max_age', 100)
        
        segment_indices = player_stats_df[
            (player_stats_df['player_age'] >= min_age) & 
            (player_stats_df['player_age'] <= max_age)
        ].index
        
        X_segment = X.loc[segment_indices]
        y_segment = y.loc[segment_indices]

        if len(X_segment) < 100:
            print(f"Warning: Not enough data for segment '{segment}' (found {len(X_segment)} samples). Skipping.")
            continue
        
        print(f"Training on {len(X_segment)} samples...")

        # Use the same XGBoost parameters as the original model for consistency
        xgb_estimator = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=150, learning_rate=0.05, max_depth=4, subsample=0.8, colsample_bytree=0.8, random_state=42)
        multi_output_model = MultiOutputRegressor(estimator=xgb_estimator)
        
        multi_output_model.fit(X_segment, y_segment)
        
        # Save the trained model
        model_filename = os.path.join(script_dir, params['model_name'])
        joblib.dump(multi_output_model, model_filename)
        print(f"Model for '{segment}' segment saved to {model_filename}")

if __name__ == '__main__':
    train_and_save_models_by_age()
