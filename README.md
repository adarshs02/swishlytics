# Fantasy Basketball Player Predictor

A Next.js application with a Python backend for data processing. It helps predict fantasy basketball player performance based on z-score analysis of their stats.

## Project Structure

- `/`: Root directory
  - `app/`: Main Next.js application directory (App Router).
    - `page.tsx`: The main page component for the user interface.
    - `layout.tsx`: The root layout for the application.
    - `globals.css`: Global stylesheets.
    - `api/`: Contains Next.js API route handlers.
      - `seasons/route.ts`: API endpoint to get available seasons.
      - `seasons/[season]/total_rankings/route.ts`: API endpoint to get player rankings for a specific season.
  - `python_scripts/`: Contains Python scripts for data collection and processing.
    - `collect_and_split_data.py`: Script to fetch raw player data and split it by season.
    - `calculate_combined_z_scores_by_season.py`: Script to calculate z-scores for each stat, per season.
    - `calculate_total_fantasy_scores.py`: Script to calculate the final total fantasy score and rank.
    - `requirements.txt`: Python dependencies.
  - `data/`: Directory for storing data files (CSVs of player stats).
  - `package.json`: Node.js project dependencies and scripts.
  - `.gitignore`: Specifies intentionally untracked files.
  - `README.md`: This file.

## Setup and Usage

### Prerequisites

- Node.js (v18.x or later recommended)
- npm (usually comes with Node.js)
- Python (v3.7.x or later recommended)
- pip (Python package installer)

### 1. Data Generation (Python)

Before running the web application, you need to generate the data files using the Python scripts.

1.  Navigate to the `python_scripts` directory:
    ```bash
    cd python_scripts
    ```
2.  It's recommended to use a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the data processing pipeline in order:
    ```bash
    python fetch_nba_data.py
    python collect_and_split_data.py
    python calculate_combined_z_scores_by_season.py
    python calculate_total_fantasy_scores.py
    ```

### 2. Running the Web Application (Next.js)

1.  Navigate to the project root directory.
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your web browser and go to `http://localhost:3000` to see the application.
