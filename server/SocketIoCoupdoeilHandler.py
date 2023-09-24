import asyncio

from typing import Optional

from millegrilles_messages.messages import Constantes
from millegrilles_web.SocketIoHandler import SocketIoHandler
from server import Constantes as ConstantesCoupdoeil


class SocketIoCoupdoeilHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()

        # Instances
        self._sio.on('requeteListeNoeuds', handler=self.requete_liste_noeuds)

        # Domaines
        self._sio.on('coupdoeil/requeteListeDomaines', handler=self.requete_liste_domaines)

        # Applications
        # self._sio.on('coupdoeil/installerApplication', handler=self.installer_application)
        # self._sio.on('coupdoeil/demarrerApplication', handler=self.demarrer_application)
        # self._sio.on('coupdoeil/arreterApplication', handler=self.arreter_application)
        # self._sio.on('coupdoeil/supprimerApplication', handler=self.supprimer_application)
        # self._sio.on('coupdoeil/requeteConfigurationApplication', handler=self.requete_configuration_application)
        # self._sio.on('coupdoeil/ajouterCatalogueApplication', handler=self.ajouter_catalogue_application)
        # self._sio.on('coupdoeil/configurerApplication', handler=self.configurer_application)

        # self._sio.on('coupdoeil/demarrerApplication', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/arreterApplication', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/supprimerApplication', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/requeteConfigurationApplication', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/transmettreCatalogues', handler=self.requete_liste_noeuds)
        # self._sio.on('coretopologie/majMonitor', handler=self.requete_liste_noeuds)
        # self._sio.on('coretopologie/supprimerInstance', handler=self.requete_liste_noeuds)
        # self._sio.on('resetClesNonDechiffrables', handler=self.requete_liste_noeuds)
        # self._sio.on('rechiffrerClesBatch', handler=self.requete_liste_noeuds)
        # self._sio.on('getConfigurationFichiers', handler=self.requete_liste_noeuds)
        # self._sio.on('getPublicKeySsh', handler=self.requete_liste_noeuds)
        # self._sio.on('modifierConfigurationConsignation', handler=self.requete_liste_noeuds)
        # self._sio.on('setFichiersPrimaire', handler=self.requete_liste_noeuds)
        # self._sio.on('declencherSync', handler=self.requete_liste_noeuds)
        # self._sio.on('demarrerBackupTransactions', handler=self.requete_liste_noeuds)
        # self._sio.on('reindexerConsignation', handler=self.requete_liste_noeuds)
        # self._sio.on('getCles', handler=self.requete_liste_noeuds)
        # self._sio.on('getConfigurationNotifications', handler=self.requete_liste_noeuds)
        # self._sio.on('conserverConfigurationNotifications', handler=self.requete_liste_noeuds)
        # self._sio.on('genererClewebpushNotifications', handler=self.requete_liste_noeuds)
        # self._sio.on('setConsignationInstance', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/requeteCatalogueApplications', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/requeteInfoApplications', handler=self.requete_liste_noeuds)
        # self._sio.on('maitrecomptes/requeteListeUsagers', handler=self.requete_liste_noeuds)
        # self._sio.on('maitrecomptes/requeteUsager', handler=self.requete_liste_noeuds)
        # self._sio.on('maitrecomptes/resetWebauthnUsager', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/requeteClesNonDechiffrables', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/requeteCompterClesNonDechiffrables', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/transactionCleRechiffree', handler=self.requete_liste_noeuds)
        # self._sio.on('transmettreCleSymmetrique', handler=self.requete_liste_noeuds)
        # self._sio.on('verifierClesSymmetriques', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/genererCertificatNoeud', handler=self.requete_liste_noeuds)
        # self._sio.on('genererCertificatNavigateur', handler=self.requete_liste_noeuds)
        # self._sio.on('maitrecomptes/majDelegations', handler=self.requete_liste_noeuds)
        # self._sio.on('coupdoeil/regenererDomaine', handler=self.requete_liste_noeuds)
        # self._sio.on('getRecoveryCsr', handler=self.requete_liste_noeuds)
        # self._sio.on('signerRecoveryCsr', handler=self.requete_liste_noeuds)
        # self._sio.on('signerRecoveryCsrParProprietaire', handler=self.requete_liste_noeuds)

        # Listeners
        self._sio.on('ecouterEvenementsPresenceNoeuds', handler=self.ecouter_presence_noeuds)
        self._sio.on('retirerEvenementsPresenceNoeuds', handler=self.retirer_presence_noeuds)

        self._sio.on('coupdoeil/ecouterEvenementsPresenceDomaines', handler=self.ecouter_presence_domaines)
        self._sio.on('coupdoeil/retirerEvenementsPresenceDomaines', handler=self.retirer_presence_domaines)


    @property
    def exchange_default(self):
        return ConstantesCoupdoeil.EXCHANGE_DEFAUT

    async def executer_requete(self, sid: str, requete: dict, domaine: str, action: str, exchange: Optional[str] = None, producer=None, enveloppe=None):
        """ Override pour toujours verifier que l'usager a la delegation proprietaire """
        enveloppe = await self.etat.validateur_message.verifier(requete)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}
        return await super().executer_requete(sid, requete, domaine, action, exchange, producer, enveloppe)

    async def executer_commande(self, sid: str, requete: dict, domaine: str, action: str, exchange: Optional[str] = None, producer=None, enveloppe=None):
        """ Override pour toujours verifier que l'usager a la delegation proprietaire """
        enveloppe = await self.etat.validateur_message.verifier(requete)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}
        return await super().executer_commande(sid, requete, domaine, action, exchange, producer, enveloppe)

    async def requete_liste_noeuds(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'listeNoeuds')

    async def requete_liste_domaines(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'listeDomaines')

    async def installer_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def demarrer_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def arreter_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def supprimer_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def requete_configuration_application(self, sid: str, message: dict):
        return await self.executer_requete(sid, message)

    async def ajouter_catalogue_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def configurer_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    #       {eventName: 'coupdoeil/demarrerApplication', callback: (params, cb) => { traiter(socket, mqdao.demarrerApplication, {params, cb}) }},
    #       {eventName: 'coupdoeil/arreterApplication', callback: (params, cb) => { traiter(socket, mqdao.arreterApplication, {params, cb}) }},
    #       {eventName: 'coupdoeil/supprimerApplication', callback: (params, cb) => { traiter(socket, mqdao.supprimerApplication, {params, cb}) }},
    #       {eventName: 'coupdoeil/requeteConfigurationApplication', callback: (params, cb) => { traiter(socket, mqdao.requeteConfigurationApplication, {params, cb}) }},
    #       {eventName: 'coupdoeil/transmettreCatalogues', callback: (params, cb) => { traiter(socket, mqdao.transmettreCatalogues, {params, cb}) }},
    #       {eventName: 'coupdoeil/requeteConfigurationAcme', callback: (params, cb) => { traiter(socket, mqdao.requeteConfigurationAcme, {params, cb}) }},
    #       {eventName: 'coupdoeil/configurerDomaineAcme', callback: (params, cb) => { traiter(socket, mqdao.configurerDomaineAcme, {params, cb}) }},
    #       {eventName: 'coretopologie/majMonitor', callback: (params, cb) => { traiter(socket, mqdao.majMonitor, {params, cb}) }},
    #       {eventName: 'coretopologie/supprimerInstance', callback: (params, cb) => { traiter(socket, mqdao.supprimerInstance, {params, cb}) }},
    #       {eventName: 'resetClesNonDechiffrables', callback: (params, cb) => { traiter(socket, mqdao.resetClesNonDechiffrables, {params, cb}) }},
    #       {eventName: 'rechiffrerClesBatch', callback: (params, cb) => { traiter(socket, mqdao.rechiffrerClesBatch, {params, cb}) }},
    #       {eventName: 'getConfigurationFichiers', callback: (params, cb) => { traiter(socket, mqdao.getConfigurationFichiers, {params, cb}) }},
    #       {eventName: 'getPublicKeySsh', callback: (params, cb) => { traiter(socket, mqdao.getPublicKeySsh, {params, cb}) }},
    #       {eventName: 'modifierConfigurationConsignation', callback: (params, cb) => { traiter(socket, mqdao.modifierConfigurationConsignation, {params, cb}) }},
    #       {eventName: 'setFichiersPrimaire', callback: (params, cb) => { traiter(socket, mqdao.setFichiersPrimaire, {params, cb}) }},
    #       {eventName: 'declencherSync', callback: (params, cb) => { traiter(socket, mqdao.declencherSync, {params, cb}) }},
    #       {eventName: 'demarrerBackupTransactions', callback: (params, cb) => { traiter(socket, mqdao.demarrerBackupTransactions, {params, cb}) }},
    #       {eventName: 'reindexerConsignation', callback: (params, cb) => { traiter(socket, mqdao.reindexerConsignation, {params, cb}) }},
    #       {eventName: 'getCles', callback: (params, cb) => { traiter(socket, mqdao.getCles, {params, cb}) }},
    #       {eventName: 'getConfigurationNotifications', callback: (params, cb) => { traiter(socket, mqdao.getConfigurationNotifications, {params, cb}) }},
    #       {eventName: 'conserverConfigurationNotifications', callback: (params, cb) => { traiter(socket, mqdao.conserverConfigurationNotifications, {params, cb}) }},
    #       {eventName: 'genererClewebpushNotifications', callback: (params, cb) => { traiter(socket, mqdao.genererClewebpushNotifications, {params, cb}) }},
    #       {eventName: 'setConsignationInstance', callback: (params, cb) => {traiter(socket, mqdao.setConsignationInstance, {params, cb})}},
    #       {eventName: 'coupdoeil/requeteListeNoeuds', callback: (params, cb) => { traiter(socket, mqdao.requeteListeNoeuds, {params, cb})}},
    #       {eventName: 'coupdoeil/requeteListeDomaines', callback: (params, cb) => { traiter(socket, mqdao.requeteListeDomaines, {params, cb})}},
    #       {eventName: 'coupdoeil/requeteCatalogueApplications', callback: (params, cb) => {traiter(socket, mqdao.requeteCatalogueApplications, {params, cb})}},
    #       {eventName: 'coupdoeil/requeteInfoApplications', callback: (params, cb) => {traiter(socket, mqdao.requeteInfoApplications, {params, cb})}},
    #       {eventName: 'maitrecomptes/requeteListeUsagers', callback: (params, cb) => {traiter(socket, mqdao.requeteListeUsagers, {params, cb})}},
    #       {eventName: 'maitrecomptes/requeteUsager', callback: (params, cb) => {traiter(socket, mqdao.requeteUsager, {params, cb})}},
    #       {eventName: 'maitrecomptes/resetWebauthnUsager', callback: (params, cb) => {traiter(socket, mqdao.resetWebauthn, {params, cb})}},
    #
    #       {eventName: 'coupdoeil/requeteClesNonDechiffrables', callback: (params, cb) => {
    #         traiter(socket, mqdao.requeteClesNonDechiffrables, {params, cb})
    #       }},
    #       {eventName: 'coupdoeil/requeteCompterClesNonDechiffrables', callback: (params, cb) => {
    #         traiter(socket, mqdao.requeteCompterClesNonDechiffrables, {params, cb})
    #       }},
    #       {eventName: 'coupdoeil/transactionCleRechiffree', callback: (params, cb) => {
    #         traiter(socket, mqdao.commandeCleRechiffree, {params, cb})
    #       }},
    #       {eventName: 'transmettreCleSymmetrique', callback: (params, cb) => {
    #         traiter(socket, mqdao.transmettreCleSymmetrique, {params, cb})
    #       }},
    #       {eventName: 'verifierClesSymmetriques', callback: (params, cb) => {
    #         traiter(socket, mqdao.verifierClesSymmetriques, {params, cb})
    #       }},
    #       {eventName: 'coupdoeil/genererCertificatNoeud', callback: (params, cb) => {
    #         traiter(socket, mqdao.genererCertificatNoeud, {params, cb})
    #       }},
    #       {eventName: 'genererCertificatNavigateur', callback: (commande, cb) => {
    #         genererCertificatNavigateurWS(socket, commande, cb)
    #       }},
    #       {eventName: 'maitrecomptes/majDelegations', callback: (params, cb) => {
    #         traiter(socket, mqdao.majDelegations, {params, cb})
    #       }},
    #       {eventName: 'coupdoeil/regenererDomaine', callback: (params, cb) => {
    #         traiter(socket, mqdao.regenererDomaine, {params, cb})
    #       }},
    #       {eventName: 'getRecoveryCsr', callback: async (params, cb) => {traiterCompteUsagersDao(socket, 'getRecoveryCsr', {params, cb})}},
    #       {eventName: 'signerRecoveryCsr', callback: async (params, cb) => {traiterCompteUsagersDao(socket, 'signerRecoveryCsr', {params, cb})}},
    #       {eventName: 'signerRecoveryCsrParProprietaire', callback: async (params, cb) => {traiter(socket, mqdao.signerRecoveryCsrParProprietaire, {params, cb})}},

    # Listeners

    async def ecouter_presence_noeuds(self, sid: str, message: dict):
        "coupdoeil/ecouterEvenementsPresenceNoeuds"
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PUBLIC, Constantes.SECURITE_PRIVE, Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.instance.presence']
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_presence_noeuds(self, sid: str, message: dict):
        "coupdoeil/retirerEvenementsPresenceNoeuds"
        exchanges = [Constantes.SECURITE_PUBLIC, Constantes.SECURITE_PRIVE, Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.instance.presence']
        reponse = await self.unsubscribe(sid, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_presence_domaines(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.*.presenceDomaine']
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_presence_domaines(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.*.presenceDomaine']
        reponse = await self.unsubscribe(sid, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    #       {eventName: 'coupdoeil/ecouterEvenementsPresenceDomaines', callback: (params, cb) => {
    #         ecouterEvenementsPresenceDomaines(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsPresenceDomaines', callback: (params, cb) => {
    #         retirerEvenementsPresenceDomaines(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsPresenceNoeuds', callback: (params, cb) => {
    #         ecouterEvenementsPresenceNoeuds(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsPresenceNoeuds', callback: (params, cb) => {
    #         retirerEvenementsPresenceNoeuds(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsInstances', callback: (params, cb) => {
    #         ecouterEvenementsInstances(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsInstances', callback: (params, cb) => {
    #         retirerEvenementsInstances(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsApplications', callback: (params, cb) => {
    #         ecouterEvenementsApplications(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsApplications', callback: (params, cb) => {
    #         retirerEvenementsApplications(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsAcme', callback: (params, cb) => {
    #         ecouterEvenementsAcme(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsAcme', callback: (params, cb) => {
    #         retirerEvenementsAcme(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsBackup', callback: (params, cb) => {
    #         ecouterEvenementsBackup(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsBackup', callback: (params, cb) => {
    #         retirerEvenementsBackup(socket, params, cb)
    #       }},
    #
    #       {eventName: 'coupdoeil/ecouterEvenementsConsignation', callback: (params, cb) => {
    #         ecouterEvenementsConsignation(socket, params, cb)
    #       }},
    #       {eventName: 'coupdoeil/retirerEvenementsConsignation', callback: (params, cb) => {
    #         retirerEvenementsConsignation(socket, params, cb)
    #       }},
    #
    #       {eventName: 'ecouterEvenementsRechiffageCles', callback: (params, cb) => {
    #         ecouterEvenementsRechiffageCles(socket, params, cb)
    #       }},
    #       {eventName: 'retirerEvenementsRechiffageCles', callback: (params, cb) => {
    #         retirerEvenementsRechiffageCles(socket, params, cb)
    #       }},
    #
    #       {eventName: 'ecouterEvenementsBackup', callback: (params, cb) => {
    #         ecouterEvenementsBackup(socket, params, cb)
    #       }},
    #       {eventName: 'retirerEvenementsBackup', callback: (params, cb) => {
    #         retirerEvenementsBackup(socket, params, cb)
    #       }},