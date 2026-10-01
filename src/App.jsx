import React, { useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase.js'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { LOGO_MIMC } from './assets/logo-mimc.js'
import Login from './pages/Login.jsx'
import DashboardNational from './pages/DashboardNational.jsx'
import DashboardPasteur from './pages/DashboardPasteur.jsx'
import DashboardDepartement from './pages/DashboardDepartement.jsx'
import DashboardSecretaireBranche from './pages/DashboardSecretaireBranche.jsx'
import DashboardTresorierBranche from './pages/DashboardTresorierBranche.jsx'
import DashboardSecretaireGeneral from './pages/DashboardSecretaireGeneral.jsx'
import DashboardTresorierGeneral from './pages/DashboardTresorierGeneral.jsx'
import DashboardAdmin from './pages/DashboardAdmin.jsx'
import DashboardVicePresident from './pages/DashboardVicePresident.jsx'
import DashboardOrganisateurNational from './pages/DashboardOrganisateurNational.jsx'
import DashboardConseillerNational from './pages/DashboardConseillerNational.jsx'
import DashboardCommissaireComptes from './pages/DashboardCommissaireComptes.jsx'
import { BoutonAbsence } from './pages/GestionAbsence.jsx'
import DashboardPasteurSuppleant from './pages/DashboardPasteurSuppleant.jsx'
import DashboardSecretaireAdjoint from './pages/DashboardSecretaireAdjoint.jsx'
import DashboardTresorierAdjoint from './pages/DashboardTresorierAdjoint.jsx'

// Wrapper du dashboard national avec le bouton d'absence pour le Vice-Président
function DashboardNationalAvecAbsence({ profil }) {
  return (
    <div>
      <BoutonAbsence
        roleId="national"
        nomTitulaire={profil?.nom ?? 'Président'}
        nomAdjoint="le Vice-Président"
      />
      <DashboardNational />
    </div>
  )
}
import NotificationsBell from './pages/NotificationsBell.jsx'

const ROLES_CONNUS = ['national', 'admin', 'vice_president', 'organisateur_national', 'conseiller_national', 'commissaire_comptes', 'pasteur', 'pasteur_suppleant', 'departement', 'secretaire', 'secretaire_adjoint', 'tresorier', 'tresorier_adjoint', 'secretaire_general', 'tresorier_general']

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
    national: 'Présidence — M.I.M.C',
    admin: 'Gestion des comptes',
    vice_president: 'Vice-Présidence — M.I.M.C',
    organisateur_national: 'Organisateur National',
    conseiller_national: 'Conseiller National',
    commissaire_comptes: 'Commissariat aux Comptes',
    secretaire_general: 'Secrétariat Général du BEN',
    tresorier_general: 'Trésorerie Générale du BEN',
    pasteur: 'Pastorale — Pasteur Responsable',
    pasteur_suppleant: 'Pastorale — Pasteur Suppléant',
    secretaire: 'Secrétariat Local',
    secretaire_adjoint: 'Secrétariat Local — Adjoint',
    tresorier: 'Trésorerie Locale',
    tresorier_adjoint: 'Trésorerie Locale — Adjoint',
    departement: 'Responsable de Ministère',
  }[profil.role] ?? 'M.I.M.C — Espace de gestion'

  return (
    <div className="app-shell">
      <header className="entete">
        <div className="entete-logo">
          <img
            src={LOGO_MIMC}
            alt="Logo M.I.M.C"
            style={{ height: '38px', width: '38px', objectFit: 'contain', borderRadius: '50%' }}
          />
          <span>M.I.M.C</span>
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
        {profil.role === 'national' && <DashboardNationalAvecAbsence profil={profil} />}
        {profil.role === 'admin' && <DashboardAdmin profil={profil} />}
        {profil.role === 'vice_president' && <DashboardVicePresident profil={profil} />}
        {profil.role === 'organisateur_national' && <DashboardOrganisateurNational profil={profil} />}
        {profil.role === 'conseiller_national' && <DashboardConseillerNational profil={profil} />}
        {profil.role === 'commissaire_comptes' && <DashboardCommissaireComptes profil={profil} />}
        {profil.role === 'pasteur' && <DashboardPasteur profil={profil} />}
        {profil.role === 'pasteur_suppleant' && <DashboardPasteurSuppleant profil={profil} />}
        {profil.role === 'departement' && <DashboardDepartement profil={profil} />}
        {profil.role === 'secretaire' && <DashboardSecretaireBranche profil={profil} />}
        {profil.role === 'secretaire_adjoint' && <DashboardSecretaireAdjoint profil={profil} />}
        {profil.role === 'tresorier' && <DashboardTresorierBranche profil={profil} />}
        {profil.role === 'tresorier_adjoint' && <DashboardTresorierAdjoint profil={profil} />}
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
