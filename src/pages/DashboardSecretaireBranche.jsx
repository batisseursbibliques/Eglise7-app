import React, { useEffect, useState } from 'react'
import BoutonExport from '../components/BoutonExport.jsx'
import useNomEglise from '../lib/useNomEglise.js'
import { exporterTableauPdf, exporterCartesMembresPdf, dateFr, horodatage } from '../lib/exportPdf.js'
import AvatarMembre from '../components/AvatarMembre.jsx'
import { envoyerPhoto, MESSAGE_PHOTO } from '../lib/photos.js'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

import { BoutonAbsence } from './GestionAbsence.jsx'

export default function DashboardSecretaireBranche({ profil, lectureSeule = false , page = 'membres'}) {
  const { brancheId, uid } = profil
  const onglet = page
  const [branche, setBranche] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'branches', brancheId)).then((s) => s.exists() && setBranche(s.data()))
  }, [brancheId])

  return (
    <div>
      {!lectureSeule && (
        <BoutonAbsence
          roleId={`secretaire_${brancheId}`}
          nomTitulaire={profil.nom}
          nomAdjoint="le Secrétaire Adjoint"
        />
      )}
      <h1 className="titre-page">{branche?.nom ?? 'Mon église locale'} — Secrétariat</h1>
      {onglet === 'membres' && <GestionMembres brancheId={brancheId} uid={uid} />}
      {onglet === 'pv' && <GestionPV brancheId={brancheId} uid={uid} />}
      {onglet === 'courrier' && <GestionCourrier brancheId={brancheId} uid={uid} />}
    </div>
  )
}

function GestionMembres({ brancheId, uid }) {
  const nomEglise = useNomEglise(brancheId)
  const [membres, setMembres] = useState([])
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [statut, setStatut] = useState('nouveau')
  const [telephone, setTelephone] = useState('')
  const [photo, setPhoto] = useState(null)
  const [msgPhoto, setMsgPhoto] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'branches', brancheId, 'membres'), orderBy('nom'))
    return onSnapshot(q, (snap) => setMembres(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [brancheId])

  async function ajouter(e) {
    e.preventDefault()
    if (!nom) return
    setEnvoi(true); setMsgPhoto('')
    let photoUrl = null
    if (photo) {
      try { photoUrl = await envoyerPhoto(photo) } catch { setMsgPhoto(`Membre enregistré. ${MESSAGE_PHOTO}`) }
    }
    await addDoc(collection(db, 'branches', brancheId, 'membres'), {
      nom, prenom, statut, telephone, dateAdhesion: serverTimestamp(), saisieParUid: uid, ...(photoUrl ? { photoUrl } : {}),
    })
    setNom(''); setPrenom(''); setTelephone(''); setStatut('nouveau'); setPhoto(null); setEnvoi(false)
  }

  return (
    <div className="grille-deux">
      <section className="carte">
        <h2 className="titre-carte">Enregistrer un membre</h2>
        <form onSubmit={ajouter} className="formulaire">
          <input type="text" placeholder="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} className="champ-saisie" required />
          <input type="text" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="champ-saisie" />
          <input type="tel" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="champ-saisie" />
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="champ-saisie">
            <option value="nouveau">Nouveau</option>
            <option value="regulier">Régulier</option>
            <option value="membre_officiel">Membre officiel</option>
          </select>
          <label className="note" htmlFor="photo-membre">Photo d'identité (facultatif)</label>
          <input id="photo-membre" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          <button type="submit" className="bouton-principal" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          {msgPhoto && <p className="alerte">{msgPhoto}</p>}
        </form>
      </section>
      <section className="carte">
        <h2 className="titre-carte">Registre ({membres.length} membres)</h2>
        <div style={{ marginBottom: '0.75rem' }}>
          <BoutonExport label="Exporter le registre des membres" onExport={() => exporterTableauPdf({
            titre: 'Registre des membres', sousTitre: `${membres.length} membre(s) · ordre alphabétique`, eglise: nomEglise,
            colonnes: ['Nom et prénom', 'Téléphone', 'Statut'],
            lignes: membres.map((m) => [`${(m.nom || '').toUpperCase()} ${m.prenom || ''}`.trim(), m.telephone || '', (m.statut || '').replace('_', ' ')]),
          })} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <BoutonExport label="Exporter le registre avec photos" onExport={() => exporterCartesMembresPdf({ sousTitre: `${membres.length} membre(s) · ordre alphabétique`, eglise: nomEglise, membres })} />
        </div>
        <ul className="liste">
          {membres.map((m) => (
            <li key={m.id} className="ligne-liste">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><AvatarMembre membre={m} chemin={['branches', brancheId, 'membres', m.id]} /> {m.prenom} {m.nom}</span>
              <span>{m.telephone || '—'}</span>
              <span className="etiquette">{m.statut?.replace('_', ' ')}</span>
            </li>
          ))}
          {membres.length === 0 && <p className="note">Aucun membre enregistré.</p>}
        </ul>
      </section>
    </div>
  )
}

function GestionPV({ brancheId, uid }) {
  const nomEglise = useNomEglise(brancheId)
  const [pvs, setPvs] = useState([])
  const [date, setDate] = useState('')
  const [objet, setObjet] = useState('')
  const [contenu, setContenu] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'branches', brancheId, 'pv'), orderBy('date', 'desc'))
    return onSnapshot(q, (snap) => setPvs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [brancheId])

  async function ajouter(e) {
    e.preventDefault()
    await addDoc(collection(db, 'branches', brancheId, 'pv'), {
      date, objet, contenu, redacteurUid: uid, creeLe: serverTimestamp(),
    })
    setDate(''); setObjet(''); setContenu('')
  }

  return (
    <div className="grille-deux">
      <section className="carte">
        <h2 className="titre-carte">Rédiger un procès-verbal</h2>
        <form onSubmit={ajouter} className="formulaire">
          <label className="champ-label">Date de la réunion</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="champ-saisie" required />
          <input type="text" placeholder="Objet / titre" value={objet} onChange={(e) => setObjet(e.target.value)} className="champ-saisie" required />
          <textarea placeholder="Contenu du procès-verbal…" value={contenu} onChange={(e) => setContenu(e.target.value)} className="champ-saisie champ-texte" rows={6} />
          <button type="submit" className="bouton-principal">Enregistrer</button>
        </form>
      </section>
      <section className="carte">
        <h2 className="titre-carte">Procès-verbaux ({pvs.length})</h2>
        <div style={{ marginBottom: '0.75rem' }}>
          <BoutonExport label="Exporter les procès-verbaux" onExport={() => exporterTableauPdf({
            titre: 'Registre des procès-verbaux', sousTitre: `${pvs.length} procès-verbal(aux) · ordre chronologique`, eglise: nomEglise,
            colonnes: ['Date', 'Objet', 'Contenu'],
            lignes: [...pvs].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((p) => [dateFr(p.date), p.objet || '', p.contenu || '']),
          })} />
        </div>
        <ul className="liste">
          {pvs.map((p) => (
            <li key={p.id} className="ligne-liste-verticale">
              <strong>{p.date ? new Date(p.date + 'T00:00').toLocaleDateString('fr-FR') : '—'}</strong> — {p.objet}
              {p.contenu && <p className="note" style={{ marginTop: '0.25rem' }}>{p.contenu.slice(0, 120)}{p.contenu.length > 120 ? '…' : ''}</p>}
            </li>
          ))}
          {pvs.length === 0 && <p className="note">Aucun procès-verbal enregistré.</p>}
        </ul>
      </section>
    </div>
  )
}

function GestionCourrier({ brancheId, uid }) {
  const nomEglise = useNomEglise(brancheId)
  const [courriers, setCourriers] = useState([])
  const [date, setDate] = useState('')
  const [sens, setSens] = useState('entrant')
  const [expediteur, setExpediteur] = useState('')
  const [objet, setObjet] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'branches', brancheId, 'courrier'), orderBy('date', 'desc'))
    return onSnapshot(q, (snap) => setCourriers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [brancheId])

  async function ajouter(e) {
    e.preventDefault()
    await addDoc(collection(db, 'branches', brancheId, 'courrier'), {
      date, sens, expediteur, objet, enregistreParUid: uid, creeLe: serverTimestamp(),
    })
    setDate(''); setExpediteur(''); setObjet('')
  }

  return (
    <div className="grille-deux">
      <section className="carte">
        <h2 className="titre-carte">Enregistrer un courrier</h2>
        <form onSubmit={ajouter} className="formulaire">
          <label className="champ-label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="champ-saisie" required />
          <select value={sens} onChange={(e) => setSens(e.target.value)} className="champ-saisie">
            <option value="entrant">Courrier entrant</option>
            <option value="sortant">Courrier sortant</option>
          </select>
          <input type="text" placeholder="Expéditeur / Destinataire" value={expediteur} onChange={(e) => setExpediteur(e.target.value)} className="champ-saisie" required />
          <input type="text" placeholder="Objet" value={objet} onChange={(e) => setObjet(e.target.value)} className="champ-saisie" required />
          <button type="submit" className="bouton-principal">Enregistrer</button>
        </form>
      </section>
      <section className="carte">
        <h2 className="titre-carte">Registre des courriers ({courriers.length})</h2>
        <div style={{ marginBottom: '0.75rem' }}>
          <BoutonExport label="Exporter le registre des courriers" onExport={() => exporterTableauPdf({
            titre: 'Registre des courriers', sousTitre: `${courriers.length} courrier(s) · ordre chronologique`, eglise: nomEglise,
            colonnes: ['Date', 'Sens', 'Expéditeur / destinataire', 'Objet'],
            lignes: [...courriers].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((c) => [dateFr(c.date), c.sens === 'entrant' ? 'Entrant' : 'Sortant', c.expediteur || '', c.objet || '']),
          })} />
        </div>
        <ul className="liste">
          {courriers.map((c) => (
            <li key={c.id} className="ligne-liste">
              <span className="etiquette">{c.sens === 'entrant' ? '↓ Entrant' : '↑ Sortant'}</span>
              <span>{c.date ? new Date(c.date + 'T00:00').toLocaleDateString('fr-FR') : '—'}</span>
              <span>{c.expediteur}</span>
              <span>{c.objet}</span>
            </li>
          ))}
          {courriers.length === 0 && <p className="note">Aucun courrier enregistré.</p>}
        </ul>
      </section>
    </div>
  )
}
