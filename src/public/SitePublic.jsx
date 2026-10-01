import React, { useEffect, useState } from 'react'
import { Link, NavLink, Routes, Route, useLocation } from 'react-router-dom'
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { LOGO_MIMC } from '../assets/logo-mimc.js'
import './site.css'

// À renseigner par Paul : coordonnées publiques et moyens de don
const CONFIG = {
  email: '',
  telephone: '',
  whatsapp: '',
  adresse: 'Akpakpa, Cotonou, Bénin',
  dons: [], // ex. { moyen: 'MTN MoMo', numero: '...', nom: '...' }
}

function useListe(nom, max = 20) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    const q = query(collection(db, nom), orderBy('date', 'desc'), limit(max))
    return onSnapshot(q, (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setItems([]))
  }, [nom, max])
  return items
}

const fmt = (d) => {
  if (!d) return ''
  const dt = d.toDate ? d.toDate() : new Date(d)
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Section({ titre, children }) {
  return (
    <section className="s-section">
      <h2>{titre}</h2>
      {children}
    </section>
  )
}

function ytId(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/))([\w-]{11})/)
  return m ? m[1] : null
}

function Vide({ items, texte }) {
  if (items === null) return <p className="s-note">Chargement…</p>
  if (items.length === 0) return <p className="s-note">{texte}</p>
  return null
}

function Formulaire({ collectionNom, champs, bouton, merci }) {
  const vide = Object.fromEntries(champs.map((c) => [c.nom, '']))
  const [v, setV] = useState(vide)
  const [etat, setEtat] = useState('')
  async function envoyer(e) {
    e.preventDefault()
    setEtat('envoi')
    try {
      await addDoc(collection(db, collectionNom), { ...v, date: serverTimestamp(), traite: false })
      setV(vide)
      setEtat('ok')
    } catch {
      setEtat('erreur')
    }
  }
  return (
    <form onSubmit={envoyer} className="s-form">
      {champs.map((c) =>
        c.type === 'textarea' ? (
          <textarea key={c.nom} placeholder={c.label} required={c.requis} maxLength={2000} rows={5}
            value={v[c.nom]} onChange={(e) => setV({ ...v, [c.nom]: e.target.value })} />
        ) : (
          <input key={c.nom} type={c.type || 'text'} placeholder={c.label} required={c.requis} maxLength={200}
            value={v[c.nom]} onChange={(e) => setV({ ...v, [c.nom]: e.target.value })} />
        ),
      )}
      <button disabled={etat === 'envoi'}>{etat === 'envoi' ? 'Envoi…' : bouton}</button>
      {etat === 'ok' && <p className="s-ok">{merci}</p>}
      {etat === 'erreur' && <p className="s-err">L'envoi a échoué. Réessayez dans un instant.</p>}
    </form>
  )
}

const PAGES = [
  ['/presentation', 'Présentation', 'Découvrir le ministère'],
  ['/assemblees', 'Assemblées', 'Où nous retrouver'],
  ['/evenements', 'Événements', 'Les rendez-vous à venir'],
  ['/predications', 'Prédications', 'Écouter la Parole'],
  ['/actualites', 'Actualités', 'Les nouvelles du ministère'],
  ['/priere', 'Prière', 'Confier un sujet de prière'],
  ['/contact', 'Contact', 'Nous écrire'],
  ['/dons', 'Dons', 'Soutenir le ministère'],
]

function Accueil() {
  return (
    <>
      <div className="s-hero">
        <img src={LOGO_MIMC} alt="Logo M.I.M.C" />
        <h1>Ministère d'Impact La Montagne de Consolation en Christ</h1>
        <p>Une famille de foi à Cotonou, au service de Dieu et de son prochain.</p>
        <div className="s-actions">
          <Link to="/priere" className="s-btn">Demander une prière</Link>
          <Link to="/assemblees" className="s-btn s-btn-clair">Nous trouver</Link>
        </div>
      </div>
      <div className="s-section s-grille">
        {PAGES.map(([to, t, d]) => (
          <Link key={to} to={to} className="s-carte s-tuile"><h3>{t}</h3><p>{d}</p></Link>
        ))}
      </div>
    </>
  )
}

function Presentation() {
  return (
    <Section titre="Qui sommes-nous">
      <p>
        Le M.I.M.C est un ministère chrétien dont le siège est à Akpakpa, Cotonou. Il rassemble des
        assemblées locales autour de la Parole de Dieu, de la prière, de l'entraide et de projets
        concrets au service des communautés.
      </p>
    </Section>
  )
}

function Assemblees() {
  const items = useListe('siteAssemblees', 50)
  return (
    <Section titre="Nos assemblées">
      <Vide items={items} texte="La liste de nos assemblées sera bientôt publiée." />
      <div className="s-grille">
        {items?.map((a) => (
          <article key={a.id} className="s-carte">
            <h3>{a.nom}</h3>
            {a.ville && <p>📍 {a.ville}{a.adresse ? ` — ${a.adresse}` : ''}</p>}
            {a.horaires && <p>🕘 {a.horaires}</p>}
            {a.contact && <p>📞 {a.contact}</p>}
          </article>
        ))}
      </div>
    </Section>
  )
}

function Evenements() {
  const items = useListe('siteEvenements')
  return (
    <Section titre="Événements">
      <Vide items={items} texte="Aucun événement annoncé pour le moment." />
      <div className="s-grille">
        {items?.map((e) => (
          <article key={e.id} className="s-carte">
            <small>{fmt(e.date)}</small>
            <h3>{e.titre}</h3>
            {e.lieu && <p>📍 {e.lieu}</p>}
            {e.description && <p>{e.description}</p>}
          </article>
        ))}
      </div>
    </Section>
  )
}

function Predications() {
  const items = useListe('sitePredications')
  return (
    <Section titre="Prédications">
      <Vide items={items} texte="Les prédications seront bientôt disponibles." />
      <div className="s-grille">
        {items?.map((p) => {
          const id = ytId(p.lien)
          return (
            <article key={p.id} className="s-carte">
              <small>{fmt(p.date)}{p.orateur ? ` · ${p.orateur}` : ''}</small>
              <h3>{p.titre}</h3>
              {id && (
                <div className="s-video">
                  <iframe src={`https://www.youtube.com/embed/${id}`} title={p.titre} loading="lazy"
                    allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              )}
              {p.resume && <p>{p.resume}</p>}
              {p.lien && !id && <a className="s-lien" href={p.lien} target="_blank" rel="noopener noreferrer">Écouter / regarder →</a>}
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function Actualites() {
  const items = useListe('siteActualites')
  return (
    <Section titre="Actualités">
      <Vide items={items} texte="Pas encore d'actualité publiée." />
      {items?.map((a) => (
        <article key={a.id} className="s-carte s-large">
          <small>{fmt(a.date)}</small>
          <h3>{a.titre}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{a.contenu}</p>
        </article>
      ))}
    </Section>
  )
}

function Priere() {
  return (
    <Section titre="Demande de prière">
      <p>Confiez-nous votre sujet de prière. Il sera transmis à l'équipe pastorale.</p>
      <Formulaire
        collectionNom="demandesPriere"
        bouton="Envoyer ma demande"
        merci="Votre demande a bien été reçue. Nous prions avec vous."
        champs={[
          { nom: 'nom', label: 'Votre nom (facultatif)' },
          { nom: 'contact', label: 'Téléphone ou e-mail (facultatif)' },
          { nom: 'message', label: 'Votre sujet de prière', type: 'textarea', requis: true },
        ]}
      />
    </Section>
  )
}

function Contact() {
  return (
    <Section titre="Nous contacter">
      <ul className="s-contact">
        <li>📍 {CONFIG.adresse}</li>
        {CONFIG.telephone && <li>📞 {CONFIG.telephone}</li>}
        {CONFIG.whatsapp && <li><a href={`https://wa.me/${CONFIG.whatsapp}`}>WhatsApp</a></li>}
        {CONFIG.email && <li>✉️ {CONFIG.email}</li>}
      </ul>
      <Formulaire
        collectionNom="messagesContact"
        bouton="Envoyer le message"
        merci="Message envoyé. Nous vous répondrons dès que possible."
        champs={[
          { nom: 'nom', label: 'Votre nom', requis: true },
          { nom: 'contact', label: 'Téléphone ou e-mail', requis: true },
          { nom: 'message', label: 'Votre message', type: 'textarea', requis: true },
        ]}
      />
    </Section>
  )
}

function Dons() {
  return (
    <Section titre="Soutenir le ministère">
      <p>Chaque don aide à financer les projets et les actions d'entraide du ministère.</p>
      {CONFIG.dons.length === 0 ? (
        <p className="s-note">Les moyens de don seront publiés ici. En attendant, contactez-nous.</p>
      ) : (
        <div className="s-grille">
          {CONFIG.dons.map((d, i) => (
            <article key={i} className="s-carte">
              <h3>{d.moyen}</h3>
              <p><strong>{d.numero}</strong></p>
              {d.nom && <p>{d.nom}</p>}
            </article>
          ))}
        </div>
      )}
    </Section>
  )
}

export default function SitePublic() {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0); setMenu(false) }, [pathname])
  return (
    <div className="site">
      <header className="s-head">
        <Link to="/" className="s-marque">
          <img src={LOGO_MIMC} alt="" /> <span>M.I.M.C</span>
        </Link>
        <button className="s-burger" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
        <nav className={menu ? 'ouvert' : ''}>
          <NavLink to="/" end>Accueil</NavLink>
          {PAGES.map(([to, t]) => <NavLink key={to} to={to}>{t}</NavLink>)}
          <Link to="/espace" className="s-espace">Espace membres</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/assemblees" element={<Assemblees />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/predications" element={<Predications />} />
        <Route path="/actualites" element={<Actualites />} />
        <Route path="/priere" element={<Priere />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dons" element={<Dons />} />
        <Route path="*" element={<Accueil />} />
      </Routes>

      <footer className="s-pied">
        © {new Date().getFullYear()} M.I.M.C — Cotonou, Bénin · <Link to="/espace">Espace membres</Link>
      </footer>
    </div>
  )
}
