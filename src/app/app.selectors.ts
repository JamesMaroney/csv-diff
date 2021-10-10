import {createFeatureSelector, createSelector} from "@ngrx/store";
import {AppState} from "./app.reducer";

export const getAppState = createFeatureSelector<AppState>('app')
export const getLeftSource = createSelector(getAppState, s => s.sources.left)
export const getRightSource = createSelector(getAppState, s => s.sources.right)
export const getLayout = createSelector(getAppState, s => s.layout)
export const getMergedData = createSelector(getAppState, s => s.mergedData)
export const getMergedDataPreview = createSelector(getMergedData, d => d.slice(0,20))
