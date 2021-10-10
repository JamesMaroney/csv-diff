import { createReducer, on } from '@ngrx/store';
import {linkColumns, setSourceLabel, sourceLoaded, unlinkColumns} from "./app.actions";

export type SourceSide = 'left' | 'right'

export interface Column {
  label: string
  index: number
  side: SourceSide
  isGroup: false
}

export interface ColumnGroup {
  isGroup: true,
  left: Column,
  right: Column
}

export interface Source {
  label: string
  loaded: boolean
  side: SourceSide
  data?: any[][]
}

export type Layout = (Column | ColumnGroup)[]

export interface AppState {
  sources: {
    'left': Source
    'right': Source
  },
  layout: Layout,
  mergedData: any[][]
}

export const initialState: AppState = {
  sources: {
    'left': {
      label: 'XD',
      loaded: false,
      side: 'left',
    },
    'right': {
      label: 'Caribou',
      loaded: false,
      side: 'right',
    }
  },
  layout: [],
  mergedData: []
}

const _linkColumns = (layout: Layout, left: Column, right: Column) => {
  // make a copy of the layout to modify
  layout = [...layout]

  // grab index of the left col to know where to add the new ColumnGroup
  const index = layout.indexOf(left)

  // strip out the target columns from the layout
  layout = layout.filter(c => c !== left && c !== right)

  // create a new ColumnGroup
  const colGroup = { left, right, isGroup: true } as ColumnGroup

  // splice in a new group where the left col was
  layout.splice(index, 0, colGroup)

  return layout
}

const _unlinkColumns = (layout: Layout, group: ColumnGroup): Layout => {
  // copy the layout without the group included
  layout = layout.filter(c => c !== group)

  // find the target left and right indices and re-insert the columns
  // @ts-ignore
  const leftIndex: number = layout.reduce((acc, c: Column, i) => (c.side === 'left' && c.index < group.left.index && i >= acc) ? i+1 : acc, 1)
  layout.splice(leftIndex, 0, group.left)
  // @ts-ignore
  const rightIndex: number = layout.reduceRight((acc, c: Column, i) => (c.side === 'right' && c.index > group.right.index && i < acc) ? i : acc, layout.length)
  layout.splice(rightIndex, 0, group.right)

  return layout
}

function* collateRows(left: any[], right: any[]){
  let ri = 0
  let li = 0
  while(true){
    const r = right[ri]
    const l = left[li]
    if(!r && !l) return // both sets exhausted, we're done
    if(!r){ yield [l, null]; li++ } // right exhausted
    else if(!l){ yield [null, r]; ri++ } // left exhausted
    else if(l[0] < r[0]){ yield [l, null]; li++ } // left not found in right
    else if(l[0] > r[0]){ yield [null, r]; ri++ } // right not found in left
    else { yield [l,r]; li++; ri++ } // match found
  }
}

const sortByFirstCol = (a: any[], b: any[]): number => (a[0] < b[0]) ? -1 : (a[0] > b[0]) ? 1 : 0
const isEmpty = (data: any) => !data || data === 'NULL'
const computeDiff = (
  layout: Layout,
  leftData: any[][],
  rightData: any[][],
  leftLabel: string,
  rightLabel: string
): any[][] => {
  // computed strings
  const missingInLeft = `missing in ${leftLabel}`
  const missingInRight = `missing in ${rightLabel}`
  const emptyInLeft = `empty in ${leftLabel}`
  const emptyInRight = `empty in ${rightLabel}`

  // sort data
  console.log('starting sort')
  console.time('sorting')
  leftData.slice().sort(sortByFirstCol)
  rightData.slice().sort(sortByFirstCol)
  console.timeEnd('sorting')

  const data = Array.from(collateRows(leftData, rightData))

  return data.map( ([leftData, rightData]) => {
    return layout.map( col => {
      if(col.isGroup){
        const l = leftData?.[col.left.index] || ''
        const r = rightData?.[col.right.index] || ''
        const l_empty = isEmpty(l)
        const r_empty = isEmpty(r)

        let status = 'same'
        if(!leftData) status = missingInLeft
        else if(!rightData) status = missingInRight
        else if( l_empty && !r_empty ) status = emptyInLeft
        else if( r_empty && !l_empty ) status = emptyInRight
        else if( r_empty && l_empty ) status = 'same'
        else if( l !== r ) status = 'different'

        return [ l, r, status ]
      } else {
        return col.side === 'left'
          ? leftData?.[col.index] || ( col.index === 0 ? rightData?.[col.index] : '' )
          : rightData?.[col.index] || ''
      }
    }).flat()
  })
}


const _appReducer = createReducer(
  initialState,

  on(sourceLoaded, (state, {side, headers, data}) => {
    console.log('>>>>> sourceLoaded() ', {side, headers, data})
    let layout = state.layout

    // unlink all grouped columns
    layout.filter(c => c.isGroup).forEach(group => layout = _unlinkColumns(layout, group as ColumnGroup))

    // remove all columns for the target side
    layout = layout.filter(c => (c as Column).side !== side)

    // build new Column entries
    const columns = headers.map((label: string, index: number): Column =>
      ({isGroup: false, label, index, side })
    )
    // if loading the 'right' source, drop the first column
    if(side === 'right') columns.shift()

    // merge the new columns with the filtered layout
    layout = side === 'left' ? [...columns, ...layout] : [...layout, ...columns]

    const newState = {
      ...state,
      layout,
      sources: {
        ...state.sources,
        [side]: {
          ...state.sources[side],
          loaded: true,
          data
        }
      }
    }

    if(newState.sources.left.data && newState.sources.right.data){
      newState.mergedData = computeDiff(
        layout,
        newState.sources.left.data,
        newState.sources.right.data,
        newState.sources.right.label,
        newState.sources.right.label,
      )
    }

    return newState
  }),

  on(setSourceLabel, (state, {side, label}) => {
    return {
      ...state,
      sources: {
        ...state.sources,
        [side]: {
          ...state.sources[side],
          label
        }
      }
    }
  }),

  on(linkColumns, (state, {left, right}) => {
    let layout = _linkColumns(state.layout, left, right)

    return {
      ...state,
      layout,
      mergedData: computeDiff(
        layout,
        state.sources.left.data!,
        state.sources.right.data!,
        state.sources.left.label,
        state.sources.right.label
      )
    }
  }),

  on(unlinkColumns, (state, {group}) => {
    const layout = _unlinkColumns(state.layout, group)

    return {
      ...state,
      layout,
      mergedData: computeDiff(
        layout,
        state.sources.left.data!,
        state.sources.right.data!,
        state.sources.left.label,
        state.sources.right.label
      )
    }
  }),
);

export function appReducer(state: any, action: any) {
  return _appReducer(state, action);
}
