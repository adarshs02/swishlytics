import pandas as pd
import numpy as np
import os

def load_data(file_path):
    """Loads player data from a CSV file."""
    try:
        df = pd.read_csv(file_path)
        print(f"Data loaded successfully from {file_path}")
        return df
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}. Will attempt to create dummy data.")
        return None
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return None

def basic_stat_summary(df):
    """Provides a basic statistical summary of the data."""
    if df is not None and not df.empty:
        print("\nBasic Data Summary:")
        print(df.head())
        print("\nData Description:")
        print(df.describe())
    else:
        print("No data or empty dataframe to summarize.")

if __name__ == "__main__":
    data_dir = '../data'
    dummy_data_filename = 'dummy_player_stats.csv'
    dummy_data_path = os.path.join(data_dir, dummy_data_filename)

    player_data_df = load_data(dummy_data_path)

    if player_data_df is None:
        print(f"Attempting to create dummy data at {dummy_data_path}...")
        data = {
            'PlayerID': [1, 2, 3, 4, 5],
            'Name': ['Player A', 'Player B', 'Player C', 'Player D', 'Player E'],
            'Points': [25, 22, 18, 30, 15],
            'Rebounds': [10, 8, 7, 12, 5],
            'Assists': [5, 7, 6, 4, 8]
        }
        dummy_df = pd.DataFrame(data)
        
        try:
            if not os.path.exists(data_dir):
                print(f"Creating data directory: {data_dir}")
                os.makedirs(data_dir)
            
            dummy_df.to_csv(dummy_data_path, index=False)
            print(f"Dummy data successfully created at {dummy_data_path}")
            player_data_df = load_data(dummy_data_path)
        except Exception as e:
            print(f"Error creating dummy data file: {e}")

    if player_data_df is not None:
        basic_stat_summary(player_data_df)
        print("\nPython script execution complete. Further processing can be added here.")
    else:
        print("Could not load or create data. Please check permissions and paths.")
