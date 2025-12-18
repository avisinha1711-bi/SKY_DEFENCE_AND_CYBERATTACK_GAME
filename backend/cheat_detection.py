# backend/cheat_detection.py
import time
from statistics import mean, stdev

class AntiCheatSystem:
    """Detect cheating and ensure fair gameplay"""
    
    def __init__(self):
        self.player_patterns = {}
        self.suspicious_activities = []
        
    def analyze_gameplay(self, player_id, game_data):
        """Analyze gameplay for cheating patterns"""
        
        checks = [
            self._check_impossible_reactions(game_data),
            self._check_pattern_repetition(game_data),
            self._check_score_anomalies(game_data),
            self._check_timing_manipulation(game_data),
            self._check_memory_tampering(game_data)
        ]
        
        suspicious_score = sum(checks)
        
        if suspicious_score > 2:
            self._flag_player(player_id, game_data, checks)
            return False  # Likely cheating
        
        return True  # Clean gameplay
    
    def _check_impossible_reactions(self, game_data):
        """Check for humanly impossible reaction times"""
        reaction_times = game_data.get('reaction_times', [])
        
        if len(reaction_times) < 10:
            return 0
        
        avg_reaction = mean(reaction_times)
        
        # Human reaction time is typically 200-300ms
        if avg_reaction < 100:  # Impossible for humans
            return 1
        
        # Check for consistency (bots are too consistent)
        if stdev(reaction_times) < 20 and len(reaction_times) > 50:
            return 0.5
        
        return 0
    
    def _check_score_anomalies(self, game_data):
        """Detect impossible score progression"""
        score_history = game_data.get('score_history', [])
        
        if len(score_history) < 2:
            return 0
        
        # Calculate score increase rate
        increases = [score_history[i+1] - score_history[i] 
                    for i in range(len(score_history)-1)]
        
        # Check for unrealistic jumps
        max_possible = self._calculate_max_possible_score(game_data)
        for inc in increases:
            if inc > max_possible * 1.5:  # 50% more than possible
                return 1
        
        return 0
    
    def _calculate_max_possible_score(self, game_data):
        """Calculate maximum possible score given game parameters"""
        bubbles_per_second = game_data.get('bubbles_per_second', 2)
        points_per_bubble = 20
        game_duration = game_data.get('game_duration', 60)
        
        return bubbles_per_second * points_per_bubble * game_duration
