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

  // get roomID first
  if(!params.roomID) {
    return location.href = "/new-room"
  }

  const status = document.getElementById("status")
  const resetBtn = document.getElementById("reset")

  const ws = new WebSocketClient(`ws://${location.hostname}:8080`)
  
  ws.connect(() => {
    // join the room
    ws.emit("join-room", params.roomID)
    
    ws.on("redirect-new-room", () => {
      location.href = "/new-room"
    })

    // wait until the other player connect
    ws.on("wait-plater2", () => {
      status.innerText = "Wait for player 2"
    })

    // start playing
    ws.on("start-game", () => {
      status.innerText = "Player 1"

      for(let index = 1; index<=9; index++) {
        document.getElementById(`field${index}`).addEventListener("click", () => ws.emit("click", index))
      }
    })

    // set field with X or O
    ws.on("set-field", ({ field, content, message }) => {
      status.innerText = message
      document.getElementById(`field${field}`).innerText = content
    })

    // set a message
    ws.on("message", (message) => {
      status.innerText = message
    })

    // reset
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

    // end the game
    ws.on("end-game", (message) => {
      status.innerText = message
      resetBtn.style.display = "block"
    })
  })
}

main()
