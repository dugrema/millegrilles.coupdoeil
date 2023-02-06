import { configureStore } from '@reduxjs/toolkit'
import instances from './instancesSlice'
import consignation from './consignationSlice'

function storeSetup(workers) {

  // Configurer le store redux
  const store = configureStore({

    reducer: { 
      instances,
      consignation,
    },
      
  })

  return store
}

export default storeSetup
