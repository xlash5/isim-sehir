import { PeerServer } from 'peer'

const PORT = parseInt(process.env.PORT || '9000', 10)
const MAX_PEERS_PER_ROOM = parseInt(process.env.MAX_PEERS_PER_ROOM || '8', 10)
const MAX_CONNECTIONS_PER_SEC = parseInt(process.env.MAX_CONNECTIONS_PER_SEC || '5', 10)
const CONNECTION_TIMEOUT_MS = parseInt(process.env.CONNECTION_TIMEOUT_MS || '30000', 10)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://isim-sehir-phi.vercel.app')
  .split(',')
  .map(s => s.trim())

function isRoomCode(id) {
  return typeof id === 'string' && /^[A-Za-z0-9]{6}$/.test(id)
}

function getClientIp(client) {
  const socket = client.getSocket()
  if (!socket) return 'unknown'
  const addr = socket._socket?.remoteAddress
  const family = socket._socket?.remoteFamily
  return addr ? `${addr} (${family || '?'})` : 'unknown'
}

const ipTimestamps = new Map()

function isIpRateLimited(ip) {
  const now = Date.now()
  let timestamps = ipTimestamps.get(ip)
  if (!timestamps) {
    timestamps = []
    ipTimestamps.set(ip, timestamps)
  }
  const windowStart = now - 1000
  while (timestamps.length > 0 && timestamps[0] < windowStart) {
    timestamps.shift()
  }
  if (timestamps.length >= MAX_CONNECTIONS_PER_SEC) {
    return true
  }
  timestamps.push(now)
  return false
}

const roomMembers = new Map()
const peerToRoom = new Map()

function logReject(reason, detail) {
  console.log(`[REJECT] ${reason}: ${JSON.stringify(detail)}`)
}

const peerServer = PeerServer({
  port: PORT,
  path: '/isim-sehir',
  allow_discovery: false,
  expire_timeout: CONNECTION_TIMEOUT_MS,
  corsOptions: {
    origin: ALLOWED_ORIGINS,
  },
})

peerServer.on('connection', (client) => {
  const peerId = client.getId()
  const ip = getClientIp(client)

  console.log(`[CONNECT] Peer ${peerId} from ${ip}`)

  if (isIpRateLimited(ip)) {
    logReject('IP_RATE_LIMIT', { peerId, ip })
    client.getSocket()?.close()
    return
  }

  if (isRoomCode(peerId)) {
    const count = roomMembers.get(peerId)?.size ?? 0
    console.log(`[ROOM] Admin ${peerId} connected, room has ${count} tracked member(s)`)
  }
})

peerServer.on('message', (client, message) => {
  if (message.type !== 'OFFER') return

  const srcId = message.src
  const dstId = message.dst

  if (!isRoomCode(dstId) || srcId === dstId) return

  const existingRoom = peerToRoom.get(srcId)
  if (existingRoom && existingRoom !== dstId) {
    logReject('MULTI_ROOM', { peerId: srcId, existingRoom, attemptedRoom: dstId })
    client.getSocket()?.close()
    return
  }

  if (peerToRoom.has(srcId)) return

  const members = roomMembers.get(dstId)
  const count = members ? members.size : 0

  if (count >= MAX_PEERS_PER_ROOM) {
    logReject('ROOM_FULL', { peerId: srcId, roomCode: dstId, count, max: MAX_PEERS_PER_ROOM })
    client.getSocket()?.close()
    return
  }

  if (!members) {
    roomMembers.set(dstId, new Set())
  }
  roomMembers.get(dstId).add(srcId)
  peerToRoom.set(srcId, dstId)
  console.log(`[ROOM] Peer ${srcId} joined room ${dstId} (${count + 1}/${MAX_PEERS_PER_ROOM})`)
})

peerServer.on('disconnect', (client) => {
  const peerId = client.getId()
  console.log(`[DISCONNECT] Peer ${peerId}`)

  const roomCode = peerToRoom.get(peerId)
  if (roomCode) {
    const members = roomMembers.get(roomCode)
    if (members) {
      members.delete(peerId)
      const remaining = members.size
      if (remaining === 0) {
        roomMembers.delete(roomCode)
        console.log(`[ROOM] Room ${roomCode} is now empty`)
      } else {
        console.log(`[ROOM] Peer ${peerId} left room ${roomCode} (${remaining}/${MAX_PEERS_PER_ROOM})`)
      }
    }
    peerToRoom.delete(peerId)
  }
})

peerServer.on('error', (err) => {
  console.error(`[ERROR] ${err.message}`)
})

setInterval(() => {
  const threshold = Date.now() - 1000
  for (const [ip, timestamps] of ipTimestamps) {
    while (timestamps.length > 0 && timestamps[0] < threshold) {
      timestamps.shift()
    }
    if (timestamps.length === 0) {
      ipTimestamps.delete(ip)
    }
  }
}, 60000).unref()

console.log(`PeerJS signaling server starting on port ${PORT}`)
console.log(`  Allowed origins:       ${ALLOWED_ORIGINS.join(', ')}`)
console.log(`  Max peers per room:    ${MAX_PEERS_PER_ROOM}`)
console.log(`  Max connections/sec/IP: ${MAX_CONNECTIONS_PER_SEC}`)
console.log(`  Connection timeout:    ${CONNECTION_TIMEOUT_MS}ms`)
