'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isValidEmail, validatePassword, sanitizeForDb, checkRateLimit } from '@/lib/security/validation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const firstName = sanitizeForDb(formData.get('firstName') as string, 100)
  const lastName = sanitizeForDb(formData.get('lastName') as string, 100)
  const companyName = sanitizeForDb(formData.get('companyName') as string, 200)

  // Rate limiting
  const rateCheck = checkRateLimit(`signup:${email}`, 5, 3600000) // 5 attempts per hour
  if (!rateCheck.allowed) {
    return { error: 'Trop de tentatives. Réessayez plus tard.' }
  }

  // Validate email
  if (!email || !isValidEmail(email)) {
    return { error: 'Adresse email invalide' }
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.errors.join('. ') }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/auth/sign-up-success')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  // Rate limiting - 10 attempts per 15 minutes
  const rateCheck = checkRateLimit(`signin:${email}`, 10, 900000)
  if (!rateCheck.allowed) {
    return { error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' }
  }

  // Validate email format
  if (!email || !isValidEmail(email)) {
    return { error: 'Adresse email invalide' }
  }

  if (!password) {
    return { error: 'Mot de passe requis' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Generic error message to prevent user enumeration
    return { error: 'Email ou mot de passe incorrect' }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
