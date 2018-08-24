import React, { PureComponent } from 'react'
import ReactTable from 'react-table'

import { connectStore } from '../../redux'
import { getFriendlyGameStatus } from '../../utils/game'

import '../../../node_modules/react-table/react-table.css'
import './index.css'

const COLUMNS = [ {
  Header: 'Address',
  accessor: 'id' // String-based value accessors!
}, {
  Header: 'Started',
  accessor: 'created',
  Cell: ({ value }) => new Date(value).toString()
}, {
  Header: 'Status',
  accessor: 'status',
  Cell: props => getFriendlyGameStatus(props.value[0], props.value[1])
} ]


@connectStore()
export default class GameTable extends PureComponent {
  render () {
    const { games } = this.props

    return (
      <ReactTable
        minRows={1}
        showPagination={false}
        showPageSizeOptions={false}
        data={games}
        resolveData={this._dataToArray}
        columns={COLUMNS}
        getTdProps={this._getTdProps}
      />
    )
  }

  _dataToArray = games => (
    Object.keys(games).map(id => {
      const ga = { ...games[id], id }
      ga.status = [ games[id].status, ga ]
      return ga
    })
  )

  _getTdProps = (state, rowInfo) => ({
    onClick: () => {
      if (rowInfo) {
        this.props.actions.navGame(rowInfo.original.id)
      }
    }
  })
}
