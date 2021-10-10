import {Component, Input, OnInit} from '@angular/core';
import {AppState, Column, ColumnGroup, Layout, Source, SourceSide} from "../app.reducer";
import {Observable} from "rxjs";
import {Store} from "@ngrx/store";
import {getLeftSource, getMergedDataPreview, getRightSource} from "../app.selectors";
import {downloadRequested, linkColumns, unlinkColumns} from "../app.actions";

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.less']
})
export class OutputComponent {

  @Input() layout!: Layout
  public mergedDataPreview$: Observable<any[][]> | null
  public sources$: {
    'left': Observable<Source> | null,
    'right': Observable<Source> | null
  }

  public linkableColumns(side: SourceSide): Column[] {
    return this.layout.filter(c => !c.isGroup && c.side === side && c.index > 0) as Column[]
  }

  constructor(
    private store: Store<{app: AppState}>,
  ) {
    this.mergedDataPreview$ = store.select(getMergedDataPreview)
    this.sources$ = {
      'left': store.select(getLeftSource),
      'right': store.select(getRightSource)
    }
  }

  public trackByCol(i: number, col: Column | ColumnGroup){
    return col.isGroup ? `g:${col.left.index}.${col.right.index}` : `${col.side}.${col.index}`
  }

  public onLinkColumns(col1: Column, col2: Column){
    const [left, right] = (col1.side === 'left') ? [col1, col2] : [col2, col1]
    this.store.dispatch(linkColumns({left, right}))
  }

  public onUnlinkColumns(group: ColumnGroup) {
    this.store.dispatch(unlinkColumns({group}))
  }

  public onClickDownload(){
    this.store.dispatch(downloadRequested())
  }
}
