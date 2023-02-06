import { configureStore } from '@reduxjs/toolkit'
import instances from './instancesSlice'

function storeSetup(workers) {

  // Configurer le store redux
  const store = configureStore({

    reducer: { 
      instances, 
    },
      
  })

  return store
}

export default storeSetup
