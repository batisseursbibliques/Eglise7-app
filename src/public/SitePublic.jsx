import React, { useEffect, useState } from 'react'
import { Link, NavLink, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { LOGO_MIMC } from '../assets/logo-mimc.js'
import './site.css'

// À renseigner par Paul : coordonnées publiques et moyens de don
const CONFIG = {
  email: 'triomphateur777@gmail.com',
  telephones: ['+229 96 84 59 27', '+229 65 59 51 82', '+229 97 03 85 84'],
  whatsapp: '22996845927',
  adresse: 'Quartier Kowégbo, Maison KOKOYE Armand, Lot 781, Akpakpa, Cotonou — République du Bénin',
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
        {CONFIG.telephones.map((t) => <li key={t}>📞 <a href={`tel:${t.replace(/\s/g, '')}`}>{t}</a></li>)}
        {CONFIG.whatsapp && <li><a href={`https://wa.me/${CONFIG.whatsapp}`}>WhatsApp</a></li>}
        {CONFIG.email && <li>✉️ <a href={`mailto:${CONFIG.email}`}>{CONFIG.email}</a></li>}
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

const MINISTERES = [
  ['evangelisation', 'Évangélisation', '📣', 'Porter l\'Évangile au-delà des murs de l\'Église.'],
  ['ecole-biblique', 'École biblique', '📖', 'Enseigner la Parole et former des serviteurs.'],
  ['jeunesse', 'Jeunesse', '🧑‍🤝‍🧑', 'Accompagner les jeunes dans leur foi et leur avenir.'],
  ['femmes', 'Femmes', '👩', 'Un espace de prière, de partage et de croissance.'],
  ['enfants', 'Enfants', '🧒', 'Enseigner aux plus petits à connaître Jésus.'],
  ['louange', 'Louange & adoration', '🎵', 'Adorer Dieu en esprit et en vérité.'],
  ['action-sociale', 'Action sociale', '🤝', 'Servir les personnes dans le besoin.'],
  ['conferences', 'Conférences & séminaires', '🎤', 'Des temps de formation et d\'enseignement.'],
]
const PILIERS = [
  ['Évangéliser', '🌍', 'Porter l\'Évangile au-delà des murs de l\'Église.'],
  ['Former', '📖', 'Former des disciples et préparer des serviteurs de Dieu.'],
  ['Bâtir', '🏛️', 'Accompagner les personnes dans leur croissance spirituelle.'],
  ['Impacter', '💛', 'Contribuer au bien-être social, à l\'éducation, à la santé et à la réduction de la pauvreté.'],
]
const NAV = [
  ['/notre-eglise', 'Notre Église'], ['/ministeres', 'Ministères'], ['/evenements', 'Événements'],
  ['/medias', 'Médias'], ['/actualites', 'Actualités'], ['/contact', 'Contact'],
]

function useProchains(n = 3) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    const q = query(collection(db, 'siteEvenements'), orderBy('date', 'asc'))
    return onSnapshot(q, (sn) => {
      const auj = new Date().toISOString().slice(0, 10)
      setItems(sn.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => (e.date || '') >= auj).slice(0, n))
    }, () => setItems([]))
  }, [n])
  return items
}

const MOIS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC']

function Accueil() {
  const prochains = useProchains()
  return (
    <>
      <div className="s-hero">
        <small>BIENVENUE AU</small>
        <h1>Ministère d'Impact La Montagne de Consolation en Christ <span>MIMC</span></h1>
        <p className="s-cite">« Prêcher l'Évangile de Jésus-Christ à travers le monde et bâtir des vies pour Sa gloire. »</p>
        <div className="s-actions">
          <Link to="/contact" className="s-btn">Nous rejoindre →</Link>
          <Link to="/notre-eglise" className="s-btn s-btn-clair">Découvrir le MIMC</Link>
        </div>
        <p className="s-verset">« Allez, faites de toutes les nations des disciples… » — Matthieu 28:19</p>
      </div>

      <div className="s-bloc s-deux">
        <div>
          <small className="s-sur">BIENVENUE AU MIMC</small>
          <h2>Une communauté appelée à annoncer Christ et à bâtir des vies.</h2>
          <p>Le Ministère d'Impact La Montagne de Consolation en Christ est une communauté chrétienne engagée dans la proclamation de l'Évangile, la formation des disciples et l'édification des vies.</p>
          <p>Notre désir est de voir des hommes et des femmes connaître Christ, grandir dans la foi, servir selon leur appel et devenir, à leur tour, des instruments d'impact dans leur génération.</p>
          <Link to="/notre-eglise" className="s-btn s-btn-contour">En savoir plus →</Link>
        </div>
        <div className="s-vision">
          <small className="s-sur">NOTRE VISION</small>
          <h3>Prêcher Christ. Former des disciples. Bâtir des vies. Impacter les générations.</h3>
          <div className="s-piliers">
            {PILIERS.map(([t, i, d]) => (
              <div key={t}><span>{i}</span><strong>{t.toUpperCase()}</strong><p>{d}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="s-fond"><Fondateur /></div>

      <div className="s-bloc">
        <h2>Nos ministères</h2>
        <p className="s-note">Des services pour tous les âges et toutes les générations.</p>
        <div className="s-min">
          {MINISTERES.map(([slug, t, i]) => (
            <Link key={slug} to={`/ministeres/${slug}`} className="s-carte s-mini"><span>{i}</span>{t}</Link>
          ))}
        </div>
      </div>

      <div className="s-bloc s-deux">
        <div className="s-events">
          <h2>Prochains événements</h2>
          {prochains === null && <p>Chargement…</p>}
          {prochains?.length === 0 && <p>Les prochains événements seront annoncés ici.</p>}
          {prochains?.map((e) => {
            const d = new Date(e.date)
            return (
              <div key={e.id} className="s-event">
                <div className="s-jour"><b>{d.getDate()}</b>{MOIS[d.getMonth()]}</div>
                <div><strong>{e.titre}</strong>{e.lieu && <p>📍 {e.lieu}</p>}</div>
              </div>
            )
          })}
          <Link to="/evenements" className="s-lien-clair">Voir tous les événements →</Link>
        </div>
        <div className="s-ecoute">
          <h2>Nous sommes à votre écoute</h2>
          <p>Vous souhaitez nous contacter, demander une prière, obtenir des informations ou échanger avec l'équipe pastorale ?</p>
          <div className="s-actions" style={{ justifyContent: 'flex-start' }}>
            <Link to="/priere" className="s-btn">🙏 Demande de prière</Link>
            <Link to="/contact" className="s-btn s-btn-contour">✉️ Nous contacter</Link>
          </div>
        </div>
      </div>

      <div className="s-bandeau">
        <h2>Jésus-Christ transforme des vies.</h2>
        <p>Nous sommes appelés à les accompagner, les former et les bâtir pour Sa gloire.</p>
        <Link to="/contact" className="s-btn">Rejoignez-nous →</Link>
      </div>
    </>
  )
}

function Fondateur() {
  return (
    <div className="s-bloc s-deux s-fondateur" id="fondateur">
      <img src="/images/fondateur.jpg" alt="Apôtre Prosper SAGBOHAN et son épouse" />
      <div>
        <small className="s-sur">LE FONDATEUR</small>
        <h2>Apôtre Prosper SAGBOHAN</h2>
        <h3>Fondateur &amp; Président du MIMC</h3>
        <p>Le visionnaire du MIMC, Apôtre Prosper SAGBOHAN, est un serviteur de Dieu passionné par l'Évangile et la transformation des vies. À travers son ministère, il a reçu la vision de fonder le MIMC pour impacter les nations par la prédication de la Parole, la formation des disciples et les œuvres de bienfaisance.</p>
      </div>
    </div>
  )
}

function NotreEglise() {
  return (
    <>
      <Section titre="Notre Église">
        <p>Le Ministère d'Impact La Montagne de Consolation en Christ est une communauté chrétienne dont le siège est à Akpakpa, Cotonou. Elle est engagée dans la proclamation de l'Évangile, la formation des disciples et l'édification des vies.</p>
        <h3>Notre vision</h3>
        <p>Prêcher Christ. Former des disciples. Bâtir des vies. Impacter les générations.</p>
        <div className="s-grille">
          {PILIERS.map(([t, i, d]) => (<article key={t} className="s-carte"><h3>{i} {t}</h3><p>{d}</p></article>))}
        </div>
      </Section>
      <Fondateur />
      <Assemblees />
    </>
  )
}

function Ministeres() {
  return (
    <Section titre="Nos ministères">
      <div className="s-grille">
        {MINISTERES.map(([slug, t, i, d]) => (
          <Link key={slug} to={`/ministeres/${slug}`} className="s-carte s-tuile"><h3>{i} {t}</h3><p>{d}</p></Link>
        ))}
      </div>
    </Section>
  )
}

function Ministere() {
  const { slug } = useParams()
  const m = MINISTERES.find((x) => x[0] === slug)
  if (!m) return <Ministeres />
  return (
    <Section titre={`${m[2]} ${m[1]}`}>
      <p>{m[3]}</p>
      <p className="s-note">Les informations détaillées de ce ministère seront bientôt publiées.</p>
      <Link to="/ministeres" className="s-lien">← Tous les ministères</Link>
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
          <img src={LOGO_MIMC} alt="" /> <span>MIMC</span>
        </Link>
        <button className="s-burger" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
        <nav className={menu ? 'ouvert' : ''}>
          <NavLink to="/" end>Accueil</NavLink>
          {NAV.map(([to, t]) => <NavLink key={to} to={to}>{t}</NavLink>)}
          <Link to="/dons" className="s-don">Faire un don</Link>
          <Link to="/espace" className="s-espace">Espace membres</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/notre-eglise" element={<NotreEglise />} />
        <Route path="/ministeres" element={<Ministeres />} />
        <Route path="/ministeres/:slug" element={<Ministere />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/medias" element={<Predications />} />
        <Route path="/actualites" element={<Actualites />} />
        <Route path="/priere" element={<Priere />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dons" element={<Dons />} />
        <Route path="*" element={<Accueil />} />
      </Routes>

      <footer className="s-pied">
        <div>
          <strong>MIMC</strong>
          <p>Ministère d'Impact La Montagne de Consolation en Christ</p>
        </div>
        <div>
          <strong>Siège social</strong>
          <p>{CONFIG.adresse}</p>
          <p>{CONFIG.telephones.join(' · ')}</p>
          <p>{CONFIG.email}</p>
        </div>
        <div>
          <strong>Liens utiles</strong>
          {NAV.map(([to, t]) => <Link key={to} to={to}>{t}</Link>)}
          <Link to="/espace">Espace membres</Link>
        </div>
        <p className="s-copy">© {new Date().getFullYear()} MIMC — Tous droits réservés</p>
      </footer>
    </div>
  )
}
