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
    location.href = "/new-room"
  }
}

main()
