import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { getColor, shipSitsOn } from '../../utils/game'

import styles from './index.styl'


export default class GameBoard extends PureComponent {
  static propTypes = {
    boardLength: PropTypes.number.isRequired,
    shipLengths: PropTypes.array.isRequired,
    shipPositions: PropTypes.object.isRequired,
    onPress: PropTypes.func,
    applyHoverStyleToEmptyCell: PropTypes.func,
    renderCellContent: PropTypes.func
  }

  state = {
    hoverX: null,
    hoverY: null
  }

  render () {
    return (
      <table className={styles.table}>
        <tbody>{this._renderRows()}</tbody>
      </table>
    )
  }

  _renderRows () {
    const { boardLength } = this.props

    const rows = []

    for (let i = 0; boardLength > i; i += 1) {
      const row = []

      for (let j = 0; boardLength > j; j += 1) {
        row.push(
          this._renderCell(i, j)
        )
      }

      rows.push(
        <tr key={i}>{row}</tr>
      )
    }

    return rows
  }

  _renderCell (x, y) {
    const {
      applyHoverStyleToEmptyCell,
      renderCellContent,
      shipLengths,
      shipPositions,
      onPress
    } = this.props
    const { hoverX, hoverY } = this.state

    let shipToRender
    let partOfShip
    let isVertical

    Object.keys(shipPositions).forEach(shipId => {
      const { x: sx, y: sy, isVertical: sv } = shipPositions[shipId]

      if (shipSitsOn(shipPositions[shipId], shipLengths[shipId], x, y)) {
        shipToRender = shipId
        partOfShip = (isVertical ? (x - sx) : (y - sy)) + 1
        isVertical = sv
      }
    })

    const style = {}

    if (shipToRender) {
      style.backgroundColor = getColor(shipLengths[shipToRender])
      style.cursor = onPress ? 'pointer' : null

      switch (partOfShip) {
        case 0: {
          style[isVertical ? 'borderBottomWidth' : 'borderRightWidth'] = 0
          break
        }
        case shipLengths[shipToRender]: {
          style[isVertical ? 'borderTopWidth' : 'borderLeftWidth'] = 0
          break
        }
        default: {
          style[isVertical ? 'borderTopWidth' : 'borderLeftWidth'] = 0
          style[isVertical ? 'borderBottomWidth' : 'borderRightWidth'] = 0
        }
      }
    }
    // else if hovering over the cell
    else if (applyHoverStyleToEmptyCell) {
      applyHoverStyleToEmptyCell(style, x, y, hoverX, hoverY)
    }

    return (
      <td
        key={`${x}${y}`}
        style={style}
        onClick={() => (onPress ? onPress(x, y) : null)}
        onMouseOver={() => this._onHover(x, y)}
        onMouseOut={() => this._onHover(-1, -1)}
      >
        {renderCellContent ? renderCellContent(x, y) : null}
      </td>
    )
  }

  _onHover = (x, y) => {
    this.setState({
      hoverX: x,
      hoverY: y
    })
  }

  _onStartGame = () => {
    this.props.actions.navNewGame()
  }
}
