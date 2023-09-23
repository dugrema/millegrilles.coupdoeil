import asyncio

from millegrilles_messages.messages import Constantes
from millegrilles_web.SocketIoHandler import SocketIoHandler
from server import Constantes as ConstantesCoupdoeil


class SocketIoCoupdoeilHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()
        self._sio.on('requeteListeNoeuds', handler=self.requete_liste_noeuds)

        # Listeners
        self._sio.on('ecouterEvenementsPresenceNoeuds', handler=self.ecouter_presence_noeuds)
        self._sio.on('retirerEvenementsPresenceNoeuds', handler=self.retirer_presence_noeuds)

    @property
    def exchange_default(self):
        return ConstantesCoupdoeil.EXCHANGE_DEFAUT

    async def requete_liste_noeuds(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}
        return await self.executer_requete(sid, message, enveloppe=enveloppe)

    # Listeners

    async def ecouter_presence_noeuds(self, sid: str, message: dict):
        "coupdoeil/ecouterEvenementsPresenceNoeuds"
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PUBLIC, Constantes.SECURITE_PRIVE, Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.instance.presence']
        return await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)

    async def retirer_presence_noeuds(self, sid: str, params: dict):
        "coupdoeil/retirerEvenementsPresenceNoeuds"

        # const RK_PRESENCE_INSTANCES = ['evenement.instance.presence'],
        #       EX_PRESENCE_INSTANCES = ['1.public', '2.prive', '3.protege']
        #
        # function ecouterEvenementsPresenceNoeuds(socket, _params, cb) {
        #   const presence = { routingKeys: RK_PRESENCE_INSTANCES, exchanges: EX_PRESENCE_INSTANCES }
        #   socket.subscribe(presence, cb)
        # }

        pass
