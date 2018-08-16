export const getColor = shipSize => {
  switch (shipSize) {
    case 5: {
      return '#E205FF'
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


export const shipSitsOn = (ship, shipLength, x, y) => {
  const { x: sx, y: sy, isVertical: sv } = ship

  const startX = sx
  const startY = sy
  const endX = startX + (sv ? (shipLength - 1) : 0)
  const endY = startY + (sv ? 0 : (shipLength - 1))

  return (startX <= x && startY <= y && endX >= x && endY >= y)
}

export const calculateShipEndPoint = (sx, sy, isVertical, length) => {
  const x = sx + (isVertical ? (length - 1) : 0)
  const y = sy + (isVertical ? 0 : (length - 1))

  return { x, y }
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
    else if (x1 === x2 && x1 === x3 && x3 === x4) {
      return (!(y3 > x2 || y4 < y1))
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
