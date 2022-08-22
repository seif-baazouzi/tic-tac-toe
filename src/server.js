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
      const room = rooms.get(roomID)

      if(room.paler1 != null && room.paler2 != null) {
        return server.emit(ws, "redirect-new-room")
      }

      room.paler2 = ws
      
      server.emit(room.paler1, "start-game")
      server.emit(room.paler2, "start-game")
      
      room.paler1.on("close", () => {
        server.emit(room.paler2, "message", "Player 1 disconnected")
        room.paler2.close()
      })

      room.paler2.on("close", () => {
        server.emit(room.paler1, "message", "Player 2 disconnected")
        room.paler1.close()
      })

      server.on(room.paler1, "click", (field) => {
        if(room.endGame) return
        if(room.currentPlayer != "p1") return
        if(room.fields[field-1] != field) return

        room.fields[field-1] = "X"
        server.emit(room.paler1, "set-field", { field, content: "X", message: "Player 2" })
        server.emit(room.paler2, "set-field", { field, content: "X", message: "Player 2" })

        room.currentPlayer = "p2"

        if(checkWin(room.fields, "X")) {
          room.endGame = true
          server.emit(room.paler1, "message", "Player 1 WIN")
          server.emit(room.paler2, "message", "Player 1 WIN")
        }
      })

      server.on(room.paler2, "click", (field) => {
        if(room.endGame) return
        if(room.currentPlayer != "p2") return
        if(room.fields[field-1] != field) return
        
        room.fields[field-1] = "O"
        server.emit(room.paler1, "set-field", { field, content: "O", message: "Player 1" })
        server.emit(room.paler2, "set-field", { field, content: "O", message: "Player 1" })

        room.currentPlayer = "p1"

        if(checkWin(room.fields, "O")) {
          room.endGame = true
          server.emit(room.paler1, "message", "Player 2 WIN")
          server.emit(room.paler2, "message", "Player 2 WIN")
        }
      })
    } else {
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
