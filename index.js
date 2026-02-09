import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import express from "express"
import pino from "pino"

const app = express()
app.use(express.json())

let sock
let currentCode = null
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
}

app.post("/pair", async (req, res) => {
  if (busy) {
    return res.json({ error: "Already generating a code" })
  }

  const number = req.body.number?.replace(/\D/g, "")
  if (!number) {
    return res.json({ error: "Invalid number" })
  }

  busy = true
  currentCode = null

  try {
    const code = await sock.requestPairingCode(number)
    currentCode = code
    res.json({ success: true, code })
  } catch (e) {
    res.json({ error: "Pairing failed. Try again later." })
  } finally {
    busy = false
  }
})

app.listen(3000, () => {
  console.log("🌐 Server running on port 3000")
})

initBot()
