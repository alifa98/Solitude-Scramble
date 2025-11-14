import random
from typing import Any, List, Tuple


def create_fair_matches(
    all_bot_ids: List[Any], min_plays_per_player: int = 3, players_per_match: int = 4
) -> Tuple[int, List[List[Any]]]:
    """
    Generates a fair, random match schedule where every player plays
    an equal number of times (at least min_plays_per_player).

    Args:
        all_bot_ids: A list of all unique bot IDs.
        min_plays_per_player: The minimum number of matches each bot
                               should participate in.
        players_per_match: The number of players in each match (fixed at 4).

    Returns:
        A tuple containing:
        (R, matches)
        R (int): The calculated number of matches each player will play.
        matches (list[list]): A list of all generated matches.

    Raises:
        ValueError: If it's impossible to create a schedule (e.g., < 4 players).
    """

    N = len(all_bot_ids)
    K = players_per_match

    if N < K:
        raise ValueError(f"Need at least {K} players to form a match.")

    # 1. Find R (Rounds per Player)
    # Start at the minimum required plays
    R = max(1, min_plays_per_player)

    # Keep incrementing R until (N * R) is divisible by K
    while (N * R) % K != 0:
        R += 1

    # 2. Find M (Total Matches to schedule)
    M = (N * R) // K

    # 3. Generation loop with retry logic
    # We will keep trying until a valid shuffle is found
    generation_attempts = 0
    while True:
        generation_attempts += 1
        if generation_attempts > 1000:
            # This is a safeguard against some impossible logic error
            raise Exception("Could not find a valid schedule after 1000 shuffles.")

        matches = []

        # Create the pool *inside* the loop so it resets on retry
        player_pool = []
        for bot_id in all_bot_ids:
            player_pool.extend([bot_id] * R)  # Add R copies of each bot

        random.shuffle(player_pool)

        generation_failed = False  # Flag for this attempt

        for _ in range(M):
            # We need to find K *unique* players in the pool
            current_match = []
            indices_to_remove = []
            players_in_match_set = set()

            found_match = False

            # Iterate through the pool to find K unique players
            for i, player in enumerate(player_pool):
                if player not in players_in_match_set:
                    current_match.append(player)
                    indices_to_remove.append(i)
                    players_in_match_set.add(player)

                # Once we have a full match, stop searching
                if len(current_match) == K:
                    found_match = True
                    break

            if found_match:
                matches.append(current_match)

                # Remove the used players from the main pool
                # We MUST iterate in reverse index order to avoid errors
                for i in sorted(indices_to_remove, reverse=True):
                    player_pool.pop(i)
            else:
                # We failed to find K unique players.
                # This shuffle is a failure. Break and retry.
                generation_failed = True
                print(f"Attempt {generation_attempts}: Shuffle failed. Retrying...")
                break  # Break from the 'for _ in range(M)' loop

        if not generation_failed:
            # Success! We generated all M matches.
            # Final check:
            if len(matches) == M and len(player_pool) == 0:
                return R, matches  # Successful return
            else:
                print("Warning: Logic error, retrying shuffle...")
