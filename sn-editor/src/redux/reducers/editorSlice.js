import { createSlice } from "@reduxjs/toolkit";

const editorSlice = createSlice({
    name:"editorSlice",
    initialState:{
        mode:"VIEW",
        isEditingChanges:false
    },
    reducers:{
        ViewMode : (state)=>{
            state.mode = "VIEW"
        },
        EditMode :(state)=>{
            state.mode = "EDIT"
        },
        changeMode : (state,action)=>{
            state.mode = action.payload
        },
        addChanges :(state)=>{
            state.isEditingChanges = true
        },
        noChanges :(state)=>{
            state.isEditingChanges = false
        }


    }
    
})

export const { ViewMode, EditMode, addChanges,noChanges,changeMode } = editorSlice.actions;

// often the reducer is a default export, but that doesn't matter
export default editorSlice