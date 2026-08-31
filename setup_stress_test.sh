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