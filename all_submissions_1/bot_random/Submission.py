import random


def get_action(state, match_history):
    return random.choice(["LEFT", "RIGHT", "CENTER"])
