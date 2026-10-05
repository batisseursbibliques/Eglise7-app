import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { preparerHorsLigne, dernierPrechargement, telechargerBibles } from '../lib/horsLigne.js'

const jour = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// État de la préparation hors ligne, dans le menu ☰
export default function StatutHorsLigne() {
  const { profil } = useAuth()
  const [, maj] = useState(0)
  const [bibles, setBibles] = useState('')
  useEffect(() => {
    const f = () => maj((n) => n + 1)
    window.addEventListener('prechargement', f)
    return () => window.removeEventListener('prechargement', f)
  }, [])
  const etat = window.__prechargement || {}
  const dernier = dernierPrechargement()
  const prete = dernier && dernier.uid === profil?.uid

  return (
    <div style={{ padding: '0.5rem 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
      <div>
        {etat.enCours ? '⏳ Préparation du mode hors ligne…' : prete ? `✅ Prêt hors ligne · données du ${jour(dernier.date)}` : etat.erreur ? '⚠️ Préparation incomplète' : '📴 Mode hors ligne à préparer'}
      </div>
      <button type="button" className="bouton-lien" style={{ color: '#fff', textDecoration: 'underline', padding: 0, marginTop: '0.3rem' }}
        disabled={etat.enCours} onClick={() => preparerHorsLigne(profil, { force: true })}>
        Actualiser maintenant
      </button>
      <br />
      <button type="button" className="bouton-lien" style={{ color: '#fff', textDecoration: 'underline', padding: 0, marginTop: '0.3rem' }}
        disabled={bibles === 'en cours'} onClick={async () => { setBibles('en cours'); await telechargerBibles(); setBibles('fait') }}>
        {bibles === 'en cours' ? 'Téléchargement des Bibles…' : bibles === 'fait' ? '✅ Bibles disponibles hors ligne' : 'Télécharger les Bibles (≈ 21 Mo)'}
      </button>
    </div>
  )
}
