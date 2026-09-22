import React, { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

const TYPES_MOUVEMENT = [
  { valeur: 'dime', label: 'Dîme' },
  { valeur: 'collecte', label: 'Collecte' },
  { valeur: 'don', label: 'Don' },
  { valeur: 'depense', label: 'Dépense' },
]

import GestionProjets from './GestionProjets.jsx'

export default function DashboardTresorierBranche({ profil }) {
  const { brancheId, uid } = profil
  const [onglet, setOnglet] = useState('caisse')
  const [branche, setBranche] = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [type, setType] = useState('dime')
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'branches', brancheId)).then((s) => s.exists() && setBranche(s.data()))
  }, [brancheId])

  useEffect(() => {
    const q = query(collection(db, 'branches', brancheId, 'caisse'), orderBy('date', 'desc'))
    return onSnapshot(q, (snap) => setMouvements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [brancheId])

  const solde = mouvements.reduce((acc, m) => m.type === 'depense' ? acc - m.montant : acc + m.montant, 0)
  const seuil = branche?.seuilSolde ?? null
  const depasseSeuil = seuil != null && solde > seuil

  async function ajouterMouvement(e) {
    e.preventDefault()
    if (!montant) return
    await addDoc(collection(db, 'branches', brancheId, 'caisse'), {
      type, montant: Number(montant), description,
      date: serverTimestamp(), auteurUid: uid,
    })
    setMontant(''); setDescription('')
  }

  return (
    <div>
      <h1 className="titre-page">{branche?.nom ?? 'Ma branche'} — Trésorerie</h1>
      <nav className="onglets">
        <button className={onglet === 'caisse' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('caisse')}>Caisse</button>
        <button className={onglet === 'rapport' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('rapport')}>Rapport financier</button>
        <button className={onglet === 'projets' ? 'onglet actif' : 'onglet'} onClick={() => setOnglet('projets')}>Projets</button>
      </nav>

      {onglet === 'caisse' && (
        <div className="grille-deux">
          <section className="carte">
            <h2 className="titre-carte">Solde actuel</h2>
            <p className="grand-nombre">{solde.toLocaleString('fr-FR')} FCFA</p>
            {seuil != null && (
              <p className={depasseSeuil ? 'alerte' : 'note'}>
                Seuil autorisé : {seuil.toLocaleString('fr-FR')} FCFA
                {depasseSeuil && ' — seuil dépassé, informez le pasteur.'}
              </p>
            )}
            <h3 className="titre-section">Enregistrer un mouvement</h3>
            <form onSubmit={ajouterMouvement} className="formulaire">
              <select value={type} onChange={(e) => setType(e.target.value)} className="champ-saisie">
                {TYPES_MOUVEMENT.map((t) => <option key={t.valeur} value={t.valeur}>{t.label}</option>)}
              </select>
              <input type="number" placeholder="Montant (FCFA)" value={montant} onChange={(e) => setMontant(e.target.value)} className="champ-saisie" required />
              <input type="text" placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} className="champ-saisie" />
              <button type="submit" className="bouton-principal">Enregistrer</button>
            </form>
          </section>

          <section className="carte">
            <h2 className="titre-carte">Historique des mouvements</h2>
            <ul className="liste">
              {mouvements.map((m) => (
                <li key={m.id} className="ligne-liste">
                  <span>{TYPES_MOUVEMENT.find((t) => t.valeur === m.type)?.label ?? m.type}</span>
                  <span>{m.description}</span>
                  <span className={m.type === 'depense' ? 'montant-negatif' : 'montant-positif'}>
                    {m.type === 'depense' ? '-' : '+'}{m.montant.toLocaleString('fr-FR')} FCFA
                  </span>
                </li>
              ))}
              {mouvements.length === 0 && <p className="note">Aucun mouvement enregistré.</p>}
            </ul>
          </section>
        </div>
      )}

      {onglet === 'rapport' && (
        <div className="grille-deux">
          <section className="carte">
            <h2 className="titre-carte">Résumé financier</h2>
            <ul className="liste">
              {TYPES_MOUVEMENT.map(({ valeur, label }) => {
                const total = mouvements.filter((m) => m.type === valeur).reduce((s, m) => s + m.montant, 0)
                return (
                  <li key={valeur} className="ligne-liste">
                    <span>{label}</span>
                    <span className={valeur === 'depense' ? 'montant-negatif' : 'montant-positif'}>
                      {total.toLocaleString('fr-FR')} FCFA
                    </span>
                  </li>
                )
              })}
            </ul>
            <div style={{ borderTop: '2px solid var(--encre)', marginTop: '1rem', paddingTop: '0.75rem' }}>
              <div className="ligne-liste">
                <strong>Solde net</strong>
                <strong className={solde >= 0 ? 'montant-positif' : 'montant-negatif'}>
                  {solde.toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
            </div>
          </section>
          <section className="carte">
            <h2 className="titre-carte">Informations</h2>
            <p className="note">{mouvements.length} mouvement(s) enregistré(s) au total.</p>
            {seuil != null && (
              <p className={depasseSeuil ? 'alerte' : 'note'} style={{ marginTop: '0.5rem' }}>
                Seuil autorisé par le national : {seuil.toLocaleString('fr-FR')} FCFA.
                {depasseSeuil ? ' Le solde dépasse ce seuil — signalez-le au pasteur.' : ' Le solde est dans les limites autorisées.'}
              </p>
            )}
          </section>
        </div>
      )}
      {onglet === 'projets' && (
        <GestionProjets brancheId={brancheId} uid={uid} />
      )}
    </div>
  )
}
