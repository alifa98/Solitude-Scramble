#!/usr/bin/env python3

"""
Solitude Scramble: Judge & Arena Runner (Rich Dashboard Edition)
==============================================================

This script runs the full tournament with a real-time dashboard
powered by the 'rich' library.

(Pickle-Error Corrected)
"""

import ast
import importlib.util
import json
import logging
import os
import random
import sys
import time
import traceback
from collections import Counter, defaultdict
from multiprocessing import Process, Queue
from pathlib import Path

# --- Rich Library Imports ---
from rich.console import Console, Group
from rich.layout import Layout
from rich.live import Live
from rich.logging import RichHandler
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn, TimeRemainingColumn
from rich.table import Table
from rich.text import Text

# --- Constants ---
SUBMISSIONS_DIR = "all_submissions"
NUM_MATCHES = 500
TURNS_PER_MATCH = 10
PLATFORM_MIN_SCORE = 1
PLATFORM_MAX_SCORE = 6
TURN_TIMEOUT = 1.0
FORBIDDEN_MODULES = [
    'os', 'sys', 'subprocess', 'shutil', 'pathlib', 'importlib',
    'multiprocessing', 'threading', 'socket', 'urllib', 'http'
]
FORBIDDEN_BUILTINS = [
    'open', 'eval', 'exec', 'input'
]

# --- Setup Rich Console ---
console = Console()

# --- 1. Bot Loading & Safety Check ---

class SafeBotLoader:
    def __init__(self, submissions_root, forbidden_modules, forbidden_builtins):
        self.root = Path(submissions_root)
        self.forbidden_modules = set(forbidden_modules)
        self.forbidden_builtins = set(forbidden_builtins)
        # CHANGE: We now store the file path, not the function
        self.bot_registry = {} # { bot_id: Path_to_Submission.py }

    def _security_check(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                tree = ast.parse(content, filename=file_path)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name in self.forbidden_modules:
                            return False, f"Forbidden import: {alias.name}"
                if isinstance(node, ast.ImportFrom):
                    if node.module in self.forbidden_modules:
                        return False, f"Forbidden import from: {node.module}"
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                    if node.func.id in self.forbidden_builtins:
                         return False, f"Forbidden function call: {node.func.id}()"
            return True, "Code OK"
        except Exception as e:
            return False, f"Code could not be parsed: {e}"

    def load_bots(self):
        console.rule("[bold cyan]1. Loading Bots[/bold cyan]", style="cyan")
        if not self.root.is_dir():
            console.print(f"[red]Error:[/red] Submissions directory not found: {self.root}")
            return {}

        for bot_dir in sorted(self.root.iterdir()):
            if not bot_dir.is_dir():
                continue
            
            bot_id = bot_dir.name
            submission_file = bot_dir / "Submission.py"

            if not submission_file.exists():
                console.print(f"[yellow][SKIP][/yellow] {bot_id}: No 'Submission.py' file found.")
                continue

            is_safe, reason = self._security_check(submission_file)
            if not is_safe:
                console.print(f"[red][FAIL][/red] {bot_id}: {reason}. Bot disqualified.")
                continue

            # We can't fully check for get_action without importing,
            # but we can do a simple text check for presence.
            try:
                content = submission_file.read_text(encoding='utf-8')
                if "def get_action" not in content:
                    console.print(f"[red][FAIL][/red] {bot_id}: 'get_action' function definition not found in file.")
                    continue
                
                # CHANGE: Store the file path, not the loaded function
                self.bot_registry[bot_id] = submission_file
                console.print(f"[green][OK][/green]   {bot_id}: Validated and registered.")
            
            except Exception as e:
                console.print(f"[red][FAIL][/red] {bot_dir.name}: Could not read file.\n{e}")

        console.print(f"\n[bold]Successfully loaded {len(self.bot_registry)} / {len(list(self.root.iterdir()))} bots.[/bold]")
        time.sleep(1) # Pause to let user read
        return self.bot_registry

# --- 2. Safe Bot Execution ---

def _safe_call_wrapper(queue, bot_id, bot_file_path, state, match_history, global_history):
    """
    A target function to be run in a separate process.
    It now loads the bot's code *itself* before executing.
    """
    try:
        # 1. Load the bot function from the file path
        # Create a unique module name to avoid conflicts (e.g., 'rand')
        safe_module_name = f"bot_submission_{bot_id}"
        spec = importlib.util.spec_from_file_location(safe_module_name, bot_file_path)
        
        # Handle case where spec might be None if file not found (though it should be)
        if spec is None:
            raise ImportError(f"Could not create spec for {bot_file_path}")
            
        bot_module = importlib.util.module_from_spec(spec)
        
        # Add to sys.modules to handle internal imports if the bot needs them
        sys.modules[safe_module_name] = bot_module
        
        if spec.loader is None:
            raise ImportError(f"No loader for spec {bot_file_path}")
            
        spec.loader.exec_module(bot_module)
        
        if not hasattr(bot_module, 'get_action'):
             raise AttributeError("Function 'get_action' not found in module.")

        bot_function = bot_module.get_action

        # 2. Now execute the function as before
        move = bot_function(state, match_history, global_history)
        if move not in ["LEFT", "RIGHT", "CENTER"]:
            queue.put(("INVALID_MOVE", f"Bot returned '{move}'"))
        else:
            queue.put(("OK", move))
    except Exception:
        # This will catch errors in both loading and execution
        queue.put(("CRASH", traceback.format_exc()))

def safe_get_action(bot_id, bot_file_path, state, match_history, global_history):
    """
    Runs a bot's `get_action` function in an isolated process
    with a hard timeout.
    
    Passes the bot's file path to the child process for loading.
    """
    q = Queue()
    
    p = Process(
        target=_safe_call_wrapper, 
        args=(q, bot_id, bot_file_path, state, match_history, global_history)
    )
    
    p.start()
    p.join(timeout=TURN_TIMEOUT)

    if p.is_alive():
        p.terminate()
        p.join()
        return "TIMEOUT", None

    try:
        status, result = q.get_nowait()
        if status == "OK":
            return "OK", result
        else:
            return status, result # Pass error message
            
    except Exception:
        return "CRASH", "Queue communication error"


# --- 3. The Game Arena ---

class MatchRunner:
    def __init__(self, player_ids, bot_files):
        self.player_ids = player_ids
        self.bot_files = bot_files # This is now a dict { bot_id: Path }
        self.positions = ["NORTH", "SOUTH", "EAST", "WEST"]
        self.player_map = {pos: pid for pos, pid in zip(self.positions, self.player_ids)}
        self.id_to_pos = {pid: pos for pos, pid in self.player_map.items()}
        self.match_scores = defaultdict(int)
        self.match_history = []
        self.global_history_for_phase_1 = {}
        self.full_match_log = {"players": self.player_ids, "final_scores": {}, "turn_data": []}
        self.errors = [] # To store bot errors

    def _get_platform_scores(self):
        return {p: random.randint(PLATFORM_MIN_SCORE, PLATFORM_MAX_SCORE) for p in ["CENTER", "NW", "NE", "SW", "SE"]}

    def _get_platform_for_move(self, position, move):
        if move == "CENTER": return "CENTER"
        if position == "NORTH": return "NW" if move == "LEFT" else "NE"
        if position == "EAST": return "NE" if move == "LEFT" else "SE"
        if position == "SOUTH": return "SE" if move == "LEFT" else "SW"
        if position == "WEST": return "SW" if move == "LEFT" else "NW"
        return "NONE"

    def run(self):
        for turn_num in range(1, TURNS_PER_MATCH + 1):
            platform_scores = self._get_platform_scores()
            moves_made = {}
            platform_choices = {}
            
            for position, player_id in self.player_map.items():
                state = {
                    "my_id": player_id,
                    "my_position": position,
                    "current_turn": turn_num,
                    "platform_scores": platform_scores,
                    "opponent_ids": [pid for pid in self.player_ids if pid != player_id]
                }
                
                bot_file_path = self.bot_files[player_id]
                
                status, move_or_err = safe_get_action(
                    player_id, bot_file_path, state, 
                    self.match_history, self.global_history_for_phase_1
                )
                
                if status != "OK":
                    move = "CENTER" # Default move on failure
                    self.errors.append(f"[Turn {turn_num}] {player_id}: {status}")
                else:
                    move = move_or_err
                
                moves_made[position] = move
                platform_choices[position] = self._get_platform_for_move(position, move)

            platform_occupancy = Counter(platform_choices.values())
            scores_awarded = defaultdict(int)
            
            for position, platform in platform_choices.items():
                if platform_occupancy[platform] == 1:
                    player_id = self.player_map[position]
                    score = platform_scores[platform]
                    scores_awarded[player_id] = score
                    self.match_scores[player_id] += score

            turn_log_entry = {
                "turn": turn_num,
                "platform_scores": platform_scores,
                "moves": moves_made,
                "scores_awarded": dict(scores_awarded)
            }
            self.match_history.append(turn_log_entry)
            self.full_match_log["turn_data"].append(turn_log_entry)

        self.full_match_log["final_scores"] = dict(self.match_scores)
        return dict(self.match_scores), self.full_match_log, self.errors

# --- 4. Rich Dashboard Setup (Unchanged) ---

def make_layout() -> Layout:
    """Define the dashboard layout."""
    layout = Layout(name="root")
    layout.split(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=5)
    )
    layout["main"].split_row(
        Layout(name="left", ratio=1),
        Layout(name="right", ratio=1),
    )
    # CHANGED: Swapped size=7 and ratio=1 for ratio=1 and ratio=1
    # This avoids mixing fixed and relative sizes, which caused the TypeError
    layout["left"].split_column(
        Layout(name="progress", ratio=1),
        Layout(name="recent_match", ratio=1),
    )
    return layout

def generate_header() -> Panel:
    """Generate the header panel."""
    title = Text("Solitude Scramble: Phase 1", style="bold magenta", justify="center")
    return Panel(title, border_style="magenta")

def generate_leaderboard_table(total_scores, match_counts, all_bot_ids) -> Table:
    """Generate the real-time leaderboard table."""
    table = Table(title="[bold cyan]Real-time Leaderboard[/bold cyan]")
    table.add_column("Rank", style="dim", width=4)
    table.add_column("Bot ID", style="bold yellow", max_width=30)
    table.add_column("APPM", style="green", justify="right")
    table.add_column("Total Points", justify="right")
    table.add_column("Matches", justify="right")
    
    leaderboard = []
    for bot_id in all_bot_ids:
        points = total_scores[bot_id]
        matches = match_counts[bot_id]
        appm = (points / matches) if matches > 0 else 0
        leaderboard.append((bot_id, appm, points, matches))
        
    leaderboard.sort(key=lambda x: x[1], reverse=True)
    
    for i, (bot_id, appm, points, matches) in enumerate(leaderboard):
        if i >= 30: # Limit to top 30
            break
        table.add_row(f"{i+1}", bot_id, f"{appm:.2f}", f"{points}", f"{matches}")
        
    return table

def generate_recent_match_panel(match_id, players, final_scores) -> Panel:
    """Generate the panel for the most recent match."""
    content = Text()
    for pid in players:
        score = final_scores.get(pid, 0)
        content.append(f"{pid}: ", style="bold")
        content.append(f"{score} pts\n", style="green" if score > 0 else "dim")
    
    return Panel(content, title=f"Recent Match [bold]#{match_id}[/bold]", border_style="blue")

def generate_footer(log_messages) -> Panel:
    """Generate the footer panel for logging."""
    content = Text("\n".join(log_messages))
    return Panel(content, title="Bot Errors & Logs", border_style="red")

# --- 5. Main Tournament Runner (Rich Edition) ---

def main():
    # 1. Load Bots
    loader = SafeBotLoader(SUBMISSIONS_DIR, FORBIDDEN_MODULES, FORBIDDEN_BUILTINS)
    # bot_registry is now { bot_id: Path }
    bot_registry = loader.load_bots() 
    
    if len(bot_registry) < 4:
        console.print("\n[red]Error:[/red] Need at least 4 valid bots to run a tournament.")
        return
    
    all_bot_ids = sorted(list(bot_registry.keys()))

    # 2. Setup Dashboard (Unchanged)
    layout = make_layout()
    layout["header"].update(generate_header())

    overall_progress = Progress(
        TextColumn("[bold blue]Overall Progress[/]"),
        BarColumn(bar_width=None),
        "[progress.percentage]{task.percentage:>3.0f}%",
        TimeRemainingColumn(),
    )
    match_task = overall_progress.add_task("Running Matches", total=NUM_MATCHES)
    
    stats_panel = Panel(
        Text(f"[bold]Bots Loaded:[/] {len(all_bot_ids)}\n[bold]Total Matches:[/] {NUM_MATCHES}\n[bold]Turns/Match:[/] {TURNS_PER_MATCH}"),
        title="Phase Stats", border_style="green"
    )
    layout["progress"].update(Group(stats_panel, overall_progress))
    layout["recent_match"].update(Panel("Waiting for first match...", title="Recent Match", border_style="blue"))
    
    total_scores = defaultdict(int)
    match_counts = defaultdict(int)
    log_messages = ["Logs will appear here..."] * 3
    
    layout["right"].update(generate_leaderboard_table(total_scores, match_counts, all_bot_ids))
    layout["footer"].update(generate_footer(log_messages))

    global_history_log = {"matches": {}}

    # 3. Run All Matches (Inside Live)
    with Live(layout, refresh_per_second=10, screen=True) as live:
        for i in range(NUM_MATCHES):
            match_id = i + 1
            
            current_player_ids = random.sample(all_bot_ids, 4)
            
            bots_to_run = {pid: bot_registry[pid] for pid in current_player_ids}
            
            arena = MatchRunner(current_player_ids, bots_to_run)
            final_scores, match_log, errors = arena.run()
            
            global_history_log["matches"][f"match_{match_id}"] = match_log
            for bot_id, score in final_scores.items():
                total_scores[bot_id] += score
            for bot_id in current_player_ids:
                 match_counts[bot_id] += 1
            
            overall_progress.update(match_task, advance=1)
            
            layout["recent_match"].update(
                generate_recent_match_panel(match_id, current_player_ids, final_scores)
            )
            
            layout["right"].update(
                generate_leaderboard_table(total_scores, match_counts, all_bot_ids)
            )

            if errors:
                for err in errors:
                    log_messages.pop(0)
                    log_messages.append(f"[Match {match_id}] {err}")
                layout["footer"].update(generate_footer(log_messages))

    # 4. End of Live display (Unchanged)
    console.clear()
    console.rule("[bold green]Phase 1 Complete[/bold green]", style="green")
    
    # 5. Save Global History (Unchanged)
    history_filename = "global_history_phase_1.json"
    console.print(f"\n[bold]Saving full match history to '{history_filename}'...[/bold]")
    try:
        with open(history_filename, 'w') as f:
            json.dump(global_history_log, f) # No indent for smaller file
        console.print("[green]History saved successfully.[/green]")
    except Exception as e:
        console.print(f"[red]Error saving history file:[/red] {e}")

    # 6. Print Final Leaderboard (Unchanged)
    console.print("\n")
    final_table = generate_leaderboard_table(total_scores, match_counts, all_bot_ids)
    final_table.title = "[bold green]Final Phase 1 Leaderboard[/bold green]"
    console.print(final_table)


if __name__ == "__main__":
    main()