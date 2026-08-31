#!/usr/bin/env python3

"""
Solitude Scramble - Local Test Runner
---------------------------------------

This script allows you to test your bot locally against a fixed set of 6
standard bots before submitting.

This environment uses the *exact* same match logic as the official judge.

Instructions:
1. Make sure you have `rich` installed:
   pip install rich
2. Place this script in your main 'Solitude-Scramble' project directory
   (the one containing 'judge.py' and 'lib/').
3. Run the script from your terminal:
   python test_my_bot.py
4. Follow the prompts to enter the path to your bot's 'Submission.py' file.

"""

import os
import random
import sys
from collections import defaultdict
from pathlib import Path

from rich.console import Console

# --- Add lib to path to import match runner ---
script_dir = Path(__file__).parent
lib_dir = script_dir / "lib"
sys.path.insert(0, str(lib_dir))

try:
    from match_runner import MatchRunner
    from bot_loader import SafeBotLoader
except ImportError as e:
    print(f"Error: Could not import from 'lib/'. Make sure this script is in the correct directory.")
    print(f"Details: {e}")
    sys.exit(1)

# --- Constants (from judge.py) ---
TURNS_PER_MATCH = 10
PLATFORM_MIN_SCORE = 1
PLATFORM_MAX_SCORE = 6
TURN_TIMEOUT = 2
FORBIDDEN_MODULES = [
    "os", "sys", "subprocess", "shutil", "pathlib", "importlib",
    "multiprocessing", "threading", "socket", "urllib", "http",
]
FORBIDDEN_BUILTINS = ["open", "eval", "exec", "input"]

# --- Fixed bots for testing ---
SUBMISSIONS_DIR = "all_submissions_1" # <-- ADD THIS
# Assumes these bots exist in the root directory
FIXED_BOTS_DIRS = [
    "bot_greedy",
    "bot_only_center",
    "bot_only_left",
    "bot_only_right",
    "bot_random",
    "bot_second_best",
]

# --- Main Test Script ---
console = Console()

def load_fixed_bots():
    """Load the 6 fixed bots into a registry."""
    console.print("\n[bold cyan]Loading fixed test bots...[/bold cyan]")
    bot_registry = {}
    
    # We use a *dummy* submissions dir for the SafeBotLoader
    # The paths we give it will be absolute anyway
    dummy_dir = "all_submissions_1" # This doesn't have to exist
    loader = SafeBotLoader(dummy_dir, FORBIDDEN_MODULES, FORBIDDEN_BUILTINS, Console())

    for bot_dir_name in FIXED_BOTS_DIRS:
        bot_id = bot_dir_name
        # --- MODIFIED LOGIC ---
        # Look inside the SUBMISSIONS_DIR based on the screenshot
        bot_dir = script_dir / SUBMISSIONS_DIR / bot_dir_name
        
        # The screenshot clearly shows all files are named 'Submission.py'
        submission_file = bot_dir / "Submission.py"
        
        # Use is_file() to make sure it exists and is a file, not a broken link
        if not submission_file.is_file():
            console.print(f"[yellow]WARN[/yellow] - Could not find '{submission_file}'. Skipping.")
            continue
        # --- END OF MODIFICATION ---

        # Security check (from bot_loader.py)
        is_safe, reason = loader._security_check(submission_file)
        if not is_safe:
            console.print(f"[red]FAIL[/red] - Fixed bot '{bot_id}' failed security check: {reason}")
            continue

        bot_registry[bot_id] = submission_file
        console.print(f"[green]  -> Loaded '{bot_id}'[/green]")

    return bot_registry


def load_user_bot(loader):
    """Prompt user for their bot and validate it."""
    console.print("\n[bold cyan]Load Your Bot[/bold cyan]")
    while True:
        try:
            bot_path_str = console.input("[yellow]Enter the path to your 'Submission.py' file: [/yellow]")
            bot_path = Path(bot_path_str).resolve()

            if not bot_path.exists():
                console.print(f"[red]Error: File not found at '{bot_path}'[/red]")
                continue

            if bot_path.name != "Submission.py":
                console.print(f"[red]Error: The file *must* be named 'Submission.py'[/red]")
                continue

            # Check bot security
            is_safe, reason = loader._security_check(bot_path)
            if not is_safe:
                console.print(f"[red]Error: Your bot failed the security check: {reason}[/red]")
                console.print("Please fix the issue and try again.")
                continue
            
            # Check for get_action
            content = bot_path.read_text(encoding="utf-8")
            if "def get_action" not in content:
                console.print("[red]Error: 'def get_action' not found in your file.[/red]")
                continue

            user_bot_id = "MY_BOT"
            console.print(f"[green]Successfully validated your bot![/green]")
            return user_bot_id, bot_path

        except Exception as e:
            console.print(f"[red]An unexpected error occurred: {e}[/red]")


def main():
    console.rule("[bold magenta]Solitude Scramble - Local Test Environment[/bold magenta]")
    console.print("This script will run 20 matches, pitting your bot against")
    console.print("a random selection of 3 fixed bots in each match.")
    
    # 1. Load Fixed Bots
    fixed_bot_registry = load_fixed_bots()
    if len(fixed_bot_registry) < 4:
        console.print("\n[red]Error: Need at least 4 fixed bots to run. Exiting.[/red]")
        return
    
    # 2. Load User Bot
    # Create a loader instance to use its _security_check method
    dummy_loader = SafeBotLoader("", FORBIDDEN_MODULES, FORBIDDEN_BUILTINS, console)
    user_bot_id, user_bot_path = load_user_bot(dummy_loader)

    # 3. Combine Registries
    full_bot_registry = fixed_bot_registry.copy()
    full_bot_registry[user_bot_id] = user_bot_path
    
    fixed_bot_ids = list(fixed_bot_registry.keys())

    # 4. Run Matches
    num_matches = 20
    console.print(f"\n[bold cyan]Running {num_matches} test matches...[/bold cyan]")
    
    total_scores = defaultdict(int)
    match_counts = defaultdict(int)
    total_errors = defaultdict(int)
    
    for i in range(1, num_matches + 1):
        # Pick 3 random fixed bots + the user's bot
        try:
            chosen_fixed_bots = random.sample(fixed_bot_ids, 3)
        except ValueError:
            console.print("[red]Error sampling bots. Not enough fixed bots loaded.[/red]")
            return
            
        current_player_ids = [user_bot_id] + chosen_fixed_bots
        random.shuffle(current_player_ids)
        
        bots_to_run = {pid: full_bot_registry[pid] for pid in current_player_ids}

        arena = MatchRunner(
            current_player_ids,
            bots_to_run,
            platform_max_score=PLATFORM_MAX_SCORE,
            platform_min_score=PLATFORM_MIN_SCORE,
            turns_per_match=TURNS_PER_MATCH,
            turn_timeout=TURN_TIMEOUT,
        )
        final_scores, match_log, errors = arena.run()

        # Log results
        console.print(f"  [bold]Match {i:2d} / {num_matches}[/bold] (Players: {', '.join(current_player_ids)})")
        
        for bot_id, score in final_scores.items():
            total_scores[bot_id] += score
        
        for bot_id in current_player_ids:
            match_counts[bot_id] += 1
            
        if errors:
            for err_msg in errors:
                console.print(f"    [red]ERROR:[/red] {err_msg}")
                if "MY_BOT" in err_msg:
                    total_errors[user_bot_id] += 1
    
    # 5. Print Final Report
    console.rule("[bold green]Test Run Complete: Results[/bold green]")

    user_score = total_scores[user_bot_id]
    user_matches = match_counts[user_bot_id]
    user_appm = (user_score / user_matches) if user_matches > 0 else 0
    user_errors = total_errors[user_bot_id]

    console.print(f"\n[bold yellow]Your Bot ({user_bot_id}) Stats:[/bold yellow]")
    console.print(f"  - [bold]Total Points:[/bold] {user_score}")
    console.print(f"  - [bold]Matches Played:[/bold] {user_matches}")
    console.print(f"  - [bold]Avg Points per Match:[/bold] {user_appm:.2f}")
    console.print(f"  - [bold]Errors/Timeouts:[/bold] [red]{user_errors}[/red]" if user_errors > 0 else "[green]0[/green]")

    if user_errors > 0:
        console.print("\n[yellow]Your bot produced errors! Check the log above.[/yellow]")
        console.print("This will result in disqualification or a score of 0 for the turn.")
    else:
        console.print("\n[green]Your bot ran without any errors! Great job![/green]")

    console.print("\n[bold dim]Other Bot Stats (for comparison):[/bold dim]")
    for bot_id in fixed_bot_ids:
        score = total_scores[bot_id]
        matches = match_counts[bot_id]
        appm = (score / matches) if matches > 0 else 0
        console.print(f"  - {bot_id:18}: {appm:6.2f} APPM ({score:4} pts / {matches:2} matches)")

if __name__ == "__main__":
    main()