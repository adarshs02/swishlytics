# Fantasy Basketball Player Predictor

A Node.js application with a Python backend to help predict fantasy basketball players to target or avoid based on statistical analysis.

## Project Structure

- `/`: Root directory
  - `server.js`: Main Node.js Express server entry point.
  - `package.json`: Node.js project dependencies and scripts.
  - `public/`: Contains static frontend assets.
    - `index.html`: Main HTML page.
    - `css/style.css`: Basic stylesheets.
    - `js/main.js`: Frontend JavaScript.
  - `python_scripts/`: Contains Python scripts for data processing and machine learning.
    - `data_processing.py`: Example Python script for handling data.
    - `requirements.txt`: Python dependencies.
  - `data/`: Directory for storing data files (e.g., CSVs of player stats).
  - `.gitignore`: Specifies intentionally untracked files that Git should ignore.
  - `README.md`: This file.

## Setup and Installation

### Prerequisites

- Node.js (v14.x or later recommended)
- npm (usually comes with Node.js)
- Python (v3.7.x or later recommended)
- pip (Python package installer)

### Node.js Backend

1.  Navigate to the project root directory.
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    Or for development with automatic restarts (requires `nodemon`):
    ```bash
    npm run dev
    ```
    The server will typically run on `http://localhost:3000`.

### Python Backend

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
4.  Run Python scripts as needed, for example:
    ```bash
    python fetch_nba_data.py
    ```

## How to Use

1.  Ensure the Node.js server is running.
2.  Open your web browser and go to `http://localhost:3000` (or the configured port).
3.  The Python scripts in `python_scripts/` can be run independently for data processing, model training, etc. The Node.js server can be configured to execute these scripts or communicate with a Python API (if you choose to build one later).

## Future Enhancements

-   Connect Node.js backend to Python scripts for dynamic data retrieval and predictions.
-   Implement a database for storing player data and user information.
-   Develop machine learning models in Python for player performance prediction.
-   Create a more interactive frontend to display predictions and insights.
-   Add user authentication and personalized dashboards.
