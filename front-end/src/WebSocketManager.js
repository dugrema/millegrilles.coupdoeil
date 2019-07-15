class WebSocketManager {

  constructor() {
    this.socket = null;
  }

  setWebSocket(webSocket) {
    this.socket = webSocket;
  }

  getWebSocket() {
    return this.socket;
  }

  transmettreRequete(routingKey, requete) {
    // Transmet une requete. Retourne une Promise pour recuperer la reponse.

    let socket = this.socket;
    let promise = new Promise((resolve, reject) => {
      let enveloppe = {
        'routingKey': routingKey,
        'requete': requete
      };

      // Transmettre requete
      socket.emit('requete', enveloppe, reponse=>{
        if(!reponse) {
          console.error("Erreur survenue durant requete vers " + routingKey);
          reject();
          return;
        }
        // console.log("Reponse dans websocket pour requete");
        // console.log(reponse);
        resolve(reponse);
        return reponse;
      });
    });

    return promise;
  }

}

const manager = new WebSocketManager();

export default manager;
