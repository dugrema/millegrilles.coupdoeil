import { createSlice } from '@reduxjs/toolkit'

const SLICE_NAME = 'hebergement'

const initialState = {
    listeClients: null,               // Liste triee de millegrilles clients
    sortKeys: {key: 'idmg', ordre: 1},   // Ordre de tri

    idmgClientSelectionne: '',

    mergeVersion: 0,                    // Utilise pour flagger les changements
}

function setIdmgClientAction(state, action) {
    state.idmgClientSelectionne = action.payload
}

function clearAction(state) {
    state.listeClients = null
}

// payload {idmg, ...data}
function mergeClientAction(state, action) {
    const mergeVersion = state.mergeVersion
    state.mergeVersion++

    let payload = action.payload
    if(!Array.isArray(payload)) {
        payload = [payload]
    }

    for (const payloadInstance of payload) {
        // console.debug("mergeAppareilAction action: %O", action)
        let { idmg } = payloadInstance

        // Ajout flag _mergeVersion pour rafraichissement ecran
        const data = {...(payloadInstance || {})}
        data['_mergeVersion'] = mergeVersion

        let liste = null
        if(state.listeClients) {
            liste = [...state.listeClients]
        } else {
            liste = []
        }
        
        let peutAppend = false
        if(data.supprime === true) {
            // false
        } else {
            peutAppend = true
        }

        // Trouver un fichier correspondant
        let dataCourant = liste.filter(item=>item.idmg === idmg).pop()

        // Copier donnees vers state
        if(dataCourant) {
            if(data) {
                const copie = {...data}
                Object.assign(dataCourant, copie)
            }

            let retirer = false
            if(dataCourant.supprime === true) {
                // Le document est supprime
                retirer = true
            }

            if(retirer) state.listeClients = liste.filter(item=>item.idmg !== idmg)

        } else if(peutAppend === true) {
            liste.push(data)
            state.listeClients = liste
        }
    }

    if(!state.listeClients) {
        // Initialiser liste
        state.listeClients = []
    }

    // Trier
    state.listeClients.sort(genererTriListe(state.sortKeys))
}

const hebergementSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setIdmgClient: setIdmgClientAction,
        mergeClient: mergeClientAction,
        clear: clearAction,
        // setSortKeys: setSortKeysAction,
    }
})

export const { 
    setIdmgClient, mergeClient, clear, 
    // setSortKeys,
} = hebergementSlice.actions

export default hebergementSlice.reducer

function genererTriListe(sortKeys) {
    
    const key = sortKeys.key || 'nomUsager',
          ordre = sortKeys.ordre || 1

    return (a, b) => {
        if(a === b) return 0
        if(!a) return 1
        if(!b) return -1

        let valA = a[key], valB = b[key]

        if(valA === valB) return 0
        if(!valA) return 1
        if(!valB) return -1

        if(typeof(valA) === 'string') {
            const diff = valA.localeCompare(valB)
            if(diff) return diff * ordre
        } else if(typeof(valA) === 'number') {
            const diff = valA - valB
            if(diff) return diff * ordre
        } else {
            throw new Error(`genererTriListe values ne peut pas etre compare ${''+valA} ? ${''+valB}`)
        }

        // Fallback, nom/tuuid du fichier
        const { userId: valFbA } = a,
              { userId: valFbB } = b

        // Fallback, tuuid (doit toujours etre different)
        return valFbA.localeCompare(valFbB) * ordre
    }
}
