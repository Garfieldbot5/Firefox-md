import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import pino from "pino"

const PHONE_NUMBER = process.env.PAIR_NUMBER // REQUIRED

async function startBot() {
  console.log("🚀 Starting WhatsApp bot (PAIR CODE MODE)")

  if (!PHONE_NUMBER) {
    console.error("❌ PAIR_NUMBER env variable not set")
    process.exit(1)
  }

  const { state, saveCreds } = await useMultiFileAuthState("./session")

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Firefox", "Chrome", "1.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update

    console.log("🔌 Connection:", connection)

    if (
      connection === "connecting" &&
      !sock.authState.creds.registered
    ) {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER)
        console.log("🔢 PAIR CODE:", code)
        console.log("📱 WhatsApp → Linked Devices → Link with phone number")
      } catch (err) {
        console.error("❌ Pair code failed:", err?.message)
        process.exit(1)
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected successfully")
    }
  })
}

startBot()
