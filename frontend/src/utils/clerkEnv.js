import { isPublishableKey } from '@clerk/shared/keys'

/** Clerk publishable key from Vite env (trimmed, no quotes). */

export function getClerkPublishableKey() {
  const raw = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/^\uFEFF/, '').replace(/^['"]|['"]$/g, '')
}

/** True if the key is a valid Clerk publishable key (decodes to frontendApi + '$'). */
export function isClerkConfigured(key = getClerkPublishableKey()) {
  if (!key || typeof key !== 'string') return false
  return isPublishableKey(key)
}
