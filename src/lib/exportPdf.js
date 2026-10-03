// Export PDF commun : en-tête (logo, organisation, église, titre), pied de page (date de génération, numérotation).
// jsPDF est chargé à la demande pour ne pas alourdir l'application.
import { LOGO_MIMC } from '../assets/logo-mimc.js'

const ORGANISATION = "M.I.M.C — Ministère d'Impact La Montagne de Consolation en Christ"
const BORDEAUX = [139, 26, 43]
const MARGE = 14

// Helvetica ne sait pas dessiner les émojis ni certains symboles : on les retire
export const net = (v) =>
  String(v ?? '').replace(/[\u202f\u00a0]/g, ' ').replace(/[\u2190-\u2BFF\u{1F000}-\u{1FFFF}\uFE0F\u200D]/gu, '').replace(/[ \t]+\n/g, '\n').trim()

export const dateFr = (d) => {
  if (!d) return ''
  const dt = d.toDate ? d.toDate() : /^\d{4}-\d{2}-\d{2}/.test(String(d)) ? new Date(`${String(d).slice(0, 10)}T00:00:00`) : new Date(d)
  return isNaN(dt) ? net(d) : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
export const fcfa = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`
export const horodatage = (d) => (d?.toDate ? d.toDate().getTime() : d ? new Date(d).getTime() : 0) || 0

async function charger() {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  return { jsPDF, autoTable: autoTableMod.default || autoTableMod.autoTable }
}

function entetePied(doc, { titre, sousTitre, eglise }, maintenant) {
  const total = doc.getNumberOfPages()
  const L = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    try { doc.addImage(LOGO_MIMC, 'PNG', MARGE, 8, 16, 15.5) } catch { /* logo facultatif */ }
    doc.setTextColor(...BORDEAUX)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(net(ORGANISATION), MARGE + 20, 13)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60)
    doc.text(net(eglise || 'Siège national'), MARGE + 20, 19)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...BORDEAUX)
    doc.text(net(titre), MARGE, 31)
    if (sousTitre) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90); doc.text(net(sousTitre), MARGE, 36) }
    doc.setDrawColor(...BORDEAUX); doc.setLineWidth(0.5); doc.line(MARGE, 26.5, L - MARGE, 26.5)
    doc.setDrawColor(200); doc.setLineWidth(0.2); doc.line(MARGE, H - 14, L - MARGE, H - 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110)
    doc.text(`Généré le ${maintenant}`, MARGE, H - 9)
    doc.text(`Page ${i} sur ${total}`, L - MARGE, H - 9, { align: 'right' })
  }
}

const maintenantFr = () =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
  ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const nomFichierSur = (s) =>
  net(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'export'

// Tableau (registres, journaux, listes). lignes : tableau de tableaux ; numeroter ajoute une colonne N°.
export async function exporterTableauPdf({ titre, sousTitre, eglise, colonnes, lignes, numeroter = true, orientation = 'portrait', pied = null, alignDroite = [] }) {
  const { jsPDF, autoTable } = await charger()
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const tete = numeroter ? ['N°', ...colonnes] : colonnes
  const corps = lignes.map((l, i) => (numeroter ? [String(i + 1), ...l] : l).map(net))
  const droite = Object.fromEntries(alignDroite.map((i) => [i + (numeroter ? 1 : 0), { halign: 'right' }]))
  autoTable(doc, {
    head: [tete.map(net)],
    body: corps.length ? corps : [[{ content: 'Aucune donnée à exporter.', colSpan: tete.length, styles: { halign: 'center', textColor: 120 } }]],
    foot: pied ? [(numeroter ? ['', ...pied] : pied).map(net)] : undefined,
    startY: 41,
    margin: { top: 41, left: MARGE, right: MARGE, bottom: 18 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: BORDEAUX, textColor: 255 },
    footStyles: { fillColor: [240, 230, 226], textColor: 40, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 247, 245] },
    columnStyles: { ...(numeroter ? { 0: { cellWidth: 12, halign: 'center' } } : {}), ...droite },
    showHead: 'everyPage',
    didParseCell: (d) => {
      if (d.section !== 'body' && droite[d.column.index]) d.cell.styles.halign = 'right'
    },
  })
  entetePied(doc, { titre, sousTitre, eglise }, maintenantFr())
  doc.save(`${nomFichierSur(titre)}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// Document texte (messages, procès-verbaux, rapports). blocs : [{ label, texte }] ; un bloc sans texte devient un titre de section.
export async function exporterDocumentPdf({ titre, sousTitre, eglise, blocs }) {
  const { jsPDF } = await charger()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const L = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const largeur = L - 2 * MARGE
  let y = 44
  const place = (hauteur) => { if (y + hauteur > H - 20) { doc.addPage(); y = 44 } }
  for (const b of blocs) {
    if (!net(b.texte) && !b.titreSeul) { if (!b.label) continue }
    if (b.label) {
      place(14)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(b.titreSeul ? 12 : 10); doc.setTextColor(...BORDEAUX)
      doc.text(net(b.label), MARGE, y); y += 5.5
    }
    const t = net(b.texte)
    if (t) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30)
      for (const ligne of doc.splitTextToSize(t, largeur)) {
        place(6); doc.text(ligne, MARGE, y); y += 5
      }
      y += 3
    }
  }
  entetePied(doc, { titre, sousTitre, eglise }, maintenantFr())
  doc.save(`${nomFichierSur(titre)}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
