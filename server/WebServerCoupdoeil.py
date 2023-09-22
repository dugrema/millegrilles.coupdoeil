import logging

from millegrilles_web.WebServer import WebServer

from server import Constantes as ConstantesCoupdoeil


class WebServerCoupdoeil(WebServer):

    def __init__(self, etat, commandes):
        self.__logger = logging.getLogger(__name__ + '.' + self.__class__.__name__)
        super().__init__(ConstantesCoupdoeil.WEBAPP_PATH, etat, commandes)

    def get_nom_app(self) -> str:
        return ConstantesCoupdoeil.APP_NAME

    def _preparer_routes(self):
        self.__logger.info("Preparer routes WebServerCoupdoeil sous /coupdoeil")
        super()._preparer_routes()
        pass
