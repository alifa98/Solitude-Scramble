def get_action(state, match_history, global_history):
    
    my_pos = state["my_position"]
    scores = state["platform_scores"]

    # 1. Find out which platforms I can move to
    my_options = {
        "CENTER": scores["CENTER"]
    }
    
    if my_pos == "NORTH":
        my_options["LEFT"] = scores["NE"]
        my_options["RIGHT"] = scores["NW"]
    elif my_pos == "EAST":
        my_options["LEFT"] = scores["SE"]
        my_options["RIGHT"] = scores["NE"]
    elif my_pos == "SOUTH":
        my_options["LEFT"] = scores["SW"]
        my_options["RIGHT"] = scores["SE"]
    elif my_pos == "WEST":
        my_options["LEFT"] = scores["NW"]
        my_options["RIGHT"] = scores["SW"]

    # 2. Find the best move among my options
    # This finds the key (move) with the maximum value (score)
    best_move = sorted(my_options, key=my_options.get)
    
    return best_move[0]