import { base64 } from 'multiformats/bases/base64'

const CONST_TIMEOUT_CERTIFICAT = 2 * 60 * 1000

function build(workers) {

    let cacheCertificatsMaitredescles = null

    return {
        // Recupere une liste de cles, les conserve dans le usagerDao (cache) si applicable
        getCles(liste_hachage_bytes, domaine, opts) {
            return getCles(workers, domaine, liste_hachage_bytes, opts)
        },
        getCertificatsMaitredescles() {
            if(cacheCertificatsMaitredescles) return cacheCertificatsMaitredescles
            return getCertificatsMaitredescles(workers)
                .then(reponse=>{
                    cacheCertificatsMaitredescles = reponse
                    setTimeout(()=>{
                        cacheCertificatsMaitredescles = null
                    }, CONST_TIMEOUT_CERTIFICAT)
                    return reponse
                  })
        }
    }
}

export default build

async function getCles(workers, domaine, liste_hachage_bytes, opts) {
    opts = opts || {}

    console.debug("getCles param domaine %s, liste_hachage_bytes %O (opts: %O)", domaine, liste_hachage_bytes, opts)

    if(typeof(domaine) !== 'string') throw new Error("Erreur getCles domaine : doit etre string")
    if(typeof(liste_hachage_bytes) === 'string') liste_hachage_bytes = [liste_hachage_bytes]
    else if(!Array.isArray(liste_hachage_bytes)) throw new Error('Erreur param liste_hachages_bytes doit etre string ou Array')

    const { connexion, chiffrage, usagerDao } = workers

    const clesManquantes = [],
          clesDechiffrees = {}

    // Recuperer cles connues localement
    for await (const hachage_bytes of liste_hachage_bytes) {
        const cleDechiffree = await usagerDao.getCleDechiffree(hachage_bytes, opts)
        if(cleDechiffree) {
            clesDechiffrees[hachage_bytes] = cleDechiffree
        } else {
            clesManquantes.push(hachage_bytes)
        }
    }

    // console.debug("Cles connues : %d, cles manquantes : %d", Object.keys(clesDechiffrees).length, clesManquantes.length)
    if(clesManquantes.length > 0) {
        // // Recuperer les cles du serveur
        // const reponseClesChiffrees = await connexion.getCles(liste_hachage_bytes, {domaine})
        // // console.debug("getCles reponseClesChiffrees ", reponseClesChiffrees)
        // for await(const cleHachage_bytes of Object.keys(reponseClesChiffrees.cles)) {
        //     const infoCle = reponseClesChiffrees.cles[cleHachage_bytes]
        //     const cleSecrete = await chiffrage.dechiffrerCleSecrete(infoCle.cle)

        //     infoCle.cleSecrete = cleSecrete
        //     delete infoCle.cle  // Supprimer cle chiffree

        //     // Sauvegarder la cle pour reutilisation
        //     usagerDao.saveCleDechiffree(cleHachage_bytes, cleSecrete, infoCle)
        //         .catch(err=>{
        //             console.warn("clesDao.getCles Erreur sauvegarde cle dechiffree %s dans la db locale", err)
        //         })
        
        //     clesDechiffrees[cleHachage_bytes] = infoCle
        // }
        const reponseClesChiffrees = await connexion.getCles(liste_hachage_bytes, {domaine})
        console.debug("getCles reponseClesChiffrees ", reponseClesChiffrees)

        // Nouvelle methode avec reponse chiffree (V2)
        if(!reponseClesChiffrees.ok) {
            throw new Error(`Erreur recuperation cles : ${reponseClesChiffrees.err}`)
        }
        const cles = reponseClesChiffrees.cles
        for(const cle of cles) {
            const cleSecrete = base64.decode('m'+cle.cle_secrete_base64)
            const { format, nonce, verification, cle_id } = cle
            // Sauvegarder la cle pour reutilisation
            const infoCle = {hachage_bytes: cle_id, cleSecrete, format, nonce, verification}
            clesDechiffrees[cle_id] = infoCle
            usagerDao.saveCleDechiffree(cle_id, cleSecrete, infoCle)
                .catch(err=>{
                    console.warn("clesDao.getCles Erreur sauvegarde cle dechiffree %s dans la db locale", err)
                })            
        }
    }

    return clesDechiffrees
}

async function getCertificatsMaitredescles(workers) {
    const { connexion } = workers
    return connexion.getCertificatsMaitredescles()
}
