import { Injectable } from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import { AppState } from "./app.reducer";
import { Store } from "@ngrx/store";
import {downloadRequested, loadSource, sourceLoaded} from "./app.actions";
import {mergeMap, withLatestFrom} from "rxjs/operators";
import * as XLSX from "xlsx";
import {getLayout, getLeftSource, getMergedData, getRightSource} from "./app.selectors";
import {ExportService} from "./export.service";


const extractDataFromFile = (file: File): Promise<{headers: string[], data: any[][]}> => {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = function(e) {
      // @ts-ignore
      const arr = new Uint8Array(e.target.result);
      const workbook = XLSX.read(arr, {type: 'array', raw: true});
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const [headers, ...data] = XLSX.utils.sheet_to_json(sheet, {header: 1, blankrows: false})
      resolve({headers, data})
    };
    reader.readAsArrayBuffer(file);
  })
}

@Injectable()
export class AppEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private exportService: ExportService
  ) {}

  loadSource$ = createEffect(() => this.actions$.pipe(
    ofType(loadSource),
    mergeMap( async ({side, file}) => {
      const {headers, data} = await extractDataFromFile(file)
      this.store.dispatch(sourceLoaded({side, headers, data}))
    }),
  ), {dispatch: false});

  triggerDownload$ = createEffect(() => this.actions$.pipe(
      ofType(downloadRequested),
      withLatestFrom(
        this.store.select(getLayout),
        this.store.select(getLeftSource),
        this.store.select(getRightSource),
        this.store.select(getMergedData),
      ),
      mergeMap( async ([action, layout, leftSource, rightSource, mergedData]) => {
        const headers = layout.map( (c, i) => c.isGroup
          ? [ `${leftSource.label} ${c.left.label}`,
              `${rightSource.label} ${c.right.label}`,
              `Status`]
          : i === 0 ? 'ID' : `${c.side === 'left' ? leftSource.label : rightSource.label} ${c.label}`
        ).flat()
        this.exportService.exportArrayToExcel([headers].concat(mergedData), 'diff')
      }),
    ), {dispatch: false});
}
