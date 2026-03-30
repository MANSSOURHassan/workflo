// Security validation utilities for input sanitization and validation
import { z } from 'zod'

// Email validation with strict regex
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

// Phone validation (international format)
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return true // Phone is optional
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
  return phoneRegex.test(phone) && phone.length <= 20
}

// URL validation
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true // URL is optional
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Sanitize string input - remove potential XSS vectors
export function sanitizeString(input: string | null | undefined, maxLength = 1000): string | null {
  if (!input || typeof input !== 'string') return null
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  return sanitized || null
}

// Sanitize for database - less strict, keeps original characters
export function sanitizeForDb(input: string | null | undefined, maxLength = 1000): string | null {
  if (!input || typeof input !== 'string') return null
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength)
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized || null
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Mot de passe requis'] }
  }
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }
  
  if (password.length > 128) {
    errors.push('Le mot de passe ne doit pas dépasser 128 caractères')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }
  
  return { valid: errors.length === 0, errors }
}

// Rate limiting helper (in-memory, for production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}

// Validate prospect input
export function validateProspectInput(formData: FormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const email = formData.get('email') as string
  if (!email) {
    errors.push('Email requis')
  } else if (!isValidEmail(email)) {
    errors.push('Format email invalide')
  }
  
  const phone = formData.get('phone') as string
  if (phone && !isValidPhone(phone)) {
    errors.push('Format téléphone invalide')
  }
  
  const website = formData.get('website') as string
  if (website && !isValidUrl(website)) {
    errors.push('Format URL invalide')
  }
  
  const linkedin = formData.get('linkedin_url') as string
  if (linkedin && !isValidUrl(linkedin)) {
    errors.push('Format URL LinkedIn invalide')
  }
  
  return { valid: errors.length === 0, errors }
}

// Validate campaign input
export function validateCampaignInput(formData: FormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const name = formData.get('name') as string
  if (!name || name.trim().length < 2) {
    errors.push('Nom de campagne requis (min 2 caractères)')
  }
  
  if (name && name.length > 200) {
    errors.push('Nom de campagne trop long (max 200 caractères)')
  }
  
  const type = formData.get('type') as string
  if (type && !['email', 'sms', 'linkedin', 'call'].includes(type)) {
    errors.push('Type de campagne invalide')
  }
  
  return { valid: errors.length === 0, errors }
}

// CSRF token validation helper
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Content Security Policy headers
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// Zod Schemas for centralized validation
export const prospectSchema = z.object({
  email: z.string().email('Email invalide').max(254),
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  job_title: z.string().max(100).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  website: z.string().url('URL invalide').max(500).or(z.literal('')).nullable().optional(),
  linkedin_url: z.string().url('URL LinkedIn invalide').max(500).or(z.literal('')).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  source: z.enum(['manual', 'import', 'website', 'linkedin', 'referral', 'api']).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional()
})

export const campaignSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(200),
  type: z.enum(['email', 'sms', 'linkedin', 'call']),
  subject: z.string().max(500).nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled']).optional()
})

export const emailTemplateSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(200),
  subject: z.string().min(1, 'Sujet requis').max(500),
  content: z.string().min(1, 'Contenu requis'),
  variables: z.array(z.string()).optional(),
  is_public: z.boolean().optional().or(z.literal('true')).or(z.literal('false'))
})

export const pipelineSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  is_default: z.boolean().optional().or(z.literal('true')).or(z.literal('false'))
})

export const stageSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur invalide').optional(),
  probability: z.number().min(0).max(100).optional(),
  position: z.number().optional()
})

export const dealSchema = z.object({
  pipeline_id: z.string().uuid('ID Pipeline invalide'),
  stage_id: z.string().uuid('ID Étape invalide'),
  prospect_id: z.string().uuid('ID Prospect invalide').nullable().optional(),
  name: z.string().min(2, 'Nom trop court').max(200),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  expected_close_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
})
