#there is something wrong with this file and how pandas is reading the csv file, DO NOT USE THIS FILE!!!!!!!



import pandas as pd
import os
import csv

# --- Configuration ---
DATA_DIR = '../data'
SOURCE_FILENAME = 'nba_player_stats_last_10_years.csv'
SOURCE_FILE_PATH = os.path.join(DATA_DIR, SOURCE_FILENAME)

def main():
    """Main function to load, split, and save the data using pandas for reading and Python's native csv for writing."""
    # Check if the source file exists
    if not os.path.exists(SOURCE_FILE_PATH):
        print(f"Error: Source file not found at {SOURCE_FILE_PATH}")
        print("Please run the fetch_nba_data.py script first to generate the data.")
        return

    print(f"Loading data from {SOURCE_FILE_PATH}...")
    try:
        main_df = pd.read_csv(SOURCE_FILE_PATH)
    except Exception as e:
        print(f"Error reading the CSV file: {e}")
        return

    if 'Season' not in main_df.columns or 'PlayerAge' not in main_df.columns:
        print("Error: 'Season' or 'PlayerAge' column not found in the source DataFrame.")
        return

    # Get a list of unique seasons
    seasons = main_df['Season'].unique()
    print(f"Found {len(seasons)} unique seasons: {seasons}")

    # Loop through each season, filter, and save
    for season in seasons:
        print(f"Processing season: {season}...")
        season_df = main_df[main_df['Season'] == season].copy()

        # Define output path
        output_filename = f"nba_stats_{season}.csv"
        output_path = os.path.join(DATA_DIR, output_filename)

        try:
            # Get the list of columns from the dataframe itself
            columns_to_write = list(season_df.columns)
            # Save the filtered dataframe to a new CSV file, explicitly specifying columns
            season_df.to_csv(output_path, index=False, columns=columns_to_write)
            print(f"  Successfully saved data for season {season} to {output_path}")
        except Exception as e:
            print(f"  Error saving data for season {season}: {e}")

    print("\nData splitting process completed.")

if __name__ == "__main__":
    main()
