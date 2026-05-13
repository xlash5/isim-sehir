import { useState, useRef, useEffect } from 'react'
import { Paper, TextField, IconButton, Typography, Box, List, ListItem } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ChatIcon from '@mui/icons-material/Chat'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'

interface Props {
  onSend: (text: string) => void
}

export function ChatBox({ onSend }: Props) {
  const [text, setText] = useState('')
  const messages = useGameStore((s) => s.chatMessages)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const listRef = useRef<HTMLUListElement>(null)
  const { t } = useLocale()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <Paper sx={{ p: 2, height: 300, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ChatIcon fontSize="small" />
        <Typography variant="subtitle2">{t('chat.title')}</Typography>
      </Box>
      <List
        ref={listRef}
        sx={{ flex: 1, overflow: 'auto', mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
      >
        {messages.map((msg, i) => (
          <ListItem key={i} sx={{ px: 0, py: 0, flexDirection: 'column', alignItems: 'stretch' }}>
            <Typography variant="caption" sx={{ color: msg.playerId === localPlayerId ? 'primary.light' : 'text.secondary', fontWeight: 600 }}>
              {msg.nickname}:
            </Typography>
            <Typography variant="body2">{msg.text}</Typography>
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t('chat.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <IconButton onClick={handleSend} color="primary" disabled={!text.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  )
}
