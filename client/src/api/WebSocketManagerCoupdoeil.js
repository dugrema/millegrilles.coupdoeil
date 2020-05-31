import {WebSocketManager} from './WebSocketManager'

export class WebSocketManagerCoupdoeil {

  constructor() {
    this.websocketManager = new WebSocketManager()

  }

  connecter() {
    console.debug("Connecter socket.io")
  }

  deconnecter() {
    console.debug("Deconnecter socket.io")
  }

}
