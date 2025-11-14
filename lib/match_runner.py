import random
from collections import Counter, defaultdict

from lib.safe_calls import safe_get_action


class MatchRunner:
    def __init__(
        self,
        player_ids,
        bot_files,
        platform_min_score=1,
        platform_max_score=6,
        turns_per_match=10,
        turn_timeout=2,
    ):
        self.player_ids = player_ids
        self.bot_files = bot_files  # This is a dict { bot_id: Path }
        self.positions = ["NORTH", "SOUTH", "EAST", "WEST"]
        self.player_map = {
            pos: pid for pos, pid in zip(self.positions, self.player_ids)
        }
        self.id_to_pos = {pid: pos for pos, pid in self.player_map.items()}
        self.match_scores = defaultdict(int)
        self.match_history = []
        self.full_match_log = {
            "players": self.player_ids,
            "final_scores": {},
            "turn_data": [],
        }
        self.errors = []  # To store bot errors
        self.platform_min_score = platform_min_score
        self.platform_max_score = platform_max_score
        self.turns_per_match = turns_per_match
        self.turn_timeout = turn_timeout

    def _get_platform_scores(self):
        return {
            p: random.randint(self.platform_min_score, self.platform_max_score)
            for p in ["CENTER", "NW", "NE", "SW", "SE"]
        }

    def _get_platform_for_move(self, position, move):
        if move == "CENTER":
            return "CENTER"
        if position == "NORTH":
            return "NE" if move == "LEFT" else "NW"
        if position == "EAST":
            return "SE" if move == "LEFT" else "NE"
        if position == "SOUTH":
            return "SW" if move == "LEFT" else "SE"
        if position == "WEST":
            return "NW" if move == "LEFT" else "SW"
        return "NONE"

    def run(self):
        for turn_num in range(1, self.turns_per_match + 1):
            platform_scores = self._get_platform_scores()
            moves_made = {}
            platform_choices = {}

            for position, player_id in self.player_map.items():
                state = {
                    "my_id": player_id,
                    "my_position": position,
                    "current_turn": turn_num,
                    "platform_scores": platform_scores,
                    "opponent_positions": {
                        pos: pid
                        for pos, pid in self.player_map.items()
                        if pid != player_id
                    },
                }

                bot_file_path = self.bot_files[player_id]

                status, move_or_err = safe_get_action(
                    player_id,
                    bot_file_path,
                    state,
                    self.match_history,
                    timeout=self.turn_timeout,
                )

                if status != "OK":
                    move = "CENTER"  # Default move on failure
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
                "scores_awarded": dict(scores_awarded),
                "oppponent_positions": {
                    pos: pid for pos, pid in self.player_map.items()
                },
            }
            self.match_history.append(turn_log_entry)
            self.full_match_log["turn_data"].append(turn_log_entry)

        self.full_match_log["final_scores"] = dict(self.match_scores)
        return dict(self.match_scores), self.full_match_log, self.errors
