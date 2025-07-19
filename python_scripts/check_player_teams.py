import sys
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import commonplayerinfo

def get_player_current_team(player_name):
    """
    Get the current team for a specific player using NBA API
    """
    try:
        # Find player by name
        player_list = players.find_players_by_full_name(player_name)
        if not player_list:
            print(f"Player '{player_name}' not found.")
            return None
        
        player_id = player_list[0]['id']
        
        # Get player info including current team
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        player_data = player_info.get_data_frames()[0]
        
        if not player_data.empty:
            team_id = player_data['TEAM_ID'].iloc[0]
            team_name = player_data['TEAM_NAME'].iloc[0]
            team_city = player_data['TEAM_CITY'].iloc[0]
            
            return {
                'player_name': player_name,
                'team_id': team_id,
                'team_name': team_name,
                'team_city': team_city,
                'full_team': f"{team_city} {team_name}"
            }
        else:
            print(f"No team data found for {player_name}")
            return None
            
    except Exception as e:
        print(f"Error getting team info for '{player_name}': {e}")
        return None

def check_specific_players():
    """
    Check the current teams for Bradley Beal, Kristaps Porzingis, and Jrue Holiday
    """
    players_to_check = [
        "Dylan Harper",
        "Kristaps Porzingis", 
        "Jrue Holiday"
    ]
    
    print("Checking current team information for players who moved in recent trades:")
    print("=" * 70)
    
    for player_name in players_to_check:
        print(f"\nChecking {player_name}...")
        team_info = get_player_current_team(player_name)
        
        if team_info:
            print(f"  Current Team: {team_info['full_team']}")
            print(f"  Team ID: {team_info['team_id']}")
        else:
            print(f"  Could not retrieve team information")

if __name__ == '__main__':
    check_specific_players()
