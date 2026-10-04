import { initializeApp } from 'firebase/app'
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
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
// Cache persistant sur l'appareil : les données déjà consultées restent lisibles sans connexion,
// et les ajouts faits hors ligne sont envoyés automatiquement au retour du réseau.
function creerBase() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  } catch {
    return getFirestore(app) // navigateur sans stockage local : fonctionnement normal en ligne
  }
}
export const db = creerBase()
export const auth = getAuth(app)

// App secondaire pour créer des comptes sans déconnecter l'admin
let secondaryApp = null
export function getSecondaryApp() {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'secondary')
  }
  return secondaryApp
}
