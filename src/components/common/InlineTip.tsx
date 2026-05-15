import { Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface Props {
  text: string
}

export function InlineTip({ text }: Props) {
  return (
    <Tooltip title={text} arrow placement="top">
      <InfoOutlinedIcon
        sx={{
          fontSize: 16,
          color: 'text.disabled',
          cursor: 'help',
          verticalAlign: 'middle',
          ml: 0.5,
        }}
      />
    </Tooltip>
  )
}
