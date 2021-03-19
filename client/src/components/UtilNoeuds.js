
export async function chargerInfoNoeud(websocketApp, noeud_id) {
  const domaine = 'Topologie.infoNoeud'
  const params = {'noeud_id': noeud_id}
  const resultats = await websocketApp.transmettreRequete(domaine, params)
  return resultats
}
