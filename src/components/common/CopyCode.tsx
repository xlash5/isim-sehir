import { useState } from 'react'
import { Button, Snackbar } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface Props {
  code: string
}

export function CopyCode({ code }: Props) {
  const [open, setOpen] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setOpen(true)
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={handleCopy}
        sx={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: 4 }}
      >
        {code}
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        message="Oda kodu kopyalandı!"
      />
    </>
  )
}
