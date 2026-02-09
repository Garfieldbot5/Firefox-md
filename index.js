import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import express from "express"
import pino from "pino"

const app = express()
const PORT = process.env.PORT || 3000

let latestPairCode = null

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Firefox", "Android", "1.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  if (!sock.authState.creds.registered) {
    const number = process.env.PAIR_NUMBER
    if (!number) {
      console.log("❌ PAIR_NUMBER not set")
      return
    }

    const code = await sock.requestPairingCode(number)
    latestPairCode = code
    console.log("🔢 PAIR CODE:", code)
  }
}

app.get("/pair-code", (req, res) => {
  if (!latestPairCode) {
    return res.json({ status: "waiting" })
  }
  res.json({ status: "ready", code: latestPairCode })
})

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`)
})

startBot()
