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
  const resetBtn = document.getElementById("reset")

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

      for(let index = 1; index<=9; index++) {
        document.getElementById(`field${index}`).addEventListener("click", () => ws.emit("click", index))
      }
    })

    ws.on("set-field", ({ field, content, message }) => {
      status.innerText = message
      document.getElementById(`field${field}`).innerText = content
    })

    ws.on("message", (message) => {
      status.innerText = message
    })

    resetBtn.addEventListener("click", () => {
      ws.emit("reset")
    })

    ws.on("reset", () => {
      status.innerText = "Player 1"
      resetBtn.style.display = "none"

      for(let index = 1; index<=9; index++) {
        document.getElementById(`field${index}`).innerText = index
      }
    })

    ws.on("end-game", (message) => {
      status.innerText = message
      resetBtn.style.display = "block"
    })
  })
}

main()
