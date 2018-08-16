import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'
import GameBoard from '../../components/GameBoard'
import Ship from '../../components/Ship'
import { getColor, shipSitsOn, shipCanBePlaced } from '../../utils/ships'

import styles from './index.styl'

@connectStore()
export default class NewGame extends PureComponent {
  state = {
    boardLength: 10,
    shipLengths: [ 5, 4, 3, 3, 2 ],
    shipPositions: {},
    selectedShip: null
  }

  render () {
    const { boardLength, shipLengths, shipPositions } = this.state

    return (
      <div>
        <div className={styles.selectableShips}>
          {this._renderShipSelector()}
        </div>
        <GameBoard
          boardLength={boardLength}
          shipLengths={shipLengths}
          shipPositions={shipPositions}
          onPress={this._onSelectCell}
          applyHoverStyleToEmptyCell={this._applyHoverStyleToEmptyCell}
        />
        <button onClick={this._onStartGame}>Start game</button>
      </div>
    )
  }

  _renderShipSelector = () => {
    const { shipLengths, shipPositions } = this.state

    const ships = []

    shipLengths.forEach((length, shipId) => {
      // if already placed ship then skip it
      if (shipPositions[shipId]) {
        return
      }

      const onPress = this._buildShipSelector(shipId)

      ships.push(
        <div key={shipId} className={styles.selectableShip}>
          <Ship size={1} length={length} isVertical={false} onPress={onPress} />
          {1 < length ? (
            <Ship size={1} length={length} isVertical={true} onPress={onPress} />
          ) : null}
        </div>
      )
    })

    return ships
  }

  _buildShipSelector = shipId => isVertical => {
    this.setState({
      selectedShip: {
        shipId, isVertical
      }
    })
  }

  _onSelectCell = (x, y) => {
    const { boardLength, shipPositions, shipLengths, selectedShip } = this.state

    let foundShip

    // if there is a ship in this position then remove it
    Object.keys(shipPositions, id => {
      if (shipSitsOn(shipPositions[id], shipLengths[id], x, y)) {
        foundShip = id
      }
    })

    if (foundShip) {
      delete shipPositions[foundShip]

      this.setState({
        shipPositions: {
          ...shipPositions
        }
      })
    }
    // no ship at position, so let's add one!
    else if (selectedShip) {
      const { shipId, isVertical } = selectedShip

      if (shipCanBePlaced(boardLength, shipPositions, shipLengths, shipId, isVertical, x, y)) {
        this.setState({
          selectedShip: null,
          shipPositions: {
            ...shipPositions,
            [shipId]: {
              x, y, isVertical
            }
          }
        })
      }
    }
  }

  _applyHoverStyleToEmptyCell = (style, x, y, hoverX, hoverY) => {
    if (x !== hoverX || y !== hoverY) {
      return
    }

    const { boardLength, shipLengths, shipPositions, selectedShip } = this.state

    if (selectedShip) {
      const { shipId, isVertical } = selectedShip

      if (shipCanBePlaced(boardLength, shipPositions, shipLengths, shipId, isVertical, x, y)) {
        const color = getColor(shipLengths[selectedShip.shipId])

        // eslint-disable-next-line no-param-reassign
        style.outline = `5px solid ${color}`
      }
    }
  }

  _onStartGame = () => {
    this.props.actions.createNewGame()
  }
}
