# İsim Şehir — v3.0 Scaling Beyond Mesh Topology

> **Priority:** P04 — long-term architectural consideration, not urgent
> **Version target:** v3.0 (research / proof of concept)
> **Status:** 🔵 Draft

## Overview

The game currently uses a WebRTC mesh topology: every peer connects to every other peer. This works well for small rooms (2-8 players, current cap) but degrades rapidly beyond that:

| Players | Connections per Peer | Total Connections |
|---|---|---|
| 4 | 3 | 6 |
| 8 | 7 | 28 |
| 16 | 15 | 120 |
| 32 | 31 | 496 |

Bandwidth usage scales O(n²) — each player uploads their state n-1 times. CPU/memory for encoding/decoding also grows linearly per peer.

This spec outlines a **Selective Forwarding Unit (SFU)** architecture as an alternative for larger rooms. This is a research/prototype item — not a commitment to implement.

## Requirements

### 1. Research Goal

Determine whether the game needs to support larger rooms (>8 players) and, if so, design an SFU-based architecture.

### 2. SFU Architecture Overview

Instead of a mesh, each peer sends their data once to a central SFU, which forwards it to all other peers:

```
Mesh:                    SFU:
A──B                     A
|\ /|                     \
| X |                      SFU──B
|/ \|                     /
C──D                     C
```

- Each player has **1 upload stream** (to the SFU) instead of n-1.
- The SFU handles fan-out: 1 incoming → n-1 outgoing per player.
- Total connections: O(n) instead of O(n²).

### 3. Applicability to İsim Şehir

Unlike video/audio conferencing, İsim Şehir's data is **small JSON messages** (state updates, answers, votes). The bandwidth per message is tiny (~1KB). The mesh topology bottleneck is therefore:

| Factor | Impact for İsim Şehir |
|---|---|
| **Bandwidth** | Low — JSON messages are small. Mesh is fine for 8-16 players. |
| **CPU (encoding)** | Low — JSON serialisation is cheap. |
| **Connection count** | Moderate — browsers handle ~30 WebRTC connections before degrading. |
| **Latency** | Low — mesh has lower latency than SFU (no relay hop). |
| **Admin bottleneck** | **High** — admin sends state updates to all peers. At 16+ players, this could cause noticeable latency. |

**Conclusion:** For the current cap of 8 players, mesh is optimal. If the cap is raised to 16+, an SFU may be beneficial for the admin's upload stream alone.

### 4. Alternative: Peer-Ephemeral Server (Hybrid)

A simpler intermediate step before a full SFU:

- Keep the mesh topology for game state (answers, votes).
- Add an **ephemeral relay server** that the admin uses for broadcast messages only (`round-start`, `game-start`, `round-end`, `room-state-sync`).
- The relay is stateless — it just fans out a single incoming message to n-1 peers.
- This reduces the admin's upload from n-1 to 1 without changing the peer architecture.

This is significantly simpler than an SFU (no WebRTC media handling, just WebSocket + broadcast).

### 5. SFU Implementation Sketch (if pursued)

| Component | Technology | Purpose |
|---|---|---|
| SFU core | `mediasoup` or `ion-sfu` | WebRTC media forwarding |
| Signalling | Existing PeerJS server + new WS endpoint | Negotiate SFU streams |
| Client SDK | Thin wrapper on existing PeerJS connections | Route state messages through SFU data channels |

#### Message Flow with SFU

```
Admin → SFU (via data channel)
  SFU → Peer 1
  SFU → Peer 2
  SFU → Peer N

Peer 1 → SFU (via data channel)
  SFU → Admin
  SFU → Peer 2
  SFU → Peer N
```

Each peer opens a single data channel to the SFU. The SFU multiplexes by message type — state updates from the admin are forwarded to all non-admin peers; answers from a peer are forwarded to all other peers.

### 6. Migration Path

Given the current 8-player cap, a full SFU is not recommended. The recommended path is:

1. **Stay on mesh** for the foreseeable future.
2. **Increase cap** to 12-16 carefully with load testing (monitor admin CPU/memory).
3. **Only if cap is raised beyond 16** → implement the ephemeral relay (step 4 above).
4. **Only if relay is insufficient** → evaluate mediasoup SFU.

### 7. Monitoring / Metrics

Add metrics to the signalling server (see `SPEC-v3.0-P03-02-observability.md`) to track:

- Average connections per peer
- Message latency for admin broadcasts (time from send to receipt by last peer)
- Admin CPU/memory under load

This data informs the decision of when to move beyond mesh.

## Open Questions

1. What is the target maximum player count? (Current: 8. Desired: ?)
2. Are there plans for voice chat or other real-time media? (SFU would be needed for that.)
3. Is the signalling server expected to handle multiple concurrent large games?

## Recommendation

**Do not implement SFU at this time.** The mesh topology is adequate for the current 8-player cap. Focus engineering effort on the P01-P03 features first. If player count needs to grow, start with the hybrid relay approach (simpler, lower risk) and only pursue SFU if relay proves insufficient.

This spec should be revisited when/if:
- Player cap is raised to ≥16
- Voice/video features are proposed
- Admin broadcast latency becomes a reported issue

## Files to Create

- (none — research only)

## Files to Modify

- (none)

## Acceptance Criteria

- [ ] Decision documented and understood by the team
- [ ] Metrics in place to detect when mesh becomes a bottleneck (see P03-02)
- [ ] If cap is raised, load testing performed before shipping
- [ ] Architecture decision record (ADR) added to `docs/` if significant changes are made later
