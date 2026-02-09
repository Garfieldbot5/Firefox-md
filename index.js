import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import express from "express"
import pino from "pino"

const app = express()
app.use(express.json())

let sock
let ready = false
let busy = false

async function initBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Firefox", "Android", "1.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection }) => {
    console.log("🔌 Connection:", connection)
    if (connection === "open" || connection === "connecting") {
      ready = true
    }
    if (connection === "close") {
      ready = false
    }
  })
}

app.post("/pair", async (req, res) => {
  if (!ready) {
    return res.json({ error: "WhatsApp not ready. Try again later." })
  }
  if (busy) {
    return res.json({ error: "Already generating code" })
  }

  const number = req.body.number?.replace(/\D/g, "")
  if (!number) {
    return res.json({ error: "Invalid number" })
  }

  busy = true

  try {
    const code = await sock.requestPairingCode(number)
    res.json({ success: true, code })
  } catch (e) {
    res.json({ error: "Pairing blocked by WhatsApp. Wait 15 minutes." })
  } finally {
    busy = false
  }
})

app.listen(3000, () => {
  console.log("🌐 Server running on port 3000")
})

initBot()
