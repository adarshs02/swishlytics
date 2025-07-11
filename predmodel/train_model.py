import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import xgboost as xgb
import joblib
import sys
import os

# Add python_scripts to the path to import feature_engineering
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_scripts')))
from feature_engineering import (
    fetch_player_stats, 
    create_per_minute_stats, 
    create_yoy_stats, 
    create_age_and_experience_features,
    create_team_context_features
)

def prepare_data_for_modeling(df):
    """
    Prepares the data for modeling by creating the target variable and features.

    Args:
        df (pd.DataFrame): The fully featured player stats DataFrame.

    Returns:
        tuple: A tuple containing features (X) and target (y).
    """
    # Create the target variable: next season's swish_score
    df['target_swish_score'] = df.groupby('player_id')['swish_score'].shift(-1)

    # Drop rows where the target is NaN (i.e., the last season for each player)
    df_model = df.dropna(subset=['target_swish_score'])

    # Define features and target
    # Keep 'season' for the time-based split
    features = [
        'player_age', 'games_played', 'avg_minutes', 'points', 'rebounds', 'assists',
        'steals', 'blocks', 'turnovers', 'field_goal_pct', 'free_throw_pct',
        'three_pointers_made', 'true_shooting_pct', 'usage_rate', 'swish_score',
        'points_per_36_min', 'rebounds_per_36_min', 'assists_per_36_min',
        'steals_per_36_min', 'blocks_per_36_min', 'turnovers_per_36_min',
        'three_pointers_made_per_36_min', 'points_yoy_diff',
        'rebounds_yoy_diff', 'assists_yoy_diff', 'steals_yoy_diff',
        'blocks_yoy_diff', 'turnovers_yoy_diff', 'three_pointers_made_yoy_diff',
        'swish_score_yoy_diff', 'usage_rate_yoy_diff', 'true_shooting_pct_yoy_diff',
        'player_age_sq', 'years_in_league', 'vacated_usage'
    ]
    
    # Drop rows with any remaining NaN values in feature columns
    # Keep season for splitting, then drop it from the final feature set
    df_model = df_model[['season'] + features + ['target_swish_score']].dropna()

    X = df_model[features]
    y = df_model['target_swish_score']

    # Return the full dataframe for splitting
    return df_model, features

if __name__ == '__main__':
    # 1. Fetch and engineer features
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

        # 2. Prepare data for modeling
        df_model, features = prepare_data_for_modeling(player_stats_df)
        
        # Time Series Cross-Validation for robust evaluation
        tscv = TimeSeriesSplit(n_splits=5)
        X = df_model[features]
        y = df_model['target_swish_score']

        lr_mses = []
        xgb_mses = []

        print("\nRunning Time Series Cross-Validation...")
        for i, (train_index, test_index) in enumerate(tscv.split(X)):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]

            # Train and evaluate Linear Regression
            lr_model = LinearRegression()
            lr_model.fit(X_train, y_train)
            lr_preds = lr_model.predict(X_test)
            lr_mse = mean_squared_error(y_test, lr_preds)
            lr_mses.append(lr_mse)

            # Train and evaluate XGBoost
            xgb_model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100, random_state=42)
            xgb_model.fit(X_train, y_train)
            xgb_preds = xgb_model.predict(X_test)
            xgb_mse = mean_squared_error(y_test, xgb_preds)
            xgb_mses.append(xgb_mse)
            
            print(f"  Fold {i+1}: Train size={len(X_train)}, Test size={len(X_test)}, LR MSE={lr_mse:.4f}, XGB MSE={xgb_mse:.4f}")

        print("\n--- Cross-Validation Results ---")
        print(f"Average Linear Regression MSE: {np.mean(lr_mses):.4f}")
        print(f"Average XGBoost MSE (default params): {np.mean(xgb_mses):.4f}")
        print("----------------------------------------")

        # 7. Hyperparameter tuning for XGBoost
        print("\nRunning GridSearchCV for XGBoost...")
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5, 7],
            'learning_rate': [0.05, 0.1],
            'subsample': [0.7, 1.0]
        }

        xgb_model = xgb.XGBRegressor(objective='reg:squarederror', random_state=42)
        
        # Use TimeSeriesSplit for cross-validation in GridSearchCV
        grid_search = GridSearchCV(estimator=xgb_model, param_grid=param_grid, 
                                 cv=tscv, scoring='neg_mean_squared_error', n_jobs=-1, verbose=1)
        
        grid_search.fit(X, y)

        print("\nBest parameters found:", grid_search.best_params_)
        
        # Evaluate the best model from grid search
        best_xgb_mse = -grid_search.best_score_

        print("\n--- Tuned XGBoost Model Evaluation ---")
        print(f"Tuned XGBoost CV MSE: {best_xgb_mse:.4f}")
        print("------------------------------------")

        # 8. Train the final model on all data with the best parameters
        print("\nTraining the final model on all available data...")
        final_model = xgb.XGBRegressor(objective='reg:squarederror', **grid_search.best_params_, random_state=42)
        final_model.fit(X, y)
        print("Final model training complete.")

        # --- Feature Importance ---
        feature_names = X.columns
        importances = final_model.feature_importances_
        feature_importance_df = pd.DataFrame({'feature': feature_names, 'importance': importances})
        feature_importance_df = feature_importance_df.sort_values(by='importance', ascending=False)

        print("\n--- Feature Importances ---")
        print(feature_importance_df.to_string(index=False))
        print("--------------------------------------")
        # --------------------------

        # 9. Save the final model
        model_filename = 'final_xgb_model.joblib'
        joblib.dump(final_model, model_filename)
        print(f"Model saved to {model_filename}")
