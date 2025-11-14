import ast
import time
from pathlib import Path


class SafeBotLoader:
    def __init__(
        self, submissions_root, forbidden_modules, forbidden_builtins, console
    ):
        self.root = Path(submissions_root)
        self.forbidden_modules = set(forbidden_modules)
        self.forbidden_builtins = set(forbidden_builtins)
        self.bot_registry = {}  # { bot_id: Path_to_Submission.py }
        self.console = console

    def _security_check(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
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
        self.console.rule("[bold cyan]1. Loading Bots[/bold cyan]", style="cyan")
        if not self.root.is_dir():
            self.console.print(
                f"[red]Error:[/red] Submissions directory not found: {self.root}"
            )
            return {}

        for bot_dir in sorted(self.root.iterdir()):
            if not bot_dir.is_dir():
                continue

            bot_id = bot_dir.name
            submission_file = bot_dir / "Submission.py"

            if not submission_file.exists():
                self.console.print(
                    f"[yellow][SKIP][/yellow] {bot_id}: No 'Submission.py' file found."
                )
                continue

            is_safe, reason = self._security_check(submission_file)
            if not is_safe:
                self.console.print(
                    f"[red][FAIL][/red] {bot_id}: {reason}. Bot disqualified."
                )
                continue

            # We can't fully check for get_action without importing,
            # but we can do a simple text check for presence.
            try:
                content = submission_file.read_text(encoding="utf-8")
                if "def get_action" not in content:
                    self.console.print(
                        f"[red][FAIL][/red] {bot_id}: 'get_action' function definition not found in file."
                    )
                    continue

                # Store the file path, not the loaded function
                self.bot_registry[bot_id] = submission_file
                self.console.print(
                    f"[green][OK][/green]   {bot_id}: Validated and registered."
                )

            except Exception as e:
                self.console.print(
                    f"[red][FAIL][/red] {bot_dir.name}: Could not read file.\n{e}"
                )

        self.console.print(
            f"\n[bold]Successfully loaded {len(self.bot_registry)} / {len(list(self.root.iterdir()))} bots.[/bold]"
        )
        time.sleep(1)  # Pause to let user read
        return self.bot_registry
