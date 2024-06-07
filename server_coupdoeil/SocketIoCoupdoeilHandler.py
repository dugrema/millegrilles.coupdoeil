import asyncio
import json

from typing import Optional

from millegrilles_messages.messages import Constantes
from millegrilles_web.SocketIoHandler import SocketIoHandler
from server_coupdoeil import Constantes as ConstantesCoupdoeil


class SocketIoCoupdoeilHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()

        # Instances
        self._sio.on('requeteListeNoeuds', handler=self.requete_liste_noeuds)
        self._sio.on('coretopologie/supprimerInstance', handler=self.supprimer_instance)
        self._sio.on('coupdoeil/genererCertificatNoeud', handler=self.generer_certificat_noeud)

        # Domaines
        self._sio.on('coupdoeil/requeteListeDomaines', handler=self.requete_liste_domaines)

        # Applications
        self._sio.on('coupdoeil/requeteConfigurationApplication', handler=self.requete_configuration_application)
        self._sio.on('coupdoeil/installerApplication', handler=self.installer_application)
        self._sio.on('coupdoeil/demarrerApplication', handler=self.demarrer_application)
        self._sio.on('coupdoeil/arreterApplication', handler=self.arreter_application)
        self._sio.on('coupdoeil/supprimerApplication', handler=self.supprimer_application)
        self._sio.on('coupdoeil/configurerApplication', handler=self.configurer_application)

        # Catalogues
        self._sio.on('coupdoeil/requeteCatalogueApplications', handler=self.requete_catalogues_applications)
        self._sio.on('coupdoeil/transmettreCatalogues', handler=self.transmettre_catalogues)
        self._sio.on('coupdoeil/requeteInfoApplications', handler=self.requete_info_applications)
        self._sio.on('listeVersionsApplication', handler=self.requete_liste_versions_applications)

        # Maitre des cles
        self._sio.on('getCles', handler=self.requete_get_cles)
        self._sio.on('coupdoeil/requeteClesNonDechiffrables', handler=self.requete_cles_non_dechiffrables)
        self._sio.on('coupdoeil/requeteCompterClesNonDechiffrables', handler=self.requete_compter_cles_non_dechiffrables)
        self._sio.on('resetClesNonDechiffrables', handler=self.reset_cles_non_dechiffrables)
        self._sio.on('rechiffrerClesBatch', handler=self.rechiffrer_cles_batch)
        self._sio.on('transmettreCleSymmetrique', handler=self.transmettre_cles_symmetrique)
        self._sio.on('verifierClesSymmetriques', handler=self.verifier_cles_symmetrique)

        # Consignation
        self._sio.on('getConfigurationFichiers', handler=self.requete_configuration_fichiers)
        self._sio.on('getPublicKeySsh', handler=self.requete_cle_ssh)
        self._sio.on('modifierConfigurationConsignation', handler=self.configurer_consignation)
        self._sio.on('setFichiersPrimaire', handler=self.set_fichiers_primaire)
        self._sio.on('declencherSync', handler=self.declencher_sync)
        self._sio.on('setConsignationInstance', handler=self.set_consignation_instance)
        self._sio.on('reindexerConsignation', handler=self.reindexer_consignation)
        self._sio.on('resetTransfertsSecondaires', handler=self.reset_transferts_secondaires)

        # Backup
        self._sio.on('demarrerBackupTransactions', handler=self.demarrer_backup)

        # Notifications
        self._sio.on('getConfigurationNotifications', handler=self.requete_get_configuration_notifications)
        self._sio.on('conserverConfigurationNotifications', handler=self.conserver_configuration_notifications)
        self._sio.on('genererClewebpushNotifications', handler=self.generer_cle_webpush_notifications)

        # Usagers
        self._sio.on('maitrecomptes/requeteListeUsagers', handler=self.requete_liste_usagers)
        self._sio.on('maitrecomptes/requeteUsager', handler=self.requete_charger_usager)
        self._sio.on('getRecoveryCsr', handler=self.get_recovery_csr)
        self._sio.on('signerRecoveryCsrParProprietaire', handler=self.signer_recovery_csr_par_proprietaire)
        self._sio.on('maitrecomptes/resetWebauthnUsager', handler=self.reset_webauthn_usager)
        self._sio.on('maitrecomptes/majDelegations', handler=self.maj_usager_delegations)
        self._sio.on('getPasskeysUsager', handler=self.requete_get_passkeys_usager)

        # Hebergement
        self._sio.on('getListeClientsHebergement', handler=self.requete_liste_clients_hebergement)
        self._sio.on('sauvegarderClientHebergement', handler=self.sauvegarder_client_hebergement)
        self._sio.on('ajouterConsignationHebergee', handler=self.ajouter_consignation_hebergee)

        # Listeners
        self._sio.on('ecouterEvenementsPresenceNoeuds', handler=self.ecouter_presence_noeuds)
        self._sio.on('retirerEvenementsPresenceNoeuds', handler=self.retirer_presence_noeuds)

        self._sio.on('coupdoeil/ecouterEvenementsPresenceDomaines', handler=self.ecouter_presence_domaines)
        self._sio.on('coupdoeil/retirerEvenementsPresenceDomaines', handler=self.retirer_presence_domaines)

        # ecouterEvenementsRechiffageCles
        self._sio.on('coupdoeil/ecouterEvenementsRechiffageCles', handler=self.ecouter_rechiffrage_cles)
        self._sio.on('coupdoeil/retirerEvenementsRechiffageCles', handler=self.retirer_rechiffrage_cles)

        self._sio.on('coupdoeil/ecouterEvenementsApplications', handler=self.ecouter_applications)
        self._sio.on('coupdoeil/retirerEvenementsApplications', handler=self.retirer_applications)

        self._sio.on('ecouterEvenementsBackup', handler=self.ecouter_backup)
        self._sio.on('retirerEvenementsBackup', handler=self.retirer_backup)

        self._sio.on('coupdoeil/ecouterEvenementsConsignation', handler=self.ecouter_consignation)
        self._sio.on('coupdoeil/retirerEvenementsConsignation', handler=self.retirer_consignation)

        self._sio.on('ecouterEvenementsUsager', handler=self.ecouter_usagers)
        self._sio.on('retirerEvenementsUsager', handler=self.retirer_usagers)

        self._sio.on('ecouterEvenementsHebergement', handler=self.ecouter_hebergement)
        self._sio.on('retirerEvenementsHebergement', handler=self.retirer_hebergement)

    @property
    def exchange_default(self):
        return ConstantesCoupdoeil.EXCHANGE_DEFAUT

    async def executer_requete(self, sid: str, requete: dict, domaine: str, action: str, exchange: Optional[str] = None, producer=None, enveloppe=None):
        """ Override pour toujours verifier que l'usager a la delegation proprietaire """
        enveloppe = await self.etat.validateur_message.verifier(requete)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}
        return await super().executer_requete(sid, requete, domaine, action, exchange, producer, enveloppe)

    async def executer_commande(self, sid: str, requete: dict, domaine: str, action: str, exchange: Optional[str] = None, producer=None, enveloppe=None, nowait=False):
        """ Override pour toujours verifier que l'usager a la delegation proprietaire """
        enveloppe = await self.etat.validateur_message.verifier(requete)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}
        return await super().executer_commande(sid, requete, domaine, action, exchange, producer, enveloppe, nowait=nowait)

    # Instances
    async def requete_liste_noeuds(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'listeNoeuds')

    async def supprimer_instance(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'supprimerInstance')

    # Domaines
    async def requete_liste_domaines(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'listeDomaines')

    async def generer_certificat_noeud(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_PKI, 'signerCsr')

    # Applications
    async def installer_application(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        exchange = contenu['exchange']
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'installerApplication', exchange=exchange)

    async def demarrer_application(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        exchange = contenu['exchange']
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'demarrerApplication', exchange=exchange)

    async def arreter_application(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        exchange = contenu['exchange']
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'arreterApplication', exchange=exchange)

    async def supprimer_application(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        exchange = contenu['exchange']
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'supprimerApplication', exchange=exchange)

    async def requete_configuration_application(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_CATALOGUES, 'listeApplications')

    async def ajouter_catalogue_application(self, sid: str, message: dict):
        return await self.executer_commande(sid, message)

    async def configurer_application(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        exchange = contenu['exchange']
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'configurerApplication', exchange=exchange)

    # Catalogues
    async def requete_catalogues_applications(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_CATALOGUES, 'listeApplications')

    async def requete_info_applications(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_CATALOGUES, 'infoApplication')

    async def requete_liste_versions_applications(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_CATALOGUES, 'listeVersionsApplication')

    async def transmettre_catalogues(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_INSTANCE, 'transmettreCatalogues')

    # Maitre des cles
    async def requete_cles_non_dechiffrables(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'clesNonDechiffrables')

    async def requete_compter_cles_non_dechiffrables(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'compterClesNonDechiffrables')

    async def reset_cles_non_dechiffrables(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'resetNonDechiffrable')

    async def requete_get_cles(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'dechiffrageV2',
                                           exchange=Constantes.SECURITE_PROTEGE)

    async def rechiffrer_cles_batch(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'rechiffrerBatch')

    async def transmettre_cles_symmetrique(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'cleSymmetrique')

    async def verifier_cles_symmetrique(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MAITRE_DES_CLES, 'verifierCleSymmetrique')

    # Consignation de fichiers
    async def requete_configuration_fichiers(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'getConfigurationFichiers')

    async def requete_cle_ssh(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_FICHIERS, 'getPublicKeySsh',
                                           exchange=Constantes.SECURITE_PRIVE)

    async def requete_get_passkeys_usager(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES, 'getPasskeysUsager',
                                           exchange=Constantes.SECURITE_PRIVE)

    async def requete_liste_clients_hebergement(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_HEBERGEMENT, 'getListeClients',
                                           exchange=Constantes.SECURITE_PROTEGE)

    async def sauvegarder_client_hebergement(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_HEBERGEMENT, 'sauvegarderClient',
                                            exchange=Constantes.SECURITE_PROTEGE)

    async def ajouter_consignation_hebergee(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'ajouterConsignationHebergee')

    async def configurer_consignation(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE, 'configurerConsignation')

    async def set_fichiers_primaire(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_FICHIERS, 'setFichiersPrimaire')

    async def declencher_sync(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_FICHIERS, 'declencherSync',
                                            exchange=Constantes.SECURITE_PRIVE)

    async def reindexer_consignation(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_GROS_FICHIERS, 'reindexerConsignation')

    async def reset_transferts_secondaires(self, sid: str, message: dict):
        await self.executer_commande(sid, message, Constantes.DOMAINE_FICHIERS,
                                    'resetTransfertsSecondaires',
                                     exchange=Constantes.SECURITE_PRIVE, nowait=True)
        # reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, {'ok': True})
        # return reponse_signee
        return {'ok': True}

    async def set_consignation_instance(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_FICHIERS, 'setConsignationInstance')

    # Backup

    async def demarrer_backup(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_BACKUP,
                                            'demarrerBackupTransactions', exchange=Constantes.SECURITE_PRIVE)

    # Usagers

    async def requete_liste_usagers(self, sid: str, message: dict):
        reponse = await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES, 'getListeUsagers')
        return reponse

    async def requete_charger_usager(self, sid: str, message: dict):
        reponse = await self.executer_requete(
            sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES, 'chargerUsager',
            exchange=Constantes.SECURITE_PUBLIC)
        return reponse

    async def get_recovery_csr(self, sid: str, message: dict):
        return await self.executer_requete(
            sid, message,
            domaine=Constantes.DOMAINE_CORE_MAITREDESCOMPTES,
            action='getCsrRecoveryParcode',
            exchange=Constantes.SECURITE_PRIVE
        )

    async def signer_recovery_csr_par_proprietaire(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES,
                                           'signerCompteParProprietaire', exchange=Constantes.SECURITE_PRIVE)

    async def reset_webauthn_usager(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES,'resetWebauthnUsager')

    async def maj_usager_delegations(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_CORE_MAITREDESCOMPTES,'majUsagerDelegations')

    # Notifications
    async def requete_get_configuration_notifications(self, sid: str, message: dict):
        return await self.executer_requete(sid, message, Constantes.DOMAINE_MESSAGERIE,
                                           'getConfigurationNotifications', exchange=Constantes.SECURITE_PUBLIC)

    async def conserver_configuration_notifications(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MESSAGERIE, 'conserverConfigurationNotifications')

    async def generer_cle_webpush_notifications(self, sid: str, message: dict):
        return await self.executer_commande(sid, message, Constantes.DOMAINE_MESSAGERIE, 'genererClewebpushNotifications')

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
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
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
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_rechiffrage_cles(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.MaitreDesCles.demandeCleSymmetrique']
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_rechiffrage_cles(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = ['evenement.MaitreDesCles.demandeCleSymmetrique']
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_applications(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        contenu = json.loads(message['contenu'])
        instance_id = contenu['instanceId']
        exchange = contenu['exchange']

        exchanges = [exchange]
        routing_keys = [
            f'evenement.instance.{instance_id}.applicationDemarree',
            f'evenement.instance.{instance_id}.applicationArretee',
            f'evenement.instance.{instance_id}.erreurDemarrageApplication',
        ]

        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_applications(self, sid: str, message: dict):
        contenu = json.loads(message['contenu'])
        instance_id = contenu['instanceId']
        exchange = contenu['exchange']

        exchanges = [exchange]
        routing_keys = [
            f'evenement.instance.{instance_id}.applicationDemarree',
            f'evenement.instance.{instance_id}.applicationArretee',
            f'evenement.instance.{instance_id}.erreurDemarrageApplication',
        ]

        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_backup(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            'evenement.backup.demarrage',
            'evenement.backup.maj',
            'evenement.backup.succes',
            'evenement.backup.echec',
        ]
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_backup(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            'evenement.backup.demarrage',
            'evenement.backup.maj',
            'evenement.backup.succes',
            'evenement.backup.echec',
        ]
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_consignation(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            'evenement.fichiers.presence',
            'evenement.fichiers.syncPrimaire',
            'evenement.fichiers.syncSecondaire',
            'evenement.fichiers.syncUpload',
            'evenement.fichiers.syncDownload',
            'evenement.CoreTopologie.changementConsignationPrimaire',
        ]
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_consignation(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            'evenement.fichiers.presence',
            'evenement.fichiers.syncPrimaire',
            'evenement.fichiers.syncSecondaire',
            'evenement.fichiers.syncUpload',
            'evenement.fichiers.syncDownload',
            'evenement.CoreTopologie.changementConsignationPrimaire',
        ]
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_usagers(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = [
            'evenement.CoreMaitreDesComptes.majCompteUsager',
            'evenement.CoreMaitreDesComptes.inscrireCompteUsager',
            'evenement.CoreMaitreDesComptes.supprimerCompteUsager',
        ]
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_usagers(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = [
            'evenement.CoreMaitreDesComptes.majCompteUsager',
            'evenement.CoreMaitreDesComptes.inscrireCompteUsager',
            'evenement.CoreMaitreDesComptes.supprimerCompteUsager',
        ]
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def ecouter_hebergement(self, sid: str, message: dict):
        enveloppe = await self.etat.validateur_message.verifier(message)
        if enveloppe.get_delegation_globale != Constantes.DELEGATION_GLOBALE_PROPRIETAIRE:
            return {'ok': False, 'err': 'Acces refuse'}

        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = [
            'evenement.Hebergement.majClient',
        ]
        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee

    async def retirer_hebergement(self, sid: str, message: dict):
        exchanges = [Constantes.SECURITE_PROTEGE]
        routing_keys = [
            'evenement.Hebergement.majClient',
        ]
        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
        return reponse_signee
