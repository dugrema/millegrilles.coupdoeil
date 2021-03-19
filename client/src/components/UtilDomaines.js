
export async function chargerStatsTransactionsDomaines(websocketApp, opts) {
  if(!opts) opts={}
  try {
    const domaine = opts.domaine || 'global'
    const resultats = await websocketApp.transmettreRequeteMultiDomaines(domaine + '.requeteStatsTransactions', {})
    return resultats
  } catch (err) {
    console.error("Erreur chargement stats domaines actifs\n%O", err);
  }
}
