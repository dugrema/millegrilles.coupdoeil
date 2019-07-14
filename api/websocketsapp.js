class WebSocketApp {

  constructor() {
    this.new_sockets = [];
    this.authenticated_sockets = Object();
    setInterval(()=>{
      this.clean();
    }, 5000);
  }

  clean() {
    for(var socket_id in this.new_sockets) {
      let socket_obj = this.new_sockets[socket_id]
      if(!socket_obj.disconnected) {
        console.debug("On deconnecte un socket expire: " + socket_obj.id);
        socket_obj.disconnect();
      } else {
        console.debug("Nettoyage vieux socket deja deconnecte: " + socket_obj.id);
      }
      delete this.new_sockets[socket_id];
    }
  }

  addSocket(socket) {
    // Ajoute un socket d'une nouvelle connexion
    console.debug("Nouveau socket!");
    this.new_sockets[socket.id] = socket;
  }

}

const websocketapp = new WebSocketApp();
module.exports = websocketapp;
