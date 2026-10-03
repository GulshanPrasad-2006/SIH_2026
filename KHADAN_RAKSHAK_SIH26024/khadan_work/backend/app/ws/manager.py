"""
Live update broadcaster.

Every browser tab (Mine Manager, DGMS Officer, Supervisor, Fixer, Corporate...)
opens one WebSocket connection to /ws/live on load. Whenever ANY mutating API
call succeeds anywhere in the backend — an inspection submitted, an action
assigned, a violation closed or verified, a red alert issued, a new
environmental/production/labour record logged — that endpoint calls
`broadcast_event(...)`, which pushes a small JSON message to every connected
tab. The frontend listens for these messages and refreshes the screen it's
looking at, so the site behaves like a real multi-user governance system
instead of a single-session demo: actions taken by one role show up live for
everyone else, without a manual refresh.
"""
import json
from datetime import datetime
from typing import List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()


async def broadcast_event(event_type: str, payload: dict):
    """
    Fire from inside any mutating endpoint, after db.commit(). Never raises —
    a live-update push failing should never break the underlying statutory
    action it's reporting on.
    """
    message = {
        "event": event_type,
        "payload": payload,
        "timestamp": datetime.now().isoformat()
    }
    try:
        await manager.broadcast(message)
    except Exception:
        pass
