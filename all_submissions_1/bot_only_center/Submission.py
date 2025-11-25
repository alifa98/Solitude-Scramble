from typing import Any, Dict, List, Literal

# Global Constants
# Using these prevents typos (e.g., typing "LFT" instead of "LEFT")
LEFT = "LEFT"
RIGHT = "RIGHT"
CENTER = "CENTER"

# Type alias for clarity
Action = Literal["LEFT", "RIGHT", "CENTER"]


def get_action(state: Dict[str, Any], match_history: List[Dict[str, Any]]) -> Action:
    """Decides the bot's action based on the current state and match history.

    This function analyzes the game state and historical data to determine
    the optimal move.

    Args:
        state (Dict[str, Any]): The current state of the game.
            It contains the bot's ID, position, turn number, and score data.
            Expected structure:

            .. code-block:: python

                {
                    "my_id": "bot_only_left",
                    "my_position": "WEST",
                    "current_turn": 1,
                    "platform_scores": {
                        "CENTER": 5,
                        "NW": 2,
                        "NE": 1,
                        "SW": 1,
                        "SE": 4
                    },
                    "opponent_positions": {
                        "NORTH": "bot_random",
                        "SOUTH": "bot_second_best",
                        "EAST": "bot_only_center"
                    }
                }

        match_history (List[Dict[str, Any]]): A list of dictionaries, where
            each dictionary represents the full data of a past turn.
            Ordered from Turn 1 to Turn N.
            Example structure of a single history item:

            .. code-block:: python

                {
                    "turn": 1,
                    "platform_scores": {"CENTER": 5, ...},
                    "player_move": {
                        "bot_random": "RIGHT",
                        "bot_second_best": "RIGHT",
                        ...
                    },
                    "scores_awarded": {
                        "bot_second_best": 4,
                        ...
                    },
                    "players_map": {
                        "NORTH": "bot_random",
                        ...
                    }
                }

    Returns:
        str: The action chosen by the bot. Must be one of `LEFT`, `RIGHT`, or `CENTER`.

    Example:
        >>> current_state = {...} # (defined state dict)
        >>> history = []
        >>> action = get_action(current_state, history)
        >>> print(action)
        "CENTER"
    """

    # 1. Analyze the current state (e.g., where are the points?)
    # current_scores = state.get("platform_scores", {})

    # 2. Analyze history (e.g., what do opponents usually do?)
    # if match_history:
    #     last_turn = match_history[-1]

    # 3. Decision Logic
    # Replace this hardcoded return which only returns center with your optimal logic.
    return CENTER
