import { configureStore } from '@reduxjs/toolkit'
import instances from './instancesSlice'
import consignation from './consignationSlice'
import usagers from './usagersSlice'

function storeSetup(workers) {

  // Configurer le store redux
  const store = configureStore({

    reducer: { 
      instances,
      consignation,
      usagers,
    },
      
  })

  return store
}

export default storeSetup
