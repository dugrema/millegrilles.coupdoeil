import React, {useState, useEffect} from 'react'
import {Row, Col} from 'react-bootstrap'

export default function GestionUsagers(props) {

  console.debug("!!! GestionUsagers proppys : %O", props)

  const [listeUsagers, setListeUsagers] = useState([])
  const {connexion} = props.workers

  useEffect(_=>{
    chargerListeUsagers(connexion, setListeUsagers)
  }, [])

  return (
    <>
      <h2>Gestion usagers</h2>
      <AfficherListeUsagers listeUsagers={listeUsagers} />
    </>
  )
}

function AfficherListeUsagers(props) {

  const listeUsagers = [...props.listeUsagers]
  listeUsagers.sort(trierUsagers)

  return (
    <>
      <h3>Usagers</h3>
      {listeUsagers.map(usager=>{
        return <Usager key={usager.userId} usager={usager} />
      })}
    </>
  )
}

function Usager(props) {
  return (
    <Row>
      <Col>{props.usager.nomUsager}</Col>
    </Row>
  )
}

async function chargerListeUsagers(connexion, setListeUsagers) {
  const liste = await connexion.requeteListeUsagers()
  console.debug("Liste usagers : %O", liste)
  setListeUsagers(liste.usagers)
}

function trierUsagers(a, b) {
  const nomA = a.nomUsager,
        nomB = b.nomUsager
  return nomA.localeCompare(nomB)
}
