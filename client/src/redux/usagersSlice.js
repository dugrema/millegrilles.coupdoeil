import { createSlice } from '@reduxjs/toolkit'

const SLICE_NAME = 'usagers'

const initialState = {
    listeUsagers: null,               // Liste triee d'usagers
    instanceId: '',
    sortKeys: {key: 'nomUsager', ordre: 1},   // Ordre de tri

    userIdSelectionne: '',
    usagerSelectionne: '',

    mergeVersion: 0,                    // Utilise pour flagger les changements
}

function setUserIdAction(state, action) {
    state.userIdSelectionne = action.payload
}


function clearAction(state) {
    state.listeInstances = null
}

// payload {uuid_appareil, ...data}
function mergeUsagerAction(state, action) {
    const mergeVersion = state.mergeVersion
    state.mergeVersion++

    let payload = action.payload
    if(!Array.isArray(payload)) {
        payload = [payload]
    }

    for (const payloadInstance of payload) {
        // console.debug("mergeAppareilAction action: %O", action)
        let { userId } = payloadInstance

        // Ajout flag _mergeVersion pour rafraichissement ecran
        const data = {...(payloadInstance || {})}
        data['_mergeVersion'] = mergeVersion

        let liste = null
        if(state.listeUsagers) {
            liste = [...state.listeUsagers]
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
        let dataCourant = liste.filter(item=>item.userId === userId).pop()

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

            if(retirer) state.listeUsagers = liste.filter(item=>item.userId !== userId)

        } else if(peutAppend === true) {
            liste.push(data)
            state.listeUsagers = liste
        }
    }

    // Trier
    state.listeUsagers.sort(genererTriListe(state.sortKeys))
}

const usagersSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setUserId: setUserIdAction,
        mergeUsager: mergeUsagerAction,
        clear: clearAction,
        // setSortKeys: setSortKeysAction,
    }
})

export const { 
    setUserId, mergeUsager, clear, 
    // setSortKeys,
} = usagersSlice.actions

export default usagersSlice.reducer

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
