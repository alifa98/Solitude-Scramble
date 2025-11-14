import ast
import importlib.util
import sys
import traceback
from multiprocessing import Process, Queue


def _safe_call_wrapper(
    queue, bot_id, bot_file_path, state, match_history, global_history
):
    """
    A target function to be run in a separate process.
    It loads the bot's code *itself* before executing.
    """
    try:
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

        if not hasattr(bot_module, "get_action"):
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
        
        
        
def safe_get_action(bot_id, bot_file_path, state, match_history, global_history, timeout=2):
    """
    Runs a bot's `get_action` function in an isolated process
    with a hard timeout.

    Passes the bot's file path to the child process for loading.
    """
    q = Queue()

    p = Process(
        target=_safe_call_wrapper,
        args=(q, bot_id, bot_file_path, state, match_history, global_history),
    )

    p.start()
    p.join(timeout=timeout)

    if p.is_alive():
        p.terminate()
        p.join()
        return "TIMEOUT", None

    try:
        status, result = q.get_nowait()
        if status == "OK":
            return "OK", result
        else:
            return status, result  # Pass error message

    except Exception:
        return "CRASH", "Queue communication error"