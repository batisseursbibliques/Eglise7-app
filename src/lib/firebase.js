import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDKm7BpcTPPsou7pV2mRZ8bnm9lMKtFzo4",
  authDomain: "eglise7-app.firebaseapp.com",
  projectId: "eglise7-app",
  storageBucket: "eglise7-app.firebasestorage.app",
  messagingSenderId: "993505071581",
  appId: "1:993505071581:web:b3d10a3da19cea78eb2634"
}

// App principale (utilisateur connecté)
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// App secondaire pour créer des comptes sans déconnecter l'admin
let secondaryApp = null
export function getSecondaryApp() {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'secondary')
  }
  return secondaryApp
}
