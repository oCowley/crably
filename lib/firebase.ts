import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyB7kKFnClE3A1qwZ0rcZXLtrp5-SaFrk6k" ,
  authDomain: "cowly-b997b.firebaseapp.com",
  projectId: "cowly-b997b",
  storageBucket: "cowly-b997b.firebasestorage.app",
  messagingSenderId: "916420581401",
  appId: "1:916420581401:web:a36df2886ed909f484f288",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
