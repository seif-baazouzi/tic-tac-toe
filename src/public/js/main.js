function parseQueryParams() {
  const params = {}

  location.search
    .substring(1)
    .split("&")
    .forEach((q) => {
      const fields = q.split("=")
      const key = fields[0].trim()
      const value = fields.slice(1).join("=")

      params[key] = value
    })

  return params
}

function main() {
  const params = parseQueryParams()

  if(!params.roomID) {
    return location.href = "/new-room"
  }

  const status = document.getElementById("status")

  const ws = new WebSocketClient(`ws://${location.hostname}:8080`)
  
  ws.connect(() => {
    ws.emit("join-room", params.roomID)
    
    ws.on("redirect-new-room", () => {
      location.href = "/new-room"
    })

    ws.on("wait-plater2", () => {
      status.innerText = "wait-plater2"
    })

    ws.on("start-game", () => {
      status.innerText = "start-game"
    })
  })
}

main()
