import {createAction, props} from '@ngrx/store';
import {Column, ColumnGroup, SourceSide} from "./app.reducer";

export const noop = createAction('[app] NOOP');

export const loadSource = createAction('[app] Load Source', props<{side: SourceSide, file: File}>());
export const sourceLoaded = createAction('[app] Source Loaded', props<{side: SourceSide, headers: string[], data: any[][]}>());
export const setSourceLabel = createAction('[app] Set Source Label', props<{side: SourceSide, label: string}>());
export const linkColumns = createAction('[app] Link Columns', props<{left: Column, right: Column}>());
export const unlinkColumns = createAction('[app] Unlink Columns', props<{group: ColumnGroup}>());
export const downloadRequested = createAction('[app] Download')
