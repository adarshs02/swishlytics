import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_squared_error
import xgboost as xgb
import joblib
import sys
import os
from sklearn.multioutput import MultiOutputRegressor

# Add python_scripts to the path to import feature_engineering
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python_scripts')))
from feature_engineering import (
    fetch_player_stats, 
    create_per_minute_stats, 
    create_yoy_stats, 
    create_age_and_experience_features,
    create_team_context_features
)

# Import the stats we want to predict from our config file
from config import STATS_TO_PROJECT

# Define the stats we want to predict for the next season
TARGET_STATS = STATS_TO_PROJECT

def prepare_data_for_modeling(df, target_stats):
    """
    Prepares the data for multi-output regression modeling.

    Args:
        df (pd.DataFrame): The fully featured player stats DataFrame.
        target_stats (list): A list of column names to be used as targets.

    Returns:
        tuple: A tuple containing the modeling-ready DataFrame, feature names, and target names.
    """
    df_model = df.copy()
    target_names = []

    # Create the target variables: next season's stats
    for stat in target_stats:
        target_name = f'target_{stat}'
        df_model[target_name] = df_model.groupby('player_id')[stat].shift(-1)
        target_names.append(target_name)

    # Drop rows where any target is NaN (i.e., the last season for each player)
    df_model.dropna(subset=target_names, inplace=True)

    # Define features
    features = [
        'player_age', 'games_played', 'avg_minutes', 'points', 'rebounds', 'assists',
        'steals', 'blocks', 'turnovers', 'field_goal_pct', 'free_throw_pct',
        'three_pointers_made', 'true_shooting_pct', 'usage_rate', 'swish_score',
        'field_goals_made', 'field_goal_attempts', 'free_throws_made', 'free_throw_attempts', 'three_point_attempts',
        'points_per_36_min', 'rebounds_per_36_min', 'assists_per_36_min',
        'steals_per_36_min', 'blocks_per_36_min', 'turnovers_per_36_min',
        'three_pointers_made_per_36_min', 'points_yoy_diff',
        'rebounds_yoy_diff', 'assists_yoy_diff', 'steals_yoy_diff',
        'blocks_yoy_diff', 'turnovers_yoy_diff', 'three_pointers_made_yoy_diff',
        'swish_score_yoy_diff', 'usage_rate_yoy_diff', 'true_shooting_pct_yoy_diff',
        'player_age_sq', 'years_in_league', 'vacated_usage'
    ]
    
    # Drop rows with any remaining NaN values in feature columns
    df_model.dropna(subset=features, inplace=True)

    return df_model, features, target_names

if __name__ == '__main__':
    # 1. Fetch and engineer features
    player_stats_df = fetch_player_stats()
    if player_stats_df is not None:
        player_stats_df = create_per_minute_stats(player_stats_df)
        player_stats_df = create_yoy_stats(player_stats_df)
        player_stats_df = create_age_and_experience_features(player_stats_df)
        player_stats_df = create_team_context_features(player_stats_df)

        # 2. Prepare data for modeling
        df_model, features, targets = prepare_data_for_modeling(player_stats_df, STATS_TO_PROJECT)
        
        # Time Series Cross-Validation for robust evaluation
        tscv = TimeSeriesSplit(n_splits=5)
        X = df_model[features]
        y = df_model[targets]

        print("\nRunning Time Series Cross-Validation...")
        
        # Store MSE for each target across all folds
        xgb_mses_by_target = {target: [] for target in targets}

        for i, (train_index, test_index) in enumerate(tscv.split(X)):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]

            # Train and evaluate MultiOutput XGBoost
            xgb_model = MultiOutputRegressor(
                xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100, random_state=42)
            )
            xgb_model.fit(X_train, y_train)
            xgb_preds = xgb_model.predict(X_test)
            
            # Calculate MSE for each target
            fold_mses = mean_squared_error(y_test, xgb_preds, multioutput='raw_values')
            for target_idx, target_name in enumerate(targets):
                xgb_mses_by_target[target_name].append(fold_mses[target_idx])
            
            print(f"  Fold {i+1}: Train size={len(X_train)}, Test size={len(X_test)}, Avg XGB MSE={np.mean(fold_mses):.4f}")

        print("\n--- Average Cross-Validation MSE by Stat ---")
        for target, mses in xgb_mses_by_target.items():
            print(f"  {target.replace('target_', ''):<20}: {np.mean(mses):.4f}")
        print("----------------------------------------")

        # Hyperparameter tuning for XGBoost
        print("\nRunning GridSearchCV for XGBoost...")
        # Note: We tune the base estimator, not the MultiOutputRegressor wrapper
        param_grid = {
            'estimator__n_estimators': [100, 200],
            'estimator__max_depth': [3, 5],
            'estimator__learning_rate': [0.05, 0.1],
            'estimator__subsample': [0.7, 1.0]
        }

        base_xgb = xgb.XGBRegressor(objective='reg:squarederror', random_state=42)
        multi_output_xgb = MultiOutputRegressor(base_xgb)
        
        grid_search = GridSearchCV(estimator=multi_output_xgb, param_grid=param_grid, 
                                 cv=tscv, scoring='neg_mean_squared_error', n_jobs=-1, verbose=1)
        
        grid_search.fit(X, y)

        print("\nBest parameters found:", grid_search.best_params_)
        
        best_xgb_mse = -grid_search.best_score_

        print("\n--- Tuned XGBoost Model Evaluation ---")
        print(f"Tuned XGBoost CV MSE (averaged over all stats): {best_xgb_mse:.4f}")
        print("------------------------------------")

        # Train the final model on all data with the best parameters
        print("\nTraining the final model on all available data...")
        final_model_params = {key.replace('estimator__', ''): value for key, value in grid_search.best_params_.items()}
        final_base_model = xgb.XGBRegressor(objective='reg:squarederror', **final_model_params, random_state=42)
        final_model = MultiOutputRegressor(final_base_model)
        final_model.fit(X, y)
        print("Final model training complete.")

        # --- Aggregated Feature Importance ---
        feature_importances = np.zeros(len(features))
        for estimator in final_model.estimators_:
            feature_importances += estimator.feature_importances_
        feature_importances /= len(final_model.estimators_)

        feature_importance_df = pd.DataFrame({'feature': features, 'importance': feature_importances})
        feature_importance_df = feature_importance_df.sort_values(by='importance', ascending=False)

        print("\n--- Top 10 Most Important Features (Averaged Across All Models) ---")
        print(feature_importance_df.head(10).to_string(index=False))
        print("---------------------------------------------------------------------")

        # Save the final model
        model_filename = 'multi_output_xgb_model.joblib'
        joblib.dump(final_model, model_filename)
        print(f"Model saved to {model_filename}")
