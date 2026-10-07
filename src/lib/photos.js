// Photos des membres : réduites sur le téléphone puis envoyées vers Cloudinary (hébergeur d'images gratuit,
// même compte que l'application ABBA) ; seule l'adresse de l'image est enregistrée dans Firestore.
const CLOUD = 'ucn1jt4z'
const PRESET = 'ml_default'

// Réduit la photo (≈ 600 px, JPEG) : envoi rapide avec peu de données mobiles, et PDF léger
export async function reduireImage(fichier, max = 600, qualite = 0.82) {
  const url = URL.createObjectURL(fichier)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('image'))
      i.src = url
    })
    const r = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return await new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/jpeg', qualite))
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function televerser(blob, dossier) {
  const f = new FormData()
  f.append('file', blob)
  f.append('upload_preset', PRESET)
  if (dossier) f.append('folder', dossier)
  const rep = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: f })
  if (!rep.ok) throw new Error('envoi')
  return (await rep.json()).secure_url
}

export async function envoyerPhoto(fichier, dossier = 'mimc/membres') {
  const blob = await reduireImage(fichier)
  try { return await televerser(blob, dossier) } catch { return await televerser(blob, null) }
}

export const MESSAGE_PHOTO = "La photo n'a pas pu être envoyée (connexion ou image invalide). Réessayez avec le bouton 📷."
