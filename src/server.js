// express server

const { v4: uuidv4 } = require("uuid")
const express = require("express")
const path = require("path")
const app = express()

const morgan = require("morgan")

app.use(morgan(":method :url :status :res[content-length] - :response-time ms"))

app.use(express.static(path.join(__dirname, "public")))

app.get("/new-room", (req, res) => {
  const uuid = uuidv4()
  res.redirect(`/?roomID=${uuid}`)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))

// web socket server

const WebSocketServer = require("./web-socket-server")

const WS_PORT = process.env.WS_PORT || 8080

const server = new WebSocketServer(WS_PORT)

const rooms = new Map()

server.connection((ws) => {
  server.on(ws, "join-room", (roomID) => {
    if(rooms.has(roomID)) {
      // join the second player to the room
      const room = rooms.get(roomID)

      if(room.paler1 != null && room.paler2 != null) {
        return server.emit(ws, "redirect-new-room")
      }

      room.paler2 = ws
      
      // start game
      server.emit(room.paler1, "start-game")
      server.emit(room.paler2, "start-game")

      // click event
      server.on(room.paler1, "click", (field) => {
        playerClickEvent({
          room,
          field,
          currentPlayer: "p1",
          otherPlayer: "p2",
          currentPlayerName: "Player 1",
          otherPlayerName: "Player 2",
          symbol: "X",
        })
      })

      server.on(room.paler2, "click", (field) => {
        playerClickEvent({
          room,
          field,
          currentPlayer: "p2",
          otherPlayer: "p1",
          currentPlayerName: "Player 2",
          otherPlayerName: "Player 1",
          symbol: "O",
        })
      })

      // reset event
      playerReset({ room, player: room.paler1 })
      playerReset({ room, player: room.paler2 })

      // close event
      playerCloseEvent(room)
    } else {
      // create room
      const room = {
        paler1: ws,
        paler2: null,
        endGame: false,
        currentPlayer: "p1",
        fields: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
      }
      
      rooms.set(roomID, room)
      server.emit(ws, "wait-plater2")
    }
  })
})

// player click event handler
function playerClickEvent({ room, field, currentPlayer, otherPlayer, currentPlayerName, otherPlayerName, symbol }) {
  if(room.endGame) return
  if(room.fields[field-1] != field) return
  if(room.currentPlayer != currentPlayer) return
  
  room.fields[field-1] = symbol
  server.emit(room.paler1, "set-field", { field, content: symbol, message: otherPlayerName })
  server.emit(room.paler2, "set-field", { field, content: symbol, message: otherPlayerName })

  room.currentPlayer = otherPlayer

  if(checkWin(room.fields, symbol)) {
    room.endGame = true
    endGame(room, `${currentPlayerName} WIN`)
  }

  if(room.fields.every((f) => f === "X" || f === "O")) {
    endGame(room, "No one win")
  }
}

// player reset handler
function playerReset({ room, player }) {
  server.on(player, "reset", () => {
    room.endGame = false
    room.currentPlayer = "p1"
    room.fields = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

    server.emit(room.paler1, "reset")
    server.emit(room.paler2, "reset")
  })
}

// end game handler
function endGame(room, message) {
  server.emit(room.paler1, "end-game", message)
  server.emit(room.paler2, "end-game", message)
}

// close event handler
function playerCloseEvent(room) {
  room.paler1.on("close", () => {
    server.emit(room.paler2, "message", "Player 1 disconnected")
    room.paler2.close()
  })

  room.paler2.on("close", () => {
    server.emit(room.paler1, "message", "Player 2 disconnected")
    room.paler1.close()
  })
}

// check if the is any win
function checkWin(fields, symbol) {
  return (
    (fields[0] === fields[1] && fields[1] === fields[2] && fields[2] === symbol) ||
    (fields[3] === fields[4] && fields[4] === fields[5] && fields[5] === symbol) ||
    (fields[6] === fields[7] && fields[7] === fields[8] && fields[8] === symbol) ||

    (fields[0] === fields[3] && fields[3] === fields[6] && fields[6] === symbol) ||
    (fields[1] === fields[4] && fields[4] === fields[7] && fields[7] === symbol) ||
    (fields[2] === fields[5] && fields[5] === fields[8] && fields[8] === symbol) ||

    (fields[0] === fields[4] && fields[4] === fields[8] && fields[8] === symbol) ||
    (fields[2] === fields[4] && fields[4] === fields[6] && fields[6] === symbol)
  )
}
