class WebSocketClient {
  constructor(url) {
    this.socket = new WebSocket(url)
  }

  connect(callBack) {
    this.socket.addEventListener("open", callBack)
  }

  on(event, callBack) {
    this.socket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data)
      
      if(message.event === event) {
        callBack(message.data)
      }
    })
  }

  emit(event, data) {
    this.socket.send(JSON.stringify({ event, data }))
  }

  close() {
    this.socket.close()
  }
}

