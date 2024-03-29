import { createSlice } from '@reduxjs/toolkit'

const SLICE_NAME = 'instances'

const initialState = {
    listeInstances: null,               // Liste triee d'appareils
    instanceId: '',
    sortKeys: {key: 'domaine', ordre: 1},   // Ordre de tri
    mergeVersion: 0,                    // Utilise pour flagger les changements
}

// Actions

function setSortKeysAction(state, action) {
    const sortKeys = action.payload
    state.sortKeys = sortKeys
    if(state.listeInstances) state.listeInstances.sort(genererTriListe(sortKeys))
}

function setInstanceIdAction(state, action) {
    state.instanceId = action.payload
}

function pushAction(state, action) {
    const mergeVersion = state.mergeVersion
    state.mergeVersion++

    let {liste: payload, clear} = action.payload
    if(clear === true) state.listeInstances = []  // Reset liste

    let liste = state.listeInstances || []
    if( Array.isArray(payload) ) {
        const ajouts = payload.map(item=>{return {...item, '_mergeVersion': mergeVersion}})
        // console.debug("pushAction ajouter ", ajouts)
        liste = liste.concat(ajouts)
    } else {
        const ajout = {...payload, '_mergeVersion': mergeVersion}
        // console.debug("pushAction ajouter ", ajout)
        liste.push(ajout)
    }

    // Trier
    liste.sort(genererTriListe(state.sortKeys))
    // console.debug("pushAction liste triee : %O", liste)

    state.listeInstances = liste
}

function clearAction(state) {
    state.listeInstances = null
}

function verifierExpirationAction(state, action) {
    const expiration = (new Date().getTime() / 1000) - 300  // 5 minutes
    state.listeInstances.forEach(item=>{
        if(item.derniere_lecture < expiration) {
            // Modifier pour forcer re-rendering
            item.expiration = expiration
        }
    })
}

// payload {uuid_appareil, ...data}
function mergeInstanceAction(state, action) {
    const mergeVersion = state.mergeVersion
    state.mergeVersion++

    let payload = action.payload
    if(!Array.isArray(payload)) {
        payload = [payload]
    }

    for (const payloadInstance of payload) {
        // console.debug("mergeAppareilAction action: %O", action)
        let { instance_id } = payloadInstance

        // Ajout flag _mergeVersion pour rafraichissement ecran
        const data = {...(payloadInstance || {})}
        data['_mergeVersion'] = mergeVersion

        const liste = state.listeInstances || []
        
        let peutAppend = false
        if(data.supprime === true) {
            // false
        } else {
            peutAppend = true
        }

        // Trouver un fichier correspondant
        let dataCourant = liste.filter(item=>item.instance_id === instance_id).pop()

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

            if(retirer) state.listeInstances = liste.filter(item=>item.instance_id !== instance_id)

        } else if(peutAppend === true) {
            liste.push(data)
            state.listeInstances = liste
        }
    }

    // Trier
    state.listeInstances.sort(genererTriListe(state.sortKeys))
}

const instancesSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setInstanceId: setInstanceIdAction,
        push: pushAction, 
        mergeInstance: mergeInstanceAction,
        clear: clearAction,
        setSortKeys: setSortKeysAction,
        verifierExpiration: verifierExpirationAction,
    }
})

export const { 
    setInstanceId, push, mergeInstance, clear, setSortKeys, verifierExpiration,
} = instancesSlice.actions

export default instancesSlice.reducer

function genererTriListe(sortKeys) {
    
    const key = sortKeys.key || 'domaine',
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
        const { instance_id: instanceIdA } = a,
              { instance_id: instanceIdB } = b

        // Fallback, tuuid (doit toujours etre different)
        return instanceIdA.localeCompare(instanceIdB) * ordre
    }
}
