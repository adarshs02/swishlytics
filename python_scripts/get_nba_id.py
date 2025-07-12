import sys
from nba_api.stats.static import players

def get_nba_id(player_name):
    try:
        # The nba_api player list often uses standard ASCII names.
        # This normalization helps find players with special characters in their names.
        normalized_name = player_name.replace('ć', 'c').replace('č', 'c').replace('ș', 's')

        # Prioritize searching with the normalized name
        player = players.find_players_by_full_name(normalized_name)
        if player:
            return player[0]['id']

        # As a fallback, try the original name
        player = players.find_players_by_full_name(player_name)
        if player:
            return player[0]['id']

        return None
    except Exception as e:
        print(f"Error finding player '{player_name}': {e}", file=sys.stderr)
        return None

if __name__ == '__main__':
    if len(sys.argv) > 1:
        player_name = sys.argv[1]
        nba_id = get_nba_id(player_name)
        if nba_id:
            print(nba_id)
        else:
            # Use stderr for error messages so Node.js can capture it
            print(f"Player '{player_name}' not found.", file=sys.stderr)
            sys.exit(1)
    else:
        print("Usage: python get_nba_id.py \"<player_name>\"", file=sys.stderr)
        sys.exit(1)
