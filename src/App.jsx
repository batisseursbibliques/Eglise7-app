import React, { useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase.js'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import DashboardNational from './pages/DashboardNational.jsx'
import DashboardPasteur from './pages/DashboardPasteur.jsx'
import DashboardDepartement from './pages/DashboardDepartement.jsx'
import DashboardSecretaireBranche from './pages/DashboardSecretaireBranche.jsx'
import DashboardTresorierBranche from './pages/DashboardTresorierBranche.jsx'
import DashboardSecretaireGeneral from './pages/DashboardSecretaireGeneral.jsx'
import DashboardTresorierGeneral from './pages/DashboardTresorierGeneral.jsx'
import NotificationsBell from './pages/NotificationsBell.jsx'

const ROLES_CONNUS = ['national', 'pasteur', 'departement', 'secretaire', 'tresorier', 'secretaire_general', 'tresorier_general']

function Contenu() {
  const { user, profil, chargement, deconnexion } = useAuth()

  // Personnalisation visuelle selon la branche (pasteur, secrétaire, trésorier de branche)
  useEffect(() => {
    if (!profil?.brancheId) return
    getDoc(doc(db, 'branches', profil.brancheId)).then((snap) => {
      if (!snap.exists()) return
      const b = snap.data()
      if (b.couleurPrimaire) document.documentElement.style.setProperty('--encre', b.couleurPrimaire)
      if (b.couleurAccent) document.documentElement.style.setProperty('--ocre', b.couleurAccent)
    })
  }, [profil?.brancheId])

  if (chargement) return <div className="ecran-centre">Chargement…</div>
  if (!user) return <Login />

  if (!profil) {
    return (
      <div className="ecran-centre">
        <p>Ce compte n'a pas encore de profil configuré. Contactez le responsable de l'application.</p>
        <button className="bouton-lien" onClick={deconnexion}>Se déconnecter</button>
      </div>
    )
  }

  const roleConnu = ROLES_CONNUS.includes(profil.role)

  // Libellé du titre selon le rôle
  const titrePage = {
    national: 'Présidence',
    secretaire_general: 'Secrétariat Général',
    tresorier_general: 'Trésorerie Générale',
    pasteur: 'Pastorale',
    secretaire: 'Secrétariat',
    tresorier: 'Trésorerie',
    departement: 'Département',
  }[profil.role] ?? 'Espace de gestion'

  return (
    <div className="app-shell">
      <header className="entete">
        <div className="entete-logo">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="13" y="1" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <polygon points="4,14 16,4 28,14" fill="white" opacity="0.95"/>
            <rect x="5" y="13" width="22" height="16" rx="1" fill="white" opacity="0.85"/>
            <rect x="13" y="19" width="6" height="10" fill="#1A6BAF"/>
          </svg>
          Église 7
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationsBell role={profil.role} brancheId={profil.brancheId} />
          <button className="bouton-lien" onClick={deconnexion}>Déconnexion</button>
        </div>
      </header>
      <main className="contenu">
        {!roleConnu && (
          <div className="ecran-centre">
            <p>Rôle non reconnu ({profil.role}). Contactez le responsable de l'application.</p>
            <button className="bouton-lien" onClick={deconnexion}>Se déconnecter</button>
          </div>
        )}
        {profil.role === 'national' && <DashboardNational />}
        {profil.role === 'pasteur' && <DashboardPasteur profil={profil} />}
        {profil.role === 'departement' && <DashboardDepartement profil={profil} />}
        {profil.role === 'secretaire' && <DashboardSecretaireBranche profil={profil} />}
        {profil.role === 'tresorier' && <DashboardTresorierBranche profil={profil} />}
        {profil.role === 'secretaire_general' && <DashboardSecretaireGeneral profil={profil} />}
        {profil.role === 'tresorier_general' && <DashboardTresorierGeneral profil={profil} />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Contenu />
    </AuthProvider>
  )
}
