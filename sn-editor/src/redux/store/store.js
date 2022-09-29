import { configureStore } from '@reduxjs/toolkit'
import editorSlice from '../reducers/editorSlice'

const store = configureStore({
  reducer: {
    editor:editorSlice.reducer
  },
})

export default store