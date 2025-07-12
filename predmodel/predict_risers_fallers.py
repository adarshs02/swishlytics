import pandas as pd
import joblib
import sys
import os
import shap

# Add python_scripts to the path to import feature_engineering
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_scripts')))
from feature_engineering import (
    fetch_player_stats, 
    fetch_players,
    create_per_minute_stats, 
    create_yoy_stats, 
    create_age_and_experience_features,
    create_team_context_features
)

def explain_prediction_with_shap(model, X_train, player_instance, top_n=5):
    """
    Explains a single prediction using SHAP.

    Args:
        model: The trained model.
        X_train (pd.DataFrame): The training data used to build the SHAP explainer.
        player_instance (pd.DataFrame): The specific player instance to explain.
        top_n (int): The number of top features to display.
    """
    explainer = shap.TreeExplainer(model)
    
    # We need to align the columns of the player_instance with the training data
    player_instance_aligned = player_instance[X_train.columns]

    shap_values = explainer.shap_values(player_instance_aligned)
    
    # Create a DataFrame for easier manipulation
    feature_names = X_train.columns
    shap_df = pd.DataFrame(shap_values, columns=feature_names)
    
    # Get the top N contributing features
    top_features = shap_df.iloc[0].sort_values(ascending=False)
    
    print("\n--- Key Factors for Prediction ---")
    print("Top 5 features pushing prediction higher:")
    for feature, shap_value in top_features.head(top_n).items():
        print(f"  - {feature}: {shap_value:+.3f}")
    
    print("\nTop 5 features pushing prediction lower:")
    for feature, shap_value in top_features.tail(top_n).sort_values().items():
        print(f"  - {feature}: {shap_value:+.3f}")

    print("----------------------------------")

def make_predictions(df, model, all_training_data):
    """
    Generates predictions for the upcoming season.

    Args:
        df (pd.DataFrame): DataFrame with the latest season's data and features.
        model: The trained model.

    Returns:
        pd.DataFrame: DataFrame with added prediction and riser/faller scores.
    """
    # Get the feature names from the trained model
    features = model.feature_names_in_
    
    # Define columns to keep, including player_id
    cols_to_keep = ['player_id'] + list(features)

    # Ensure all feature columns exist
    for col in features:
        if col not in df.columns:
            df[col] = 0

    # Create a clean dataframe with player_id and features, dropping rows with missing values
    df_pred = df[cols_to_keep].dropna()

    if df_pred.empty:
        print("No data available for prediction after cleaning.")
        return None

    # Separate features for prediction
    X_for_prediction = df_pred[features]

    predictions = model.predict(X_for_prediction)
    df_pred['predicted_swish_score'] = predictions

    # Calculate riser/faller score
    df_pred['riser_faller_score'] = df_pred['predicted_swish_score'] - df_pred['swish_score']

    # Attach model and training data for SHAP explanations
    df_pred.attrs['model'] = model
    df_pred.attrs['X_train'] = all_training_data[features]

    return df_pred

def display_risers_fallers(predictions_df, prediction_season, min_minutes=28):
    """
    Displays the top risers and fallers and explains the top predictions.
    """
    # Merge with player names for readability
    players_df = fetch_players()
    if players_df is not None:
        merged_df = pd.merge(predictions_df, players_df, on='player_id', how='left')
    else:
        merged_df = predictions_df.copy()
        merged_df['full_name'] = 'N/A'

    # Filter for players who played significant minutes
    if 'avg_minutes' in merged_df.columns:
        filtered_df = merged_df[merged_df['avg_minutes'] >= min_minutes]
    else:
        print("Warning: 'avg_minutes' column not found. Cannot filter by minutes played.")
        filtered_df = merged_df

    if filtered_df.empty:
        print(f"No players found who played at least {min_minutes} MPG.")
        return

    # Sort by riser/faller score
    sorted_df = filtered_df.sort_values(by='riser_faller_score', ascending=False)

    risers = sorted_df.head(10)
    fallers = sorted_df.tail(10).sort_values(by='riser_faller_score', ascending=True)

    print(f"\n--- Top 10 Potential Risers for {prediction_season} (min. {min_minutes} MPG) ---")
    print(risers[['full_name', 'swish_score', 'predicted_swish_score', 'riser_faller_score']].to_string(index=False))

    print(f"\n--- Top 10 Potential Fallers for {prediction_season} (min. {min_minutes} MPG) ---")
    print(fallers[['full_name', 'swish_score', 'predicted_swish_score', 'riser_faller_score']].to_string(index=False))

    # --- SHAP Explanations for Top Riser and Faller ---
    if not risers.empty and not fallers.empty:
        model = predictions_df.attrs['model']
        X_train = predictions_df.attrs['X_train']

        top_riser_id = risers.iloc[0]['player_id']
        top_faller_id = fallers.iloc[0]['player_id']

        # Get the instance data from the original predictions_df before merging
        top_riser_instance = predictions_df[predictions_df['player_id'] == top_riser_id]
        top_faller_instance = predictions_df[predictions_df['player_id'] == top_faller_id]

        print(f"\n\n--- Explanation for Top Riser: {risers.iloc[0]['full_name']} ---")
        explain_prediction_with_shap(model, X_train, top_riser_instance, top_n=10)

        print(f"\n--- Explanation for Top Faller: {fallers.iloc[0]['full_name']} ---")
        explain_prediction_with_shap(model, X_train, top_faller_instance, top_n=10)
    # -------------------------------------------------

if __name__ == '__main__':
    # 1. Load the trained model
    model_filename = 'final_xgb_model.joblib'
    try:
        final_model = joblib.load(model_filename)
        print(f"Model loaded from {model_filename}")
    except FileNotFoundError:
        print(f"Error: Model file not found at {model_filename}. Please run train_model.py first.")
        sys.exit(1)

    # 2. Fetch all data and engineer features
    player_stats_df = fetch_player_stats()
    if player_stats_df is not None:
        # --- TEMPORARY FILTER FOR TESTING ---
        print("Applying temporary filter: Using data only up to the 2023-24 season.")
        player_stats_df = player_stats_df[player_stats_df['season'] <= '2023-24']
        # ------------------------------------

        player_stats_df = create_per_minute_stats(player_stats_df)
        player_stats_df = create_yoy_stats(player_stats_df)
        player_stats_df = create_age_and_experience_features(player_stats_df)
        player_stats_df = create_team_context_features(player_stats_df)

        # 3. Find the latest season that has a preceding season for YoY calculations
        all_seasons_in_df = sorted(player_stats_df['season'].unique(), reverse=True)
        latest_season_for_pred = None

        for season in all_seasons_in_df:
            season_start_year = int(season.split('-')[0])
            prev_season_start_year = season_start_year - 1
            prev_season = f"{prev_season_start_year}-{str(season_start_year)[-2:]}"
            
            if prev_season in all_seasons_in_df:
                latest_season_for_pred = season
                break

        if not latest_season_for_pred:
            print("Could not find a season with a consecutive previous season to make predictions.")
            sys.exit(1)

        prediction_season_start = int(latest_season_for_pred.split('-')[0]) + 1
        prediction_season = f"{prediction_season_start}-{str(prediction_season_start+1)[-2:]}"

        print(f"\nMaking predictions for the {prediction_season} season based on {latest_season_for_pred} stats...")

        prediction_data = player_stats_df[player_stats_df['season'] == latest_season_for_pred].copy()

        # 4. Make predictions using the entire historical dataframe for SHAP context
        predictions_df = make_predictions(prediction_data, final_model, player_stats_df)

        if predictions_df is not None:
            # 5. Display top risers and fallers with explanations
            display_risers_fallers(predictions_df, prediction_season)
