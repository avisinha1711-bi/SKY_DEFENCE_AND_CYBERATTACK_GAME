"""
Bubble Shooter Game Server - Python Backend
Handles multiplayer, leaderboards, and game services
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Player:
    """Player data structure"""
    id: str
    username: str
    score: int = 0
    speed_level: int = 1
    accuracy: float = 0.0
    join_time: datetime = None
    websocket: Optional[websockets.WebSocketServerProtocol] = None
    
    def __post_init__(self):
        if self.join_time is None:
            self.join_time = datetime.now()

@dataclass
class GameRoom:
    """Multiplayer game room"""
    room_id: str
    players: Dict[str, Player]
    game_state: str = "waiting"  # waiting, playing, finished
    start_time: Optional[datetime] = None
    max_players: int = 4
    
    def add_player(self, player: Player):
        if len(self.players) < self.max_players:
            self.players[player.id] = player
            return True
        return False
    
    def remove_player(self, player_id: str):
        return self.players.pop(player_id, None)
    
    def broadcast(self, message: dict, exclude_player_id: str = None):
        """Send message to all players in room"""
        for player_id, player in self.players.items():
            if player_id != exclude_player_id and player.websocket:
                asyncio.create_task(
                    player.websocket.send(json.dumps(message))
                )

class GameServer:
    """Main game server handling connections and game logic"""
    
    def __init__(self):
        self.active_players: Dict[str, Player] = {}
        self.game_rooms: Dict[str, GameRoom] = {}
        self.leaderboard: List[Dict] = []
        self.player_stats: Dict[str, Dict] = {}
        
        # Load game configuration
        self.config = {
            "bubble_speed_base": 1.0,
            "speed_increase_rate": 0.3,
            "speed_interval": 7,
            "points_per_bubble": 20,
            "max_bubbles": 15
        }
    
    async def handle_client(self, websocket, path):
        """Handle incoming WebSocket connections"""
        player_id = None
        
        try:
            # Wait for player to join
            async for message in websocket:
                data = json.loads(message)
                msg_type = data.get('type')
                
                if msg_type == 'join':
                    player_id = await self.handle_join(websocket, data)
                    
                elif msg_type == 'shoot':
                    await self.handle_shoot(player_id, data)
                    
                elif msg_type == 'score_update':
                    await self.handle_score_update(player_id, data)
                    
                elif msg_type == 'game_over':
                    await self.handle_game_over(player_id, data)
                    
                elif msg_type == 'get_leaderboard':
                    await self.send_leaderboard(websocket)
                    
                elif msg_type == 'ping':
                    await websocket.send(json.dumps({'type': 'pong'}))
        
        except websockets.ConnectionClosed:
            logger.info(f"Player {player_id} disconnected")
        
        finally:
            if player_id:
                await self.handle_disconnect(player_id)
    
    async def handle_join(self, websocket, data):
        """Handle new player joining"""
        username = data.get('username', 'Player')
        player_id = f"player_{len(self.active_players) + 1}_{datetime.now().timestamp()}"
        
        player = Player(
            id=player_id,
            username=username,
            websocket=websocket
        )
        
        self.active_players[player_id] = player
        
        # Create or join a game room
        room_id = self.find_or_create_room(player)
        
        # Send welcome message
        welcome_msg = {
            'type': 'welcome',
            'player_id': player_id,
            'room_id': room_id,
            'config': self.config
        }
        
        await websocket.send(json.dumps(welcome_msg))
        
        # Notify other players
        room = self.game_rooms[room_id]
        room.broadcast({
            'type': 'player_joined',
            'player_id': player_id,
            'username': username,
            'total_players': len(room.players)
        }, exclude_player_id=player_id)
        
        logger.info(f"Player {username} ({player_id}) joined room {room_id}")
        return player_id
    
    def find_or_create_room(self, player):
        """Find available room or create new one"""
        for room_id, room in self.game_rooms.items():
            if len(room.players) < room.max_players and room.game_state == "waiting":
                room.add_player(player)
                return room_id
        
        # Create new room
        room_id = f"room_{len(self.game_rooms) + 1}"
        new_room = GameRoom(room_id=room_id, players={player.id: player})
        self.game_rooms[room_id] = new_room
        return room_id
    
    async def handle_shoot(self, player_id, data):
        """Process player shooting"""
        player = self.active_players.get(player_id)
        if not player:
            return
        
        # Update player accuracy stats
        hit = data.get('hit', False)
        self.update_player_stats(player_id, 'shots_fired', 1)
        if hit:
            self.update_player_stats(player_id, 'shots_hit', 1)
        
        # Broadcast shot to room (for multiplayer effects)
        room = self.find_player_room(player_id)
        if room:
            room.broadcast({
                'type': 'player_shot',
                'player_id': player_id,
                'position': data.get('gun_position'),
                'hit': hit
            }, exclude_player_id=player_id)
    
    async def handle_score_update(self, player_id, data):
        """Update player score and broadcast"""
        player = self.active_players.get(player_id)
        if not player:
            return
        
        new_score = data.get('score', 0)
        speed_level = data.get('speed_level', 1)
        
        player.score = new_score
        player.speed_level = speed_level
        
        # Update leaderboard
        self.update_leaderboard(player_id, player.username, new_score, speed_level)
        
        # Broadcast to room
        room = self.find_player_room(player_id)
        if room:
            room.broadcast({
                'type': 'score_update',
                'player_id': player_id,
                'score': new_score,
                'speed_level': speed_level
            })
    
    async def handle_game_over(self, player_id, data):
        """Handle game over event"""
        final_score = data.get('final_score', 0)
        speed_level = data.get('speed_level', 1)
        
        # Save player stats
        self.save_player_stats(player_id, {
            'final_score': final_score,
            'speed_level': speed_level,
            'end_time': datetime.now().isoformat()
        })
        
        logger.info(f"Player {player_id} finished with score {final_score} at speed level {speed_level}")
        
        # Offer to restart or join new room
        player = self.active_players.get(player_id)
        if player and player.websocket:
            await player.websocket.send(json.dumps({
                'type': 'game_over_ack',
                'final_score': final_score,
                'rank': self.get_player_rank(player_id)
            }))
    
    async def send_leaderboard(self, websocket):
        """Send current leaderboard to player"""
        leaderboard_data = {
            'type': 'leaderboard',
            'data': self.leaderboard[:10]  # Top 10
        }
        await websocket.send(json.dumps(leaderboard_data))
    
    def update_player_stats(self, player_id, stat_type, value):
        """Update player statistics"""
        if player_id not in self.player_stats:
            self.player_stats[player_id] = {
                'shots_fired': 0,
                'shots_hit': 0,
                'games_played': 0,
                'total_score': 0
            }
        
        if stat_type in self.player_stats[player_id]:
            self.player_stats[player_id][stat_type] += value
    
    def update_leaderboard(self, player_id, username, score, speed_level):
        """Update global leaderboard"""
        entry = {
            'player_id': player_id,
            'username': username,
            'score': score,
            'speed_level': speed_level,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add or update in leaderboard
        for i, item in enumerate(self.leaderboard):
            if item['player_id'] == player_id:
                if score > item['score']:
                    self.leaderboard[i] = entry
                return
        
        self.leaderboard.append(entry)
        # Sort by score (descending)
        self.leaderboard.sort(key=lambda x: x['score'], reverse=True)
    
    def find_player_room(self, player_id):
        """Find which room a player is in"""
        for room in self.game_rooms.values():
            if player_id in room.players:
                return room
        return None
    
    def get_player_rank(self, player_id):
        """Get player's rank in leaderboard"""
        for i, entry in enumerate(self.leaderboard):
            if entry['player_id'] == player_id:
                return i + 1
        return None
    
    def save_player_stats(self, player_id, game_data):
        """Save complete player stats (would connect to DB in production)"""
        self.player_stats[player_id]['games_played'] += 1
        self.player_stats[player_id]['total_score'] += game_data.get('final_score', 0)
    
    async def handle_disconnect(self, player_id):
        """Handle player disconnection"""
        player = self.active_players.pop(player_id, None)
        if player:
            # Remove from room
            room = self.find_player_room(player_id)
            if room:
                room.remove_player(player_id)
                room.broadcast({
                    'type': 'player_left',
                    'player_id': player_id,
                    'username': player.username
                })
            
            logger.info(f"Player {player.username} disconnected")

async def main():
    """Start the game server"""
    server = GameServer()
    
    # Start WebSocket server
    async with websockets.serve(
        server.handle_client, 
        "localhost", 
        8765,
        ping_interval=20,
        ping_timeout=60
    ):
        logger.info("Bubble Shooter Game Server started on ws://localhost:8765")
        logger.info("Press Ctrl+C to stop")
        
        # Keep server running
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
