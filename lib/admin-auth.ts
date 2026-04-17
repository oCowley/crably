/**
 * Admin-only user creation utilities.
 *
 * Problem: Firebase's createUserWithEmailAndPassword() on the client SDK
 * immediately signs in the newly created user, logging out the current admin.
 *
 * Solution: spin up a secondary Firebase App instance with the same config,
 * create the user there, sign out from it right away, and discard it.
 * The primary auth instance (admin session) is never touched.
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const SECONDARY = 'cowly-secondary'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? 'AIzaSyB7kKFnClE3A1qwZ0rcZXLtrp5-SaFrk6k',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'cowly-b997b.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? 'cowly-b997b',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'cowly-b997b.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '916420581401',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '1:916420581401:web:a36df2886ed909f484f288',
}

function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === SECONDARY)
  const app = existing ?? initializeApp(firebaseConfig, SECONDARY)
  return getAuth(app)
}

export type CreateDevPayload = {
  email: string
  password: string
  name: string
  specialty: string[]
}

export type CreateDevResult =
  | { success: true;  uid: string }
  | { success: false; error: string }

export async function createDevUser(payload: CreateDevPayload): Promise<CreateDevResult> {
  const secondaryAuth = getSecondaryAuth()

  try {
    // 1. Create the Firebase Auth account on the secondary instance
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      payload.email,
      payload.password,
    )
    const uid = cred.user.uid

    // 2. Sign out of secondary immediately — admin session stays intact
    await signOut(secondaryAuth)

    // 3. Write the Firestore user profile with role = developer
    await setDoc(doc(db, 'users', uid), {
      email:     payload.email,
      name:      payload.name,
      role:      'developer',
      specialty: payload.specialty,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { success: true, uid }
  } catch (err: unknown) {
    // Sign out secondary even on error so we don't leave a dangling session
    await signOut(secondaryAuth).catch(() => {})

    const code = (err as { code?: string }).code ?? ''

    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email já está cadastrado.',
      'auth/invalid-email':        'Email inválido.',
      'auth/weak-password':        'Senha muito fraca. Use no mínimo 6 caracteres.',
    }

    return {
      success: false,
      error: messages[code] ?? 'Erro ao criar o usuário. Tente novamente.',
    }
  }
}
