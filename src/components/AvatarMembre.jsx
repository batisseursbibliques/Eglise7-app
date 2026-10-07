import React, { useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { envoyerPhoto, MESSAGE_PHOTO } from '../lib/photos.js'

const initiales = (m) => `${(m.prenom || '')[0] || ''}${(m.nom || '')[0] || ''}`.toUpperCase() || '?'

// Pastille ronde du membre : sa photo, ou ses initiales. Avec chemin, un bouton 📷 permet d'ajouter ou de changer la photo.
export default function AvatarMembre({ membre, chemin = null, taille = 40 }) {
  const champ = useRef(null)
  const [envoi, setEnvoi] = useState(false)

  async function choisir(e) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier || !chemin) return
    setEnvoi(true)
    try {
      const photoUrl = await envoyerPhoto(fichier)
      await updateDoc(doc(db, ...chemin), { photoUrl })
    } catch {
      window.alert(MESSAGE_PHOTO)
    }
    setEnvoi(false)
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
      {membre.photoUrl ? (
        <img src={membre.photoUrl} alt="" crossOrigin="anonymous" loading="lazy" style={{ width: taille, height: taille, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--ligne, #E8D8D0)' }} />
      ) : (
        <span aria-hidden="true" style={{ width: taille, height: taille, borderRadius: '50%', background: '#8B1A2B', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: taille * 0.38, fontWeight: 600 }}>{initiales(membre)}</span>
      )}
      {chemin && (
        <>
          <button type="button" className="bouton-lien" disabled={envoi} onClick={() => champ.current?.click()} aria-label="Ajouter ou changer la photo">
            {envoi ? '…' : '📷'}
          </button>
          <input ref={champ} type="file" accept="image/*" onChange={choisir} style={{ display: 'none' }} />
        </>
      )}
    </span>
  )
}
