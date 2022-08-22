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
