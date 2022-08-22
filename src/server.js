// express server

const { v4: uuidv4 } = require("uuid")
const express = require("express")
const path = require("path")
const app = express()

const morgan = require("morgan")

// app.use(morgan(":method :url :status :res[content-length] - :response-time ms"))

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
      
      room.paler1.on("close", () => room.paler2.on("close", rooms.delete(roomID)))
      room.paler2.on("close", () => room.paler1.on("close", rooms.delete(roomID)))

    } else {
      const room = {
        paler1: ws,
        paler2: null,
      }
      
      rooms.set(roomID, room)
      server.emit(ws, "wait-plater2")
    }
  })
})
