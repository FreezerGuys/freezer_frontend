import { FormEvent, useState } from 'react'
import { Box, TextField, Button, Alert, Stack, CircularProgress } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { submitContactMessage } from '@/lib/firebaseQueries'
import { validateContactMessage } from '@/lib/validators'

/**
 * Public contact form, shown to signed-out visitors on the homepage.
 * Submissions are written straight to Firestore's ContactMessages
 * collection (no auth required - see firestore.rules) so admins can review
 * them without needing an email server configured.
 */
export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  // Honeypot field - real visitors never see or fill this in (visually
  // hidden below). Bots that blindly fill every input will trip it.
  const [website, setWebsite] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const input = { name, email, message }
    const validation = validateContactMessage(input)
    setFieldErrors(validation.errors)
    if (!validation.isValid) return

    // Spam caught by the honeypot: pretend it worked so bots don't learn
    // to avoid the field, but skip the real write.
    if (website.trim()) {
      setIsSubmitted(true)
      return
    }

    setIsSubmitting(true)
    try {
      await submitContactMessage(input)
      setIsSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Alert severity="success" sx={{ borderRadius: 2 }}>
        Thanks for reaching out! We&apos;ll get back to you soon.
      </Alert>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name}
          disabled={isSubmitting}
          fullWidth
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
          disabled={isSubmitting}
          fullWidth
          required
        />
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={Boolean(fieldErrors.message)}
          helperText={fieldErrors.message}
          disabled={isSubmitting}
          fullWidth
          required
          multiline
          minRows={4}
        />

        {/* Honeypot - hidden from real users via CSS + tabIndex, not `display:none`
            (some bots skip inputs that are display:none) and not `type="hidden"`
            (autofill sometimes skips those too). */}
        <Box
          sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          aria-hidden="true"
        >
          <TextField
            label="Website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Box>

        {submitError && <Alert severity="error">{submitError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          sx={{ alignSelf: 'flex-start', px: 4, py: 1.25 }}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </Stack>
    </Box>
  )
}
