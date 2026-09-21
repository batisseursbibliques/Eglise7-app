import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { connexion } = useAuth()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await connexion(email, motDePasse)
    } catch (err) {
      setErreur("Identifiants incorrects. Vérifiez l'e-mail et le mot de passe fournis par le responsable.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="ecran-centre">
      <form className="carte-connexion" onSubmit={valider}>
        <h1 className="titre-app">Espace de gestion</h1>
        <p className="sous-titre">Connectez-vous avec le compte qui vous a été créé.</p>

        <label className="champ-label" htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="champ-saisie"
        />

        <label className="champ-label" htmlFor="mdp">Mot de passe</label>
        <input
          id="mdp"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
          className="champ-saisie"
        />

        {erreur && <p className="message-erreur">{erreur}</p>}

        <button type="submit" className="bouton-principal" disabled={enCours}>
          {enCours ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
