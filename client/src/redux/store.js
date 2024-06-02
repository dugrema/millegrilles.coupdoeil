import { configureStore } from '@reduxjs/toolkit'
import instances from './instancesSlice'
import consignation from './consignationSlice'
import usagers from './usagersSlice'
import hebergement from './hebergementSlice'

function storeSetup(workers) {

  // Configurer le store redux
  const store = configureStore({

    reducer: { 
      instances,
      consignation,
      usagers,
      hebergement,
    },
      
  })

  return store
}

export default storeSetup
