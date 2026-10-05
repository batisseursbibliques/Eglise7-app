// Préparation du travail hors ligne : à l'ouverture en ligne, on charge dans le cache de l'appareil
// les données utiles au rôle de la personne (Firestore les garde ensuite sur le téléphone).
// Une lecture refusée par les règles de sécurité est simplement ignorée.
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase.js'

const CLE = 'mimc-prechargement'
const BRANCHE = ['membres', 'pv', 'courrier', 'caisse', 'virements', 'rappels', 'cultes', 'annonces', 'evenements', 'projets']
const DEPARTEMENT = ['equipe', 'taches', 'comptesRendus']
const NATIONALES = [
  'pvNationaux', 'courrierNational', 'annoncesNationales', 'absences', 'reunionsBEN', 'convocationsBEN', 'logistiqueBEN',
  'dossiersConseil', 'conflitsMIMC', 'rapportsCommissariat', 'observationsCommissariat', 'projetsNationaux',
  'siteActualites', 'siteEvenements', 'sitePredications', 'siteAssemblees', 'demandesPriere', 'messagesContact',
]
const LOCAL = ['pasteur', 'pasteur_suppleant', 'secretaire', 'secretaire_adjoint', 'tresorier', 'tresorier_adjoint', 'departement']

const signaler = (etat) => { window.__prechargement = etat; window.dispatchEvent(new Event('prechargement')) }
export const dernierPrechargement = () => { try { return JSON.parse(localStorage.getItem(CLE) || 'null') } catch { return null } }

async function lire(ref) {
  try { return (await getDocs(ref)).docs } catch { return [] } // refusé ou indisponible : on passe
}

// Exécute des tâches par petits groupes pour ne pas saturer une connexion lente
async function parGroupes(taches, taille = 6) {
  const resultats = []
  for (let i = 0; i < taches.length; i += taille) {
    resultats.push(...(await Promise.all(taches.slice(i, i + taille).map((t) => t()))))
  }
  return resultats
}

async function chargerEglise(id, profil) {
  const taches = BRANCHE.map((nom) => () => lire(collection(db, 'branches', id, nom)))
  const [membres, projets, departements] = [await lire(collection(db, 'branches', id, 'membres')), await lire(collection(db, 'branches', id, 'projets')), await lire(collection(db, 'branches', id, 'departements'))]
  await parGroupes(taches)
  await parGroupes([
    ...departements.flatMap((d) => DEPARTEMENT.map((nom) => () => lire(collection(db, 'branches', id, 'departements', d.id, nom)))),
    ...projets.map((p) => () => lire(collection(db, 'branches', id, 'projets', p.id, 'contributions'))),
    ...(['pasteur', 'secretaire', 'secretaire_adjoint'].includes(profil.role) ? membres.map((m) => () => lire(collection(db, 'branches', id, 'membres', m.id, 'suivi'))) : []),
  ])
}

export async function preparerHorsLigne(profil, { force = false } = {}) {
  if (!profil || typeof navigator === 'undefined' || navigator.onLine === false) return
  const dernier = dernierPrechargement()
  if (!force && dernier && dernier.uid === profil.uid && Date.now() - dernier.date < 6 * 3600 * 1000) { signaler({ fini: true }); return }
  if (window.__prechargement?.enCours) return
  signaler({ enCours: true })
  try {
    if (profil.brancheId && LOCAL.includes(profil.role)) {
      await lire(collection(db, 'branches'))
      await chargerEglise(profil.brancheId, profil)
      if (profil.role === 'pasteur') await lire(query(collection(db, 'utilisateurs'), where('brancheId', '==', profil.brancheId)))
      await lire(collection(db, 'utilisateurs', profil.uid, 'messages'))
    } else {
      const branches = await lire(collection(db, 'branches'))
      const utilisateurs = await lire(collection(db, 'utilisateurs'))
      await parGroupes(NATIONALES.map((nom) => () => lire(collection(db, nom))))
      for (const b of branches) await chargerEglise(b.id, profil)
      await parGroupes(utilisateurs.filter((u) => ['pasteur', 'national'].includes(u.data().role)).map((u) => () => lire(collection(db, 'utilisateurs', u.id, 'messages'))))
    }
    localStorage.setItem(CLE, JSON.stringify({ uid: profil.uid, date: Date.now() }))
    signaler({ fini: true })
  } catch (e) {
    console.error('Préparation hors ligne interrompue :', e)
    signaler({ erreur: true })
  }
}

// Les Bibles se téléchargent à la demande ; le service worker les garde (voir public/sw.js)
export async function telechargerBibles() {
  for (const code of ['lsg', 'darby', 'martin', 'crampon', 'kjv']) await fetch(`/bibles/${code}.json`).then((r) => r.arrayBuffer()).catch(() => {})
}
