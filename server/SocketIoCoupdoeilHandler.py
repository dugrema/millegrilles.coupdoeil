import asyncio

from millegrilles_web.EtatWeb import EtatWeb
from millegrilles_web.SocketIoHandler import SocketIoHandler


class SocketIoCoupdoeilHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()
