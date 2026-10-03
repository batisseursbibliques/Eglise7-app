import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// Nom de l'église locale (pour l'en-tête des PDF)
export default function useNomEglise(brancheId) {
  const [nom, setNom] = useState('')
  useEffect(() => {
    if (!brancheId) return
    getDoc(doc(db, 'branches', brancheId)).then((s) => setNom(s.data()?.nom || '')).catch(() => {})
  }, [brancheId])
  return nom || 'Église locale'
}
