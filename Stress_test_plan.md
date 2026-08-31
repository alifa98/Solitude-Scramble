# Final Stress Testing Plan

This document outlines a procedure for stress testing the `judge.py` script to identify performance bottlenecks and memory issues before the official judging period.

## 1. Objective

The goal is to simulate a large-scale tournament with 500+ bots to ensure the judge:

* Completes the tournament in a reasonable amount of time.

* Does not crash due to memory leaks or excessive usage.

* Handles I/O and process creation efficiently.

## 2. Environment Setup (Bot Duplication)

We need a large number of "valid" bots. The easiest way is to duplicate the existing bots.

**Recommended Script (Bash):**
You can use a simple shell script to create a large test directory.

```
#!/bin-bash

# --- Configuration ---
NUM_COPIES=100 # Create 100 copies of each bot
# --- MODIFICATION: Point to the correct source directory ---
BOT_SOURCE_DIR="all_submissions_1" 
TARGET_SUB_DIR="all_submissions_STRESS_TEST"
# --- END MODIFICATION ---

# --- List of your validated bots ---
BOT_DIRS=(
  "bot_greedy"
  "bot_only_center"
  "bot_only_left"
  "bot_only_right"
  "bot_random"
  "bot_second_best"
)

# --- Script ---
echo "Creating stress test directory: $TARGET_SUB_DIR"
rm -rf "$TARGET_SUB_DIR"
mkdir -p "$TARGET_SUB_DIR"

for bot_name in "${BOT_DIRS[@]}"; do
  # --- MODIFICATION: Simplify path based on screenshot ---
  # Find the original Submission.py file
  original_file="$BOT_SOURCE_DIR/$bot_name/Submission.py"
  
  if [ ! -f "$original_file" ]; then
    echo "Warning: No Submission.py found at $original_file. Skipping."
  # --- END MODIFICATION ---
    continue
  fi
  
  echo "Cloning $bot_name $NUM_COPIES times..."
  
  for i in $(seq 1 $NUM_COPIES); do
    # New bot ID and directory
    new_bot_id="${bot_name}_${i}"
    new_bot_dir="$TARGET_SUB_DIR/$new_bot_id"
    
    mkdir -p "$new_bot_dir"
    
    # Copy the file, renaming it to the required 'Submission.py'
    cp "$original_file" "$new_bot_dir/Submission.py"
  done
done

echo "Done. Created $(ls $TARGET_SUB_DIR | wc -l) total bots."
```
**To use:**

1. Save the above as `setup_stress_test.sh`.

2. Make it executable: `chmod +x setup_stress_test.sh`

3. Run it: `./setup_stress_test.sh`

4. This will create a directory `all_submissions_STRESS_TEST` filled with copies.

## 3. Execution & Monitoring

### Step 1: Run the Judge

Run the judge, pointing it to the new directory. You'll need to modify `judge.py` to point to this new directory:

```
# In judge.py
SUBMISSIONS_DIR = "all_submissions_STRESS_TEST"
```

### Step 2: Actively Monitor System Resources

While the `judge.py` script is running, use these tools in a separate terminal:

* **htop:** (Recommended) Provides a real-time, visual overview of CPU and memory usage per process. Look for:

  * `judge.py` (the main process).

  * Multiple `python3` child processes (the `safe_calls`).

  * **Memory (MEM%):** Is it climbing steadily and never going down? (Sign of a memory leak).

  * **CPU (CPU%):** Is it maxing out one core, or is the load spread?

  * **Load Average:** Is the system overloaded?

* **dstat:** (Advanced) Good for seeing I/O and context switches.

  * Run: `dstat -c -m -p -s --top-cpu`
  * If dstat not found:

  ```
  sudo apt update
  sudo apt install dstat
  ```

  * This shows CPU (`-c`), memory (`-m`), process (`-p`), and swap (`-s`) stats, plus the highest CPU process.

  * High `csw` (context switches) is expected due to multiprocessing, but it's good to see the number.

### Step 3: Code-Level Profiling

Another way of profiling

1. Run the judge using `cProfile`:

```
python3 -m cProfile -o judge.prof judge.py > judge_run.log 2>&1
```

3. This will run the entire script and save profiling data to `judge.prof`.

## 4. Analysis

After the profiled run is complete:

1. **Install `snakeviz`:**

```
pip install snakeviz
```
2. **Run `snakeviz`:**

```
snakeviz judge.prof
```

3. This will open a visual, interactive chart in your web browser.

4. Look at the "Total Time" and "Self Time" columns.

* **`safe_calls.py` (Bot Execution):** This will be the largest bottleneck. This is due to the high overhead of creating a new isolated process (and spinning up a new Python interpreter) for every single bot move. This is the expected trade-off for ensuring bot code is sandboxed and cannot interfere with the judge.

* **`match_generator.py`:** How long does `create_fair_matches` take with N=500+? If it's too long, this might need optimization.

* **`rich` (UI):** Is updating the UI (`live.update`) taking significant time? If so, you can reduce the `refresh_per_second` in the `Live()` call in `judge.py`.