#!/usr/bin/env python3


import json
import os
import random
from collections import defaultdict

from rich.console import Console, Group
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn, TimeRemainingColumn
from rich.table import Table
from rich.text import Text

from lib.bot_loader import SafeBotLoader
from lib.match_generator import create_fair_matches
from lib.match_runner import MatchRunner

PHASE = 1  # Current phase of the competition
SUBMISSIONS_DIR = f"all_submissions_{PHASE}"  # Directory containing bot submissions
TURNS_PER_MATCH = 10  # How many turns each match will have, randomized and repeated
PLATFORM_MIN_SCORE = 1  # Minimum score per platform
PLATFORM_MAX_SCORE = 6  # Maximum score per platform
TURN_TIMEOUT = 2  # Timeout per turn in seconds to avoid stalling
FORBIDDEN_MODULES = [  # Modules that bots are not allowed to import
    "os",
    "sys",
    "subprocess",
    "shutil",
    "pathlib",
    "importlib",
    "multiprocessing",
    "threading",
    "socket",
    "urllib",
    "http",
]
FORBIDDEN_BUILTINS = ["open", "eval", "exec", "input"]
HISTORY_FILENAME = f"history/global_history_phase_{PHASE}.json"

os.makedirs("history", exist_ok=True)

console = Console()  # Rich Console


def make_layout() -> Layout:
    """Define the dashboard layout."""
    layout = Layout(name="root")
    layout.split(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=5),
    )
    layout["main"].split_row(
        Layout(name="left", ratio=1),
        Layout(name="right", ratio=1),
    )
    layout["left"].split_column(
        Layout(name="progress", ratio=1),
        Layout(name="recent_match", ratio=1),
    )
    return layout


def generate_header() -> Panel:
    """Generate the header panel."""
    title = Text(
        f"Solitude Scramble: Phase {PHASE}", style="bold magenta", justify="center"
    )
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
        if i >= 30:  # Limit to top 30
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

    return Panel(
        content, title=f"Recent Match [bold]#{match_id}[/bold]", border_style="blue"
    )


def generate_footer(log_messages) -> Panel:
    """Generate the footer panel for logging."""
    content = Text("\n".join(log_messages))
    return Panel(content, title="Bot Errors & Logs", border_style="red")


def main():
    loader = SafeBotLoader(
        SUBMISSIONS_DIR, FORBIDDEN_MODULES, FORBIDDEN_BUILTINS, console
    )
    # bot_registry is { bot_id: Path }
    bot_registry = loader.load_bots()

    if len(bot_registry) < 4:
        console.print(
            "\n[red]Error:[/red] Need at least 4 valid bots to run a tournament."
        )
        return

    all_bot_ids = sorted(list(bot_registry.keys()))

    # Create Fair Matches for all bots
    match_per_player, generated_matches = create_fair_matches(
        all_bot_ids, min_plays_per_player=3
    )
    NUM_MATCHES = match_per_player  # Match for each bot to play against others (Will be decided on the fly but > 3)

    # Setup Dashboard
    layout = make_layout()
    layout["header"].update(generate_header())

    overall_progress = Progress(
        TextColumn("[bold blue]Overall Progress[/]"),
        BarColumn(bar_width=None),
        "[progress.percentage]{task.percentage:>3.0f}%",
        TimeRemainingColumn(),
    )
    match_task = overall_progress.add_task(
        "Running Matches", total= NUM_MATCHES * len(all_bot_ids) // 4
    )

    content = Text()
    content.append(Text("Bots Loaded: ", style="bold"))
    content.append(Text(f"{len(all_bot_ids)} bots\n", style="green"))
    content.append(Text("Total Matches per player: ", style="bold"))
    content.append(Text(f"{NUM_MATCHES}\n", style="green"))
    content.append(Text("Turns per Match: ", style="bold"))
    content.append(Text(f"{TURNS_PER_MATCH}\n", style="green"))

    stats_panel = Panel(
        content,
        title="Phase Stats",
        border_style="green",
    )
    layout["progress"].update(Group(stats_panel, overall_progress))
    layout["recent_match"].update(
        Panel("Waiting for first match...", title="Recent Match", border_style="blue")
    )

    total_scores = defaultdict(int)
    match_counts = defaultdict(int)
    log_messages = ["TBD...maybe logs"] * 3

    layout["right"].update(
        generate_leaderboard_table(total_scores, match_counts, all_bot_ids)
    )
    layout["footer"].update(generate_footer(log_messages))

    global_history_log = {"matches": {}}

    # Run All Matches (Inside Live)
    with Live(layout, refresh_per_second=10, screen=True) as live:
        match_id = 0
        for current_player_ids in generated_matches:
            match_id = match_id + 1


            bots_to_run = {pid: bot_registry[pid] for pid in current_player_ids}

            arena = MatchRunner(
                current_player_ids,
                bots_to_run,
                platform_max_score=PLATFORM_MAX_SCORE,
                platform_min_score=PLATFORM_MIN_SCORE,
                turns_per_match=TURNS_PER_MATCH,
                turn_timeout=TURN_TIMEOUT,
            )
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

    # End of Live display
    console.clear()
    console.rule(f"[bold green]Phase {PHASE} Complete[/bold green]", style="green")

    console.print(
        f"\n[bold]Saving full match history to '{HISTORY_FILENAME}'...[/bold]"
    )
    try:
        with open(HISTORY_FILENAME, "w") as f:
            json.dump(global_history_log, f)  # No indent for smaller file
        console.print("[green]History saved successfully.[/green]")
    except Exception as e:
        console.print(f"[red]Error saving history file:[/red] {e}")

    # Print Final Leaderboard (Unchanged)
    console.print("\n")
    final_table = generate_leaderboard_table(total_scores, match_counts, all_bot_ids)
    final_table.title = f"[bold green]Final Phase {PHASE} Leaderboard[/bold green]"
    console.print(final_table)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[red]Judging interrupted by user.[/red]")
