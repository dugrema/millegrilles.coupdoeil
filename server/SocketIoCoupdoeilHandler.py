import asyncio

from millegrilles_web.EtatWeb import EtatWeb
from millegrilles_web.SocketIoHandler import SocketIoHandler

from millegrilles_web import Constantes as ConstantesWeb

from server import Constantes as ConstantesCoupdoeil


class SocketIoCoupdoeilHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()
        self._sio.on('coupdoeil/requeteListeNoeuds', handler=self.requete_liste_noeuds)

    @property
    def exchange_default(self):
        return ConstantesCoupdoeil.EXCHANGE_DEFAUT

    async def requete_liste_noeuds(self, sid: str, params: dict):
        return await self.executer_requete(sid, params)
