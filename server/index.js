import { PeerServer } from 'peer'

const PORT = process.env.PORT || 9000

PeerServer({
  port: PORT,
  path: '/isim-sehir',
  allow_discovery: true,
})

console.log(`PeerJS signaling server running on port ${PORT}`)
