import _ from 'lodash'
import { toBN, toHex, bytesToHex, hexToBytes } from 'web3-utils'

import { GAME_STATUS, PLAYER_STATUS } from './constants'
import { getStore } from '../redux'

export const getColor = shipSize => {
  switch (shipSize) {
    case 5: {
      return '#FFC057'
    }
    case 4: {
      return '#0C0CE8'
    }
    case 3: {
      return '#00DAFF'
    }
    case 2: {
      return '#0C0CE8'
    }
    default:
      return 5 < shipSize ? '#EB7FFF' : '#0CE840'
  }
}

export const calculateShipEndPoint = (sx, sy, isVertical, length) => {
  const x = sx + (isVertical ? (length - 1) : 0)
  const y = sy + (isVertical ? 0 : (length - 1))

  return { x, y }
}

export const shipSitsOn = (shipPosition, shipLength, x, y) => {
  const { x: startX, y: startY, isVertical: sv } = shipPosition

  const { x: endX, y: endY } = calculateShipEndPoint(startX, startY, sv, shipLength)

  return (startX <= x && startY <= y && endX >= x && endY >= y)
}


export const shipsSitOn = (shipPositions, shipLengths, x, y) => (
  Object.keys(shipPositions).reduce((m, shipId) => (
    m || shipSitsOn(shipPositions[shipId], shipLengths[shipId], x, y)
  ), false)
)


export const updateMoveHits = (shipPositions, shipLengths, moves) => {
  Object.keys(moves).forEach(idx => {
    const move = moves[idx]
    move.hit = shipsSitOn(shipPositions, shipLengths, move.x, move.y)
  })
}


// See: http://www.cs.swan.ac.uk/~cssimon/line_intersection.html
const linesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
  /* eslint-disable space-infix-ops */
  /* eslint-disable no-mixed-operators */
  const t1 = ((y3-y4)*(x1-x3)+(x4-x3)*(y1-y3)) / ((x4-x3)*(y1-y2)-(x1-x2)*(y4-y3))
  const t2 = ((y1-y2)*(x1-x3)+(x2-x1)*(y1-y3)) / ((x4-x3)*(y1-y2)-(x1-x2)*(y4-y3))
  /* eslint-enable space-infix-ops */
  /* eslint-enable no-mixed-operators */

  // if NaN then likely on exact same line segment
  if (Number.isNaN(t1) || Number.isNaN(t2)) {
    // vertical
    if (y1 === y2 && y1 === y3 && y3 === y4) {
      return (!(x3 > x2 || x4 < x1))
    }
    // horizontal
    else if (x1 === x2 && x2 === x3 && x3 === x4) {
      return (!(y3 > y2 || y4 < y1))
    }
  }

  return (0 <= t1 && 1 >= t1 && 0 <= t2 && 1 >= t2)
}


export const shipCanBePlaced = (
  boardLength, existingShipPositions, shipLengths, shipId, isVertical, x, y
) => {
  const { x: endX, y: endY } = calculateShipEndPoint(x, y, isVertical, shipLengths[shipId])

  // within board confines?
  if (!(boardLength > endX && boardLength > endY)) {
    return false
  }

  // clash with existing ships?
  let clash = false

  Object.keys(existingShipPositions).forEach(existingShipId => {
    const { x: sx, y: sy, isVertical: sv } = existingShipPositions[existingShipId]
    const sl = shipLengths[existingShipId]

    const { x: endSX, y: endSY } = calculateShipEndPoint(sx, sy, sv, sl)

    clash = clash || linesIntersect(x, y, endX, endY, sx, sy, endSX, endSY)
  })

  return !clash
}

export const shipPositionsToSolidityBytesHex = shipPositions => {
  const bytes = []

  Object.values(shipPositions).forEach(({ x, y, isVertical }) => {
    bytes.push(x, y, isVertical ? 1 : 0)
  })

  return bytesToHex(bytes)
}

export const solidityBytesHexToShipPositions = hex => {
  const ret = {}

  const bytes = hexToBytes(hex)

  for (let i = 0; bytes.length > i; i += 3) {
    const x = bytes[i]
    const y = bytes[i + 1]
    const isVertical = !!(bytes[i + 2])

    ret[i / 3] = { x, y, isVertical }
  }

  return ret
}

export const shipLengthsToSolidityBytesHex = shipLengths => bytesToHex(shipLengths)

export const solidityBytesHexToShipLengths = hex => hexToBytes(hex)

export const getNextPlayerToPlay = game => {
  if (game.round > game.maxRounds) {
    return null
  }

  const p1moves = _.get(game, 'player1Moves')
  const p2moves = _.get(game, 'player2Moves')

  if (!p1moves || !p2moves) {
    return 1
  }

  return p2moves.length < p1moves.length ? 2 : 1
}

export const getFriendlyGameStatus = (status, game = {}) => {
  const account = getStore().selectors.getDefaultAccount()
  const playerOneIsMe = game && account && _.get(game, 'player1') === account
  const playerTwoIsMe = game && account && _.get(game, 'player2') === account

  switch (status) {
    case GAME_STATUS.NEED_OPPONENT:
      return 'Awaiting opponent'
    case GAME_STATUS.PLAYING: {
      let str
      if (game) {
        const nextPlayer = getNextPlayerToPlay(game)

        let nextPlayerStr
        if (playerOneIsMe) {
          nextPlayerStr = (1 === nextPlayer) ? 'your' : 'opponent\'s'
        } else if (playerTwoIsMe) {
          nextPlayerStr = (1 === nextPlayer) ? 'opponent\'s' : 'your'
        } else {
          nextPlayerStr = (1 === nextPlayer) ? 'player1\'s' : 'player2\'s'
        }

        str = (!nextPlayer) ? ', ready to reveal' : ` round ${game.round}, ${nextPlayerStr} turn`
      }

      return `Playing${str || ''}`
    }
    case GAME_STATUS.REVEAL_MOVES: {
      const p1Status = game.player1Status
      const p2Status = game.player2Status

      if (p1Status === PLAYER_STATUS.REVEALED_MOVES) {
        if (playerTwoIsMe) {
          return 'You need to reveal your moves to the contract'
        } else if (playerOneIsMe) {
          return 'Opponent needs to reveal their moves to the contract'
        }

        return 'Player2 needs to reveal their moves to the contract'
      } else if (p2Status === PLAYER_STATUS.REVEALED_MOVES) {
        if (playerOneIsMe) {
          return 'You need to reveal your moves to the contract'
        } else if (playerTwoIsMe) {
          return 'Opponent needs to reveal their moves to the contract'
        }

        return 'Player1 needs to reveal their moves to the contract'
      }

      return 'Players need to reveal their moves to the contract'
    }
    case GAME_STATUS.REVEAL_BOARD: {
      const p1Status = game.player1Status
      const p2Status = game.player2Status

      if (p1Status === PLAYER_STATUS.REVEALED_BOARD) {
        if (playerTwoIsMe) {
          return 'You need to reveal your board to the contract'
        } else if (playerOneIsMe) {
          return 'Opponent needs to reveal their board to the contract'
        }

        return 'Player2 needs to reveal their board to the contract'
      } else if (p2Status === PLAYER_STATUS.REVEALED_BOARD) {
        if (playerOneIsMe) {
          return 'You need to reveal your board to the contract'
        } else if (playerTwoIsMe) {
          return 'Opponent needs to reveal their board to the contract'
        }

        return 'Player1 needs to reveal their board to the contract'
      }

      return 'Players need to reveal their boards to the contract'
    }
    case GAME_STATUS.OVER: {
      const { player1Hits, player2Hits } = game

      let str

      if (player1Hits > player2Hits) {
        if (playerOneIsMe) {
          str = 'You won 😄'
        } else if (playerTwoIsMe) {
          str = 'Your opponent won 😞'
        } else {
          str = 'Player1 won'
        }
      } else if (player2Hits > player1Hits) {
        if (playerTwoIsMe) {
          str = 'You won 😄'
        } else if (playerOneIsMe) {
          str = 'Your opponent won 😞'
        } else {
          str = 'Player2 won'
        }
      } else {
        str = 'Neither player won ¯\\_(ツ)_/¯'
      }

      return `Game Over - ${str}`
    }
    default:
      return 'Unknown'
  }
}


export const deriveIntFromContractValue = value => toBN(value).toNumber()


export const deriveGameStatusFromContractValue = statusValue => {
  switch (deriveIntFromContractValue(statusValue)) {
    case 0:
      return GAME_STATUS.NEED_OPPONENT
    case 1:
      return GAME_STATUS.PLAYING
    case 2:
      return GAME_STATUS.REVEAL_MOVES
    case 3:
      return GAME_STATUS.REVEAL_BOARD
    case 4:
      return GAME_STATUS.OVER
    default:
      return GAME_STATUS.UNKNOWN
  }
}

export const derivePlayerStatusFromContractValue = statusValue => {
  switch (deriveIntFromContractValue(statusValue)) {
    case 0:
      return PLAYER_STATUS.READY
    case 1:
      return PLAYER_STATUS.PLAYING
    case 2:
      return PLAYER_STATUS.REVEALED_MOVES
    case 3:
      return PLAYER_STATUS.REVEALED_BOARD
    default:
      return PLAYER_STATUS.UNKNOWN
  }
}


export const mergePrivateMovesWithPublicMoves = (mine, common) => {
  const ret = []

  mine.forEach(({ x, y }, index) => {
    const { x: px, y: py } = common.length > index ? common[index] : {}

    const hit = (px === x && py === y) ? common[index].hit : 0

    ret.push({ x, y, hit })
  })

  return ret
}


export const calculateMovesAndHitsFromFinalContractValue = (
  boardLength, shipLengths, shipPositions, moveUint256
) => {
  const moveBits = toBN(moveUint256)
  const moveBitsStr = moveBits.toString(2, 256)
  const moves = []

  for (let i = 0; boardLength > i; i += 1) {
    for (let j = 0; boardLength > j; j += 1) {
      if (moveBits.testn(i * boardLength + j)) {
        moves.push({ x: i, y: j, hit: 0 })
      }
    }
  }

  Object.keys(shipPositions).forEach(shipId => {
    const { x, y, isVertical } = shipPositions[shipId]

    const { x: endX, y: endY } = calculateShipEndPoint(x, y, isVertical, shipLengths[shipId])

    for (let i = x; endX >= i; i += 1) {
      for (let j = y; endY >= j; j += 1) {
        // quickly check to see if hit
        if ('1' === moveBitsStr.charAt(i * boardLength + j)) {
          moves.forEach(move => {
            if (move.x === x && move.y === y) {
              move.hit = 1
            }
          })
        }
      }
    }
  })

  return moves
}



export const moveArrayToBN = (boardLength, moveArray) => {
  let bn = toBN(0)

  moveArray.forEach(({ x, y }) => {
    bn = bn.bincn(x * boardLength + y)
  })

  return bn
}

export const moveArrayToHexString = (...args) => toHex(moveArrayToBN(...args))
