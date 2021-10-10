import {Component, Input, OnInit} from '@angular/core';
import {AppState, Source, SourceSide} from "../app.reducer";
import {Store} from "@ngrx/store";
import {loadSource, setSourceLabel} from "../app.actions";

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.less']
})
export class SourceComponent {

  @Input() public source!: Source

  public isLoaded: boolean = false
  public rowCount: number = 0
  public colCount: number = 0

  constructor(
    private store: Store<AppState>
  ) { }

  onFileSelected(ev: any){
    const file = ev.target.files[0];
    if(!file) return;
    this.store.dispatch(loadSource({side: this.source.side, file: file}))
  }

  onChangeLabel(ev: any){
    const label = ev.target.value
    this.store.dispatch(setSourceLabel({side: this.source.side, label}))
  }

}
