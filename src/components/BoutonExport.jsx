import React, { useState } from 'react'

// Bouton « Exporter en PDF » : onExport doit appeler exporterTableauPdf / exporterDocumentPdf
export default function BoutonExport({ onExport, label = 'Exporter en PDF', petit = false }) {
  const [etat, setEtat] = useState('')
  async function lancer() {
    setEtat('en cours')
    try { await onExport(); setEtat('') } catch (e) { console.error(e); setEtat('erreur') }
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button type="button" className={petit ? 'bouton-lien' : 'bouton-secondaire'} onClick={lancer} disabled={etat === 'en cours'}>
        {etat === 'en cours' ? 'Préparation du PDF…' : `📄 ${label}`}
      </button>
      {etat === 'erreur' && <small style={{ color: '#A6402D' }}>Export impossible, réessayez.</small>}
    </span>
  )
}
