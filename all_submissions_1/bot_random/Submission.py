import random


def get_action(state, match_history, global_history):
    return random.choice(["LEFT", "RIGHT", "CENTER"])
