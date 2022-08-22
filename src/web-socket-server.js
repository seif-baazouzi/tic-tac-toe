const ws = new require("ws")

class WebSocketServer {
  constructor(port) {
    this.wss = new ws.Server({ port })
  }

  connection(callBack) {
    this.wss.on("connection", callBack)
  }

  on(ws, event, callBack) {
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString())
      
      if(message.event === event) {
        callBack(message.data)
      }
    })
  }

  emit(ws, event, data) {
    ws.send(JSON.stringify({ event, data }))
  }

  close() {
    this.wss.close()
  }
}

module.exports = WebSocketServer
