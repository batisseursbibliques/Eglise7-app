import React, { useEffect, useState } from 'react'
import {
  collection, collectionGroup, onSnapshot, query, where, orderBy, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import DashboardCommunication from './DashboardCommunication.jsx'
import DashboardBranches from './DashboardBranches.jsx'
import DashboardRapports from './DashboardRapports.jsx'
import DashboardUtilisateurs from './DashboardUtilisateurs.jsx'

export default function DashboardNational() {
  const { user } = useAuth()
  const [onglet, setOnglet] = useState('vue')
  const [branches, setBranches] = useState([])
  const [virements, setVirements] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'branches'), orderBy('nom'))
    return onSnapshot(q, (snap) => setBranches(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => {
    // Nécessite un index composite (Firestore proposera un lien de création au premier lancement)
    const q = query(collectionGroup(db, 'virements'), where('statut', '==', 'declare'))
    return onSnapshot(q, (snap) => setVirements(snap.docs.map((d) => ({
      id: d.id,
      brancheId: d.ref.parent.parent.id,
      ...d.data(),
    }))))
  }, [])

  async function validerVirement(v) {
    const ref = doc(db, 'branches', v.brancheId, 'virements', v.id)
    await updateDoc(ref, {
      statut: 'valide',
      valideParUid: user.uid,
      dateValidation: serverTimestamp(),
    })
  }

  return (
    <div>
      <h1 className="titre-page">Vue d'ensemble du mouvement</h1>

      <nav className="onglets">
        <button className={onglet === 'vue' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('vue')}>Virements</button>
        <button className={onglet === 'branches' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('branches')}>Branches</button>
        <button className={onglet === 'rapports' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('rapports')}>Rapports</button>
        <button className={onglet === 'utilisateurs' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('utilisateurs')}>Utilisateurs</button>
        <button className={onglet === 'communication' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('communication')}>Communication</button>
      </nav>

      {onglet === 'vue' && (
        <div className="grille-deux">
          <section className="carte">
            <h2 className="titre-carte">Branches ({branches.length})</h2>
            <ul className="liste">
              {branches.map((b) => (
                <li key={b.id} className="ligne-liste">
                  <span>{b.nom}</span>
                  <span className="etiquette">{b.ville}</span>
                </li>
              ))}
              {branches.length === 0 && <p className="note">Aucune branche enregistrée pour l'instant.</p>}
            </ul>
          </section>

          <section className="carte">
            <h2 className="titre-carte">Virements en attente de validation</h2>
            <ul className="liste">
              {virements.map((v) => {
                const branche = branches.find((b) => b.id === v.brancheId)
                return (
                  <li key={v.id} className="ligne-liste">
                    <span>{branche?.nom ?? v.brancheId}</span>
                    <span>{v.montant.toLocaleString('fr-FR')} FCFA — réf. {v.reference || '—'}</span>
                    <button className="bouton-secondaire" onClick={() => validerVirement(v)}>Valider</button>
                  </li>
                )
              })}
              {virements.length === 0 && <p className="note">Aucun virement en attente.</p>}
            </ul>
          </section>
        </div>
      )}

      {onglet === 'branches' && (
        <DashboardBranches branches={branches} />
      )}

      {onglet === 'rapports' && (
        <DashboardRapports />
      )}

      {onglet === 'utilisateurs' && (
        <DashboardUtilisateurs role="national" />
      )}

      {onglet === 'communication' && (
        <DashboardCommunication uid={user.uid} peutPublierNational={true} />
      )}
    </div>
  )
}
