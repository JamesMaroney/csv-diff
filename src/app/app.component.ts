import { Component } from '@angular/core';
import { Store } from "@ngrx/store";
import {AppState, Layout, Source} from "./app.reducer";
import {Observable} from "rxjs";
import {getLayout, getLeftSource, getMergedData, getRightSource} from "./app.selectors";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  public leftSource$: Observable<Source> | null
  public rightSource$: Observable<Source> | null
  public layout$: Observable<Layout> | null

  constructor(
    private store: Store<{app: AppState}>,
  ) {
    this.leftSource$ = store.select(getLeftSource)
    this.rightSource$ = store.select(getRightSource)
    this.layout$ = store.select(getLayout)
  }

}
