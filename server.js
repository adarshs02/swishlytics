const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Fantasy Stats API Endpoints ---
const Z_SCORES_DATA_DIR = path.join(__dirname, 'data', 'z_scores_by_season');
const TOTAL_FANTASY_SCORES_DATA_DIR = path.join(__dirname, 'data', 'total_fantasy_scores_by_season');

// Endpoint to get available seasons
app.get('/api/seasons', (req, res) => {
  fs.readdir(Z_SCORES_DATA_DIR, { withFileTypes: true }, (err, dirents) => {
    if (err) {
      console.error('Error reading seasons directory:', err);
      return res.status(500).json({ error: 'Failed to retrieve seasons' });
    }
    const seasons = dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort((a, b) => b.localeCompare(a)); // Sort descending, newest first
    res.json(seasons);
  });
});

// Endpoint to get available stats for a given season
app.get('/api/seasons/:season/stats', (req, res) => {
  const { season } = req.params;
  const seasonPath = path.join(Z_SCORES_DATA_DIR, season);
  console.log(`[Server API] Reading stats for season: ${season} from path: ${seasonPath}`); // Server-side log

  fs.readdir(seasonPath, (err, files) => {
    if (err) {
      console.error(`[Server API] Error reading stats for season ${season}:`, err);
      return res.status(404).json({ error: `Stats not found for season ${season}` });
    }
    console.log(`[Server API] Files found in ${seasonPath}:`, files); // Server-side log of raw files

    const stats = files
      .filter(file => file.endsWith('_z_score_ranking.csv'))
      .map(file => file.replace('_z_score_ranking.csv', ''));
    
    console.log(`[Server API] Parsed stats for ${season}:`, stats); // Server-side log of parsed stats
    res.json(stats);
  });
});

// Endpoint to get player rankings for a specific season and stat
app.get('/api/seasons/:season/rankings/:stat', (req, res) => {
  const { season, stat } = req.params;
  // Sanitize stat name to prevent directory traversal, although path.join should handle it.
  // For example, ensure 'stat' doesn't contain '..' or '/'.
  // A simple check: if (stat.includes('.') || stat.includes('/')) return res.status(400).json(...)
  const statFileName = `${stat}_z_score_ranking.csv`;
  const filePath = path.join(Z_SCORES_DATA_DIR, season, statFileName);

  const results = [];
  fs.createReadStream(filePath)
    .on('error', (error) => {
      console.error(`Error reading ranking file ${filePath}:`, error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: `Rankings not found for ${stat} in season ${season}` });
      }
      return res.status(500).json({ error: 'Failed to retrieve rankings' });
    })
    .pipe(csv())
    .on('data', (data) => {
      const zScoreKey = `${stat}_ZScore`;
      const rawStatKey = stat; // The column for the raw stat is simply the stat name
      
      const zScore = parseFloat(data[zScoreKey]);
      const formattedZScore = !isNaN(zScore) ? parseFloat(zScore.toFixed(3)) : null;

      results.push({
        Rank: data.Rank,
        PlayerName: data.PlayerName,
        [rawStatKey]: data[rawStatKey], // e.g., Points: data.Points
        ZScore: formattedZScore
      });
    })
    .on('end', () => {
      res.json(results);
    });
});

// Endpoint to get player rankings by total fantasy z-score for a specific season
app.get('/api/seasons/:season/total_rankings', (req, res) => {
  const { season } = req.params;
  const filePath = path.join(TOTAL_FANTASY_SCORES_DATA_DIR, `${season}_total_scores.csv`);

  const results = [];
  fs.createReadStream(filePath)
    .on('error', (error) => {
      console.error(`Error reading total ranking file ${filePath}:`, error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: `Total rankings not found for season ${season}` });
      }
      return res.status(500).json({ error: 'Failed to retrieve total rankings' });
    })
    .pipe(csv())
    .on('data', (data) => {
      const totalZScore = parseFloat(data.Total_Fantasy_ZScore);
      const formattedTotalZScore = !isNaN(totalZScore) ? parseFloat(totalZScore.toFixed(3)) : null;

      results.push({
        Overall_Rank: data.Overall_Rank,
        PlayerName: data.PlayerName,
        Points: data.Points,
        Rebounds: data.Rebounds,
        Assists: data.Assists,
        Steals: data.Steals,
        Blocks: data.Blocks,
        FieldGoalPct: data.FieldGoalPct,
        ThreePointPct: data.ThreePointPct,
        FreeThrowPct: data.FreeThrowPct,
        Turnovers: data.Turnovers,
        Total_Fantasy_ZScore: formattedTotalZScore
      });
    })
    .on('end', () => {
      res.json(results);
    });
});

// Original basic API endpoint (can be removed or kept for other purposes)
app.get('/api/players', (req, res) => {
  // In the future, this will interact with Python scripts or a database
  res.json({ message: 'Player data will be here soon!' });
});

// Catch-all for SPA (if you decide to build one)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
