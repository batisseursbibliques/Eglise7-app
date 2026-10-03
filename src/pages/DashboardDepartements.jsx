import React, { useEffect, useState } from 'react'
import {
  collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

export default function DashboardDepartements({ brancheId }) {
  const [departements, setDepartements] = useState([])
  const [nom, setNom] = useState('')
  const [objectifs, setObjectifs] = useState('')
  const [departementSelectionne, setDepartementSelectionne] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'branches', brancheId, 'departements'), orderBy('nom'))
    return onSnapshot(q, (snap) => setDepartements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [brancheId])

  async function creerDepartement(e) {
    e.preventDefault()
    if (!nom.trim()) return
    await addDoc(collection(db, 'branches', brancheId, 'departements'), {
      nom, objectifs, statut: 'actif', responsableUid: null, responsableNom: '',
    })
    setNom('')
    setObjectifs('')
  }

  const deptAffiche = departements.find((d) => d.id === departementSelectionne)

  return (
    <div>
    <ComptesRendusRecus brancheId={brancheId} departements={departements} />
    <div className="grille-deux">
      <section className="carte">
        <h2 className="titre-carte">Créer un département</h2>
        <form onSubmit={creerDepartement} className="formulaire">
          <input
            type="text" placeholder="Nom (ex. Louange, Jeunesse, Femmes…)" value={nom}
            onChange={(e) => setNom(e.target.value)} className="champ-saisie" required
          />
          <textarea
            placeholder="Objectifs / description (optionnel)" value={objectifs}
            onChange={(e) => setObjectifs(e.target.value)} className="champ-saisie champ-texte" rows={2}
          />
          <button type="submit" className="bouton-principal">Créer</button>
        </form>

        <h2 className="titre-carte" style={{ marginTop: '2rem' }}>Départements ({departements.length})</h2>
        <ul className="liste">
          {departements.map((d) => (
            <li key={d.id} className="ligne-liste" style={{ cursor: 'pointer' }} onClick={() => setDepartementSelectionne(d.id)}>
              <span>{d.nom}</span>
              <span className="etiquette">{d.responsableNom || 'sans responsable'}</span>
            </li>
          ))}
          {departements.length === 0 && <p className="note">Aucun département créé pour l'instant.</p>}
        </ul>
      </section>

      <section className="carte">
        {deptAffiche ? (
          <DetailDepartement brancheId={brancheId} departement={deptAffiche} onFermer={() => setDepartementSelectionne(null)} />
        ) : (
          <p className="note">Sélectionne un département pour voir ou modifier ses informations.</p>
        )}
      </section>
    </div>
    </div>
  )
}

function DetailDepartement({ brancheId, departement, onFermer }) {
  const [responsableNom, setResponsableNom] = useState(departement.responsableNom || '')
  const [objectifs, setObjectifs] = useState(departement.objectifs || '')

  const refDept = doc(db, 'branches', brancheId, 'departements', departement.id)

  async function enregistrer(e) {
    e.preventDefault()
    await updateDoc(refDept, { responsableNom, objectifs })
  }

  return (
    <div>
      <div className="ligne-liste" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        <h2 className="titre-carte" style={{ margin: 0 }}>{departement.nom}</h2>
        <button className="bouton-lien" onClick={onFermer}>Fermer</button>
      </div>

      <form onSubmit={enregistrer} className="formulaire">
        <label className="champ-label">Nom du responsable</label>
        <input
          type="text" value={responsableNom} onChange={(e) => setResponsableNom(e.target.value)}
          className="champ-saisie" placeholder="Nom de la personne en charge"
        />
        <p className="note" style={{ marginTop: '-0.5rem' }}>
          Pour que le responsable ait son propre accès à l'application (compte + comptes-rendus),
          contactez le gestionnaire de comptes pour créer son compte et l'associer à ce département.
        </p>

        <label className="champ-label">Objectifs</label>
        <textarea
          value={objectifs} onChange={(e) => setObjectifs(e.target.value)}
          className="champ-saisie champ-texte" rows={3}
        />

        <button type="submit" className="bouton-principal">Enregistrer</button>
      </form>
    </div>
  )
}


// ── Comptes-rendus envoyés par les responsables de départements ─────────────
function ComptesRendusRecus({ brancheId, departements }) {
  const [parDept, setParDept] = useState({})
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    const ids = departements.map((d) => d.id)
    const fins = ids.map((id) =>
      onSnapshot(
        query(collection(db, 'branches', brancheId, 'departements', id, 'comptesRendus'), orderBy('date', 'desc')),
        (snap) => {
          setErreur(false)
          setParDept((prev) => ({ ...prev, [id]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }))
        },
        () => setErreur(true),
      ),
    )
    return () => fins.forEach((f) => f())
  }, [brancheId, departements.map((d) => d.id).join(',')])

  const liste = departements
    .flatMap((d) => (parDept[d.id] || []).map((c) => ({ ...c, dept: d.nom })))
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
    .slice(0, 30)

  return (
    <section className="carte" style={{ marginBottom: '1.5rem' }}>
      <h2 className="titre-carte">Comptes-rendus reçus</h2>
      {erreur && <p className="alerte">Impossible de charger certains comptes-rendus.</p>}
      <ul className="liste">
        {liste.map((c) => (
          <li key={`${c.dept}-${c.id}`} className="ligne-liste-verticale">
            <strong>{c.dept}</strong>
            <span className="note" style={{ marginLeft: '0.5rem' }}>
              {c.date?.toDate ? c.date.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>
            <p style={{ margin: '0.3rem 0 0', whiteSpace: 'pre-line' }}>{c.contenu}</p>
          </li>
        ))}
        {liste.length === 0 && <p className="note">Aucun compte-rendu reçu pour l'instant.</p>}
      </ul>
    </section>
  )
}
