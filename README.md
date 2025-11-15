# Solitude Scramble: The Bot Competition

Welcome, strategists, to a game of pure psychology!

In Solitude Scramble, the goal is simple: be in the right place at the right time. More importantly, be where no one else is. This is a competition where you win by predicting, bluffing, and out-maneuvering your opponents. You won't be playing yourself—you will be writing the "brain" for a bot that will compete on your behalf in a multi-stage league.

> May the most cunning (and solitary) bot win!

## The Game: "Solitude Scramble"

### Objective

Score the most points by the end of a match. You score points by moving your bot to a platform that **no one else** moves to.

### The Board

The game is played on a board with 5 platforms (4 corners, 1 center) and 4 "home" sides for the players.

```console

  (NW) --- (NORTH) --- (NE)
   | \       |       / |
   |  \      |      /  |
(WEST) --- (CENTER) --- (EAST)
   |  /      |      \  |
   | /       |       \ |
  (SW) --- (SOUTH) --- (SE)
```

### How a Match Works

A single match consists of 10 turns. Each turn has 4 steps:

1. Platform Scores are Set
At the start of each turn, all 5 platforms are assigned a random point value (from 1-6). These scores are shown to all 4 players.

2. Players Choose Actions
Each playes is on one of the homes (NORTH, SOUTH, EAST, or WEST) facing to the center.
Now every player simultaneously and secretly chooses one of three moves:
"LEFT", "RIGHT", or "CENTER".

3. Reveal & Move
All moves are revealed, and bots move to their chosen platforms. The "LEFT" and "RIGHT" moves depend on which side you are on:

NORTH Player:

"LEFT" -> NE Platform

"RIGHT" -> NW Platform

"CENTER" -> CENTER Platform

EAST Player:

"LEFT" -> SE Platform

"RIGHT" -> NE Platform

"CENTER" -> CENTER Platform

SOUTH Player:

"LEFT" -> SW Platform

"RIGHT" -> SE Platform

"CENTER" -> CENTER Platform

WEST Player:

"LEFT" -> NW Platform

"RIGHT" -> SW Platform

"CENTER" -> CENTER Platform

4. Calculate Scores (The Golden Rule)

> [!WARNING]
> You ONLY score points if you are the **only player** on that platform.

If you are alone on a platform, you get its full point value.

If two or more players land on the same platform, **no one gets any points from i**t.

> [!CAUTION]
> (Yes, the CENTER is high-risk—all 4 players can go there. The corners are "safer" 1-v-1 duels).

After scoring, the turn ends. All bots return to their home sides, and a new turn begins with **new platform scores**.

## The Bot API: What You Must Submit

You must submit your code that has one specific Python file named Submission.py. This file must contain a function with the following exact signature:

```python
def get_action(state, match_history):
    """
    This function is called by the game runner every turn.
    Your bot must analyze the provided data and return one of
    the three valid move strings: "LEFT", "RIGHT", or "CENTER".
    """
    
    # Your brilliant logic goes here.
    
    return "LEFT"
```

API Parameters: Your Bot's Senses

Your function will be given three arguments on every turn:

state (dict)

Information about the current, immediate situation.

```python
state = {
    # Your bot's unique ID
    "my_id": "student_bot_3", 
    
    # Your starting side for this match
    "my_position": "NORTH",  # "NORTH", "SOUTH", "EAST", or "WEST"
    
    # The current turn number (1 through 10)
    "current_turn": 7,
    
    # The all-important scores for this turn
    "platform_scores": {
        "CENTER": 6,
        "NW": 3,
        "NE": 1,
        "SW": 5,
        "SE": 2
    },
    
    # The IDs of the other 3 bots in this match and their starting sides
    "opponent_positions": {
        "student_bot_8": "EAST",
        "student_bot_21": "SOUTH",
        "student_bot_33": "WEST"
    }
}
```

match_history (list)

A list of data from all previous turns in this match. (This list is empty on Turn 1).

### Example: What the history would look like on Turn 3

```python
match_history = [
    # Data from Turn 1
    {
        "turn": 1,
        "platform_scores": {
            "CENTER": 3,
            "NW": 3,
            "NE": 2,
            "SW": 5,
            "SE": 3
        },
        "player_move": {
            "bot_second_best": "LEFT",
            "bot_greedy": "LEFT",
            "bot_only_right": "RIGHT",
            "bot_only_left": "LEFT"
        },
        "scores_awarded": {
            "bot_second_best": 3,
            "bot_greedy": 5
        },
        "players_map": {
            "WEST": "bot_second_best",
            "SOUTH": "bot_greedy",
            "EAST": "bot_only_right",
            "NORTH": "bot_only_left"
        }
    },
    # Data for turn 2
    {
        "turn": 2,
        "platform_scores": {
            "CENTER": 3,
            "NW": 2,
            "NE": 2,
            "SW": 3,
            "SE": 4
        },
        "player_move": {
            "bot_second_best": "CENTER",
            "bot_greedy": "RIGHT",
            "bot_only_right": "RIGHT",
            "bot_only_left": "LEFT"
        },
        "scores_awarded": {
            "bot_second_best": 3,
            "bot_greedy": 3,
            "bot_only_right": 4,
            "bot_only_left": 2
        },
        "players_map": {
            "EAST": "bot_second_best",
            "WEST": "bot_greedy",
            "SOUTH": "bot_only_right",
            "NORTH": "bot_only_left"
        }
    }
]
```

## The Competition: A Phased League

This competition will run in 3 Phases. This gives you a chance to analyze the "meta" (the dominant strategies) and improve your bot.

Phase 1: The Seeding

We will run more than matches for each player, with 4 random students in each match.

A leaderboard will be published. The Phase 1 results will be given to you you as a json that includes all match histories for all bots to analyze for the next phase and update your bot.

Phase 2: The Adaptation

You can now resubmit your code. Your bot can now analyze the Phase 1 data from global_history. (you can have this in your code as a json file or hardcoded data structure).

We run another random matches.

A new leaderboard is published. All Phase 1 & 2 results become the history for Phase 3.

We will give you the full match history data from Phase 1 & 2 to analyze for the next phase.

Phase 3: The Finals
Resubmit your (now very clever) bot.

We run a lot of random matches again.
The leaderboard from this Phase will determine the champions.

Leaderboard & Scoring

Your rank will be determined by Average Points Per Match (APPM).

APPM = Total Points Earned (across all matches) / Total Matches Played

## Technical Rules & Submission

File Naming: 
You can have any number of supporting files, but your main bot code must be in a file named Submission.py with the get_action function with the exact signature described above.

Timeout: Your get_action function will be given 2 second to run. If it takes longer, it will be terminated, and your bot will forfeit the move (scoring 0).

Errors: If your function crashes (throws an error), you will forfeit the move (scoring 0). **Use try...except blocks to handle your own errors**!

No Cheating: Your code will run in a sandboxed environment. You may not use libraries like os, subprocess, sys, or any file I/O (open()). You are allowed to use import random, import math, import json (for parsing history), etc.

Persistence: Your bot must be stateless. You cannot save variables or state between calls to get_action. All state must be derived from the two arguments passed in the function.

## Example Bot Strategies

### Example 1: The Random Bot

This bot just picks a move at random. It's simple, but unpredictable!

```python
import random

def get_action(state, match_history):
    # Ignores all data and just hopes for the best.
    return random.choice(["LEFT", "RIGHT", "CENTER"])
```

### Example 2: The Greedy Bot

This bot checks its 3 available moves and goes for the one with the highest potential score.

```python
def get_action(state, match_history):
    
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
    best_move = max(my_options, key=my_options.get)
    
    return best_move
```

The Real Strategy...

The Greedy Bot is simple, but it has a problem: if everyone runs a Greedy Bot, they will all go for the same high-value platform and all score 0.

The winning strategy is to use match_history and the phase history to model your opponents.

Is bot_21 a Greedy Bot? If so, you know where they are likely to go. You should go somewhere else.

Does bot_8 always go to the Center on Turn 1? Exploit that.

Do bot_21 and bot_33 have a history of colliding on the SW platform? Maybe you can go CENTER safely.

Good luck.