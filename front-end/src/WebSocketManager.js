class WebSocketManager {

  constructor() {
    this.socket = null;
    this.routingKeyCallbacks = {};
  }

  setupWebSocket(webSocket) {
    this.socket = webSocket;

    this.socket.on('mq_message', enveloppe=>{
      let {routingKey, message} = enveloppe;
      // console.log("MQ Message recu: " + routingKey);
      // console.log(message);
      this.traiterMessageMq(routingKey, message);
    });
  }

  getWebSocket() {
    return this.socket;
  }

  subscribe(routingKeys, callback) {
    // Transmet une liste de routingKeys a enregistrer sur notre Q.
    this.socket.emit('subscribe', routingKeys);

    for(var key_id in routingKeys) {
      let routingKey = routingKeys[key_id];

      var dictCallback = this.routingKeyCallbacks[routingKey];
      if(!dictCallback) {
        this.routingKeyCallbacks[routingKey] = callback;
      } else {
        console.warn("Changement de callback pour " + routingKey);
        this.routingKeyCallbacks[routingKey] = callback;
      }
    }
  }

  unsubscribe(routingKeys, callback) {
    // Transmet une liste de routingKeys a retirer de la Q cote serveur.
    this.socket.emit('unsubscribe', routingKeys);

    for(var key_id in routingKeys) {
      let routingKey = routingKeys[key_id];
      delete this.routingKeyCallbacks[routingKey];
    }

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

  traiterMessageMq(routingKey, message) {
    let callback = this.routingKeyCallbacks[routingKey];
    if(callback) {
      callback(routingKey, message);
    }
  }

}

const manager = new WebSocketManager();

export default manager;