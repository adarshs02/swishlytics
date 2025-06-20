document.addEventListener('DOMContentLoaded', () => {
    console.log('Fantasy Player Predictor App Initialized');

    const seasonSelect = document.getElementById('season-select');
    const rankingsTableBody = document.getElementById('rankings-tbody');
    const currentRankingTitle = document.getElementById('current-ranking-title');
    const noDataMessage = document.getElementById('no-data-message');

    let selectedSeason = '';

    // --- Fetch and Populate Seasons ---
    fetch('/api/seasons')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(seasons => {
            console.log('Fetched seasons:', seasons);

            let placeholderOption = seasonSelect.querySelector('option[value=""]');
            if (!placeholderOption) {
                placeholderOption = document.createElement('option');
                placeholderOption.value = "";
                placeholderOption.textContent = "-- Select a Season --";
                seasonSelect.prepend(placeholderOption);
            }
            
            Array.from(seasonSelect.options).forEach(option => {
                if (option.value !== "") option.remove();
            });

            if (!seasons || seasons.length === 0) {
                if (seasonSelect.options.length === 1 && seasonSelect.options[0].value === "") {
                     seasonSelect.options[0].textContent = "No seasons available";
                }
                return;
            }

            seasons.forEach(season => {
                const option = document.createElement('option');
                option.value = season;
                option.textContent = season;
                seasonSelect.appendChild(option);
            });
            seasonSelect.value = ""; 

            if (seasons && seasons.length > 0) {
                seasonSelect.value = seasons[0];
                const event = new Event('change');
                seasonSelect.dispatchEvent(event);
            }
        })
        .catch(error => {
            console.error('Error fetching seasons:', error);
            seasonSelect.innerHTML = '<option value="">Error loading seasons</option>';
        });

    // --- Event Listener for Season Selection ---
    seasonSelect.addEventListener('change', (event) => {
        selectedSeason = event.target.value;
        console.log(`Season selected: ${selectedSeason}`);

        rankingsTableBody.innerHTML = ''; 
        currentRankingTitle.textContent = 'Player Total Fantasy Rankings';
        noDataMessage.classList.add('hidden');

        if (!selectedSeason) {
            console.log('No season selected, returning.');
            return;
        }
        fetchAndDisplayTotalRankings(selectedSeason);
    });

    // --- Function to Fetch and Display Total Fantasy Rankings ---
    function fetchAndDisplayTotalRankings(season) {
        rankingsTableBody.innerHTML = '';
        noDataMessage.classList.add('hidden');
        currentRankingTitle.textContent = `Player Total Fantasy Rankings: ${season}`;

        fetch(`/api/seasons/${season}/total_rankings`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}`);
                }
                return response.json();
            })
            .then(rankings => {
                if (!rankings || rankings.length === 0) {
                    noDataMessage.textContent = 'No total ranking data available for this season.';
                    noDataMessage.classList.remove('hidden');
                    console.log('No total rankings found or rankings array is empty for season:', season);
                    return;
                }
                
                console.log(`Fetched total rankings for ${season}:`, rankings);

                rankings.forEach(player => {
                    const row = rankingsTableBody.insertRow();
                    row.insertCell().textContent = player.Overall_Rank !== null && player.Overall_Rank !== undefined ? player.Overall_Rank : 'N/A';
                    row.insertCell().textContent = player.PlayerName || 'N/A';
                    row.insertCell().textContent = player.Points !== null && player.Points !== undefined ? player.Points : 'N/A';
                    row.insertCell().textContent = player.Rebounds !== null && player.Rebounds !== undefined ? player.Rebounds : 'N/A';
                    row.insertCell().textContent = player.Assists !== null && player.Assists !== undefined ? player.Assists : 'N/A';
                    row.insertCell().textContent = player.Steals !== null && player.Steals !== undefined ? player.Steals : 'N/A';
                    row.insertCell().textContent = player.Blocks !== null && player.Blocks !== undefined ? player.Blocks : 'N/A';
                    row.insertCell().textContent = player.FieldGoalPct !== null && player.FieldGoalPct !== undefined ? Number(player.FieldGoalPct).toFixed(3) : 'N/A';
                    row.insertCell().textContent = player.ThreePointPct !== null && player.ThreePointPct !== undefined ? Number(player.ThreePointPct).toFixed(3) : 'N/A';
                    row.insertCell().textContent = player.FreeThrowPct !== null && player.FreeThrowPct !== undefined ? Number(player.FreeThrowPct).toFixed(3) : 'N/A';
                    row.insertCell().textContent = player.Turnovers !== null && player.Turnovers !== undefined ? player.Turnovers : 'N/A';
                    row.insertCell().textContent = player.Total_Fantasy_ZScore !== null && player.Total_Fantasy_ZScore !== undefined ? player.Total_Fantasy_ZScore : 'N/A';
                });
            })
            .catch(error => {
                console.error(`Error fetching total rankings for season ${season}:`, error);
                rankingsTableBody.innerHTML = '<tr><td colspan="12">Error loading total rankings. Please try again.</td></tr>';
                noDataMessage.textContent = 'Error loading total rankings. Check console for details.';
                noDataMessage.classList.remove('hidden');
            });
    }
});
