import { useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Accordion, AccordionSummary, AccordionDetails, Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useLocale } from '../../locales'
import { RULE_SECTIONS, isFirstVisit, markRulesSeen } from '../../utils/rules'

interface Props {
  open: boolean
  onClose: () => void
  autoOpen?: boolean
}

export function RulesPanel({ open, onClose, autoOpen }: Props) {
  const { t } = useLocale()

  useEffect(() => {
    if (autoOpen && isFirstVisit()) {
      onClose()
      markRulesSeen()
    }
  }, [autoOpen, onClose])

  const handleClose = () => {
    markRulesSeen()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('rules.title')}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {RULE_SECTIONS.map((section) => (
            <Accordion key={section.key} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{t(section.titleKey)}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}
                >
                  {t(section.bodyKey)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
