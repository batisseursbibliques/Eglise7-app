// Bible intégrée : fichiers JSON dans /public/bibles (domaine public), aucun service externe.
export const VERSIONS = [
  { code: 'lsg', label: 'Louis Segond (1910)' },
  { code: 'darby', label: 'Darby' },
  { code: 'martin', label: 'Martin (1744)' },
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s.]/g, '')

// Nom complet + abréviations courantes (sans accents, sans espaces)
const LIVRES = [
  ['Genèse', 'gn', 'gen'], ['Exode', 'ex', 'exo'], ['Lévitique', 'lv', 'lev'], ['Nombres', 'nb', 'nom'],
  ['Deutéronome', 'dt', 'deut'], ['Josué', 'jos'], ['Juges', 'jg', 'jug'], ['Ruth', 'rt'],
  ['1 Samuel', '1s', '1sa', '1sam'], ['2 Samuel', '2s', '2sa', '2sam'], ['1 Rois', '1r', '1ro'], ['2 Rois', '2r', '2ro'],
  ['1 Chroniques', '1ch', '1chr'], ['2 Chroniques', '2ch', '2chr'], ['Esdras', 'esd'], ['Néhémie', 'ne', 'neh'],
  ['Esther', 'est'], ['Job', 'jb'], ['Psaumes', 'ps', 'psaume', 'psa'], ['Proverbes', 'pr', 'pro', 'prov'],
  ['Ecclésiaste', 'ec', 'ecc', 'eccl'], ['Cantique des cantiques', 'ct', 'cant', 'cantique'], ['Ésaïe', 'es', 'esa', 'isaie', 'is'],
  ['Jérémie', 'jr', 'jer'], ['Lamentations', 'lm', 'lam'], ['Ézéchiel', 'ez', 'eze', 'ezec'], ['Daniel', 'dn', 'dan'],
  ['Osée', 'os'], ['Joël', 'jl', 'joe'], ['Amos', 'am'], ['Abdias', 'ab', 'abd'], ['Jonas', 'jon'],
  ['Michée', 'mi', 'mic'], ['Nahum', 'na', 'nah'], ['Habacuc', 'ha', 'hab'], ['Sophonie', 'so', 'sop'],
  ['Aggée', 'ag', 'agg'], ['Zacharie', 'za', 'zac'], ['Malachie', 'ml', 'mal'], ['Matthieu', 'mt', 'mat', 'matt'],
  ['Marc', 'mc', 'mar'], ['Luc', 'lc'], ['Jean', 'jn'], ['Actes', 'ac', 'act'],
  ['Romains', 'rm', 'rom'], ['1 Corinthiens', '1co', '1cor'], ['2 Corinthiens', '2co', '2cor'], ['Galates', 'ga', 'gal'],
  ['Éphésiens', 'ep', 'eph'], ['Philippiens', 'ph', 'php', 'phil'], ['Colossiens', 'col'],
  ['1 Thessaloniciens', '1th', '1thess'], ['2 Thessaloniciens', '2th', '2thess'], ['1 Timothée', '1tm', '1ti', '1tim'],
  ['2 Timothée', '2tm', '2ti', '2tim'], ['Tite', 'tt', 'tit'], ['Philémon', 'phm', 'philem'], ['Hébreux', 'he', 'heb'],
  ['Jacques', 'jc', 'jac'], ['1 Pierre', '1p', '1pi', '1pie'], ['2 Pierre', '2p', '2pi', '2pie'], ['1 Jean', '1jn'],
  ['2 Jean', '2jn'], ['3 Jean', '3jn'], ['Jude', 'jud'], ['Apocalypse', 'ap', 'apo', 'apoc'],
]
const INDEX = {}
LIVRES.forEach(([nom, ...ab], i) => {
  INDEX[norm(nom)] = i
  ab.forEach((a) => { if (!(a in INDEX)) INDEX[a] = i })
})
INDEX['1jn'] = 61; INDEX['2jn'] = 62; INDEX['3jn'] = 63 // « 1 Jn » = 1 Jean

// "Jean 3:16-18" / "Ps 23:1,3" → { livre, chapitre, versets:[...], titre }
export function analyserReference(ref) {
  const m = ref.trim().match(/^([1-3]?\s?[\p{L}]+(?:\s+[\p{L}]+)*)\.?\s*(\d+)\s*[:.]\s*(.+)$/u)
  if (!m) return null
  const livre = INDEX[norm(m[1])]
  if (livre === undefined) return null
  const versets = []
  for (const part of m[3].split(',')) {
    const r = part.trim().match(/^(\d+)\s*(?:[-–]\s*(\d+))?$/)
    if (!r) continue
    const a = +r[1], b = r[2] ? +r[2] : a
    for (let v = a; v <= Math.min(b, a + 60); v++) versets.push(v)
  }
  if (!versets.length) return null
  return { livre, chapitre: +m[2], versets, titre: `${LIVRES[livre][0]} ${m[2]}:${m[3].trim()}` }
}

const cache = {}
export function chargerVersion(code) {
  if (!cache[code]) {
    cache[code] = fetch(`/bibles/${code}.json`).then((r) => {
      if (!r.ok) throw new Error('bible')
      return r.json()
    }).catch((e) => { delete cache[code]; throw e })
  }
  return cache[code]
}

export async function lireVersets(ref, code) {
  const a = analyserReference(ref)
  if (!a) return { erreur: 'reference' }
  const bible = await chargerVersion(code)
  const chap = bible[a.livre]?.[a.chapitre - 1]
  if (!chap) return { erreur: 'introuvable' }
  const lignes = a.versets.map((v) => ({ n: v, t: chap[v - 1] })).filter((x) => x.t)
  if (!lignes.length) return { erreur: 'introuvable' }
  return { titre: a.titre, lignes }
}
