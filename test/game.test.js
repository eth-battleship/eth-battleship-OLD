const Game = artifacts.require("./Game.sol")

const _sanitizeBN = arg => (arg && arg.toNumber) ? arg.toNumber() : arg
const _sanitizeOutput = arg => Array.isArray(arg) ? arg.map(_sanitizeBN) : _sanitizeBN(arg)
const _assertRead = (fn, expected) => (typeof fn === 'function' ? fn.call() : fn).then(val => {
  assert.deepEqual(_sanitizeOutput(val), expected)
})

const shipSizes = '0x02'

/*
0 0
1 1
*/
const player1Board = '0x010000' // [1, 0, 0]
const player1BoardHash = '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431'

/*
0 1
0 1
*/
const player2Board = '0x000101' // [0, 1, 1]
const player2BoardHash = '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d'


const validBoards = {
  '0x000101': '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d',
  '0x000001': '0x95dbad4637b631c083a4bbeef4e3d609c32941d9997a3aec4a123aaa0671f41b',
  '0x000000': '0x99ff0d9125e1fc9531a11262e15aeb2c60509a078c4cc4c64cefdfb06ff68647',
  '0x010000': '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431'
}

const invalidBoards = {
  '0x000100': '0xe45e5a4917582ce5e520ebcff2b11411fbe99dadce43f67aae20fdd57e5675df',
  '0x000001': '0xbce9e184d52afc063499f86cb758361bb2858f21e1b0189d0066b9d5a43de554',
  '0x010001': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
  '0x010101': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d'
}

contract('setup contract', accounts => {
  it('fails if less than one ship specified', async () => {
    let e

    try {
      await Game.new("0x0",10,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is less than 2', async () => {
    let e

    try {
      await Game.new("0x0504030302",1,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is greater than 16', async () => {
    let e

    try {
      await Game.new("0x0504030302",17,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds < 1', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,0,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds > board size squared', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,17,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('sets up contract member variables', async () => {
    const game = await Game.new(shipSizes, 4, 10, player1BoardHash)

    await _assertRead(game.ships, shipSizes)
    await _assertRead(game.maxRounds, 10)
    await _assertRead(game.boardSize, 4)
    await _assertRead(game.nextToPlay, 0)
    await _assertRead(game.currentRound, 0)
    await _assertRead(game.state, 0)
    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      0,
      false,
      0
    ])
    await _assertRead(game.player2, [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      0,
      false,
      0
    ])
  })
})

contract('helper functions', accounts => {
  it('.calculateBoardHash', async () => {
    const game = await Game.deployed()

    await Promise.all(Object.keys(validBoards).map(board => (
      _assertRead(game.calculateBoardHash.call(board), validBoards[board])
    )))
  })
})

contract('ready to join game', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, 2, 1, player1BoardHash)
  })

  it('disallows playing a move', async () => {
    let err

    try {
      await game.play(0,0)
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('disallows checking the board for hits', async () => {
    let err

    try {
      await game.check('0x010000')
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('player 1 can update their board', async () => {
    await game.join(player2BoardHash)

    await _assertRead(game.state, 0)
    await _assertRead(game.player1, [
      accounts[0],
      player2BoardHash,
      0,
      false,
      0
    ])
    await _assertRead(game.player2, [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      0,
      false,
      0
    ])
  })

  it('player 2 can join', async () => {
    await game.join(player2BoardHash, { from: accounts[1] })

    await _assertRead(game.state, 1)
    await _assertRead(game.nextToPlay, 1)
    await _assertRead(game.currentRound, 1)
    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      0,
      false,
      0
    ])
    await _assertRead(game.player2, [
      accounts[1],
      player2BoardHash,
      0,
      false,
      0
    ])
  })

  it('player 3 cannot join after player 2', async () => {
    await game.join(player2BoardHash, { from: accounts[1] })

    let err

    try {
      await game.join(player2BoardHash, { from: accounts[2] })
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })
})


contract('play moves', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, 2, 2, player1BoardHash)
    await game.join(player2BoardHash, { from: accounts[1] })
  })

  it('must play a valid move', async () => {
    const err = []

    try {
      await game.play(2, 0)
    } catch (e) {
      err.push(e)
    }

    try {
      await game.play(0, 2)
    } catch (e) {
      err.push(e)
    }

    assert.equal(err.length, 2)
  })

  it('player 1 can play', async () => {
    await game.play(0, 0)

    await _assertRead(game.state, 1)
    await _assertRead(game.currentRound, 1)
    await _assertRead(game.nextToPlay, 2)
    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      1,
      false,
      0
    ])
  })

  it('player 1 cannot play twice', async () => {
    let err

    await game.play(0, 0)

    try {
      await game.play(0, 0)
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('round advances once player 2 plays', async () => {
    await game.play(0, 0)
    await game.play(1, 0, { from: accounts[1] })

    await _assertRead(game.state, 1)
    await _assertRead(game.nextToPlay, 1)
    await _assertRead(game.currentRound, 2)
    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      1,
      false,
      0
    ])
    await _assertRead(game.player2, [
      accounts[1],
      player2BoardHash,
      4,
      false,
      0
    ])
  })

  it('game automatically goes to reveal state once rounds are done', async () => {
    await game.play(0, 0)
    await game.play(1, 0, { from: accounts[1] })
    await game.play(0, 1)
    await game.play(1, 1, { from: accounts[1] })

    await _assertRead(game.state, 2)
    await _assertRead(game.currentRound, 2)
  })
})

contract('check hits', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, 2, 2, player1BoardHash)
    await game.join(player2BoardHash, { from: accounts[1] })
  })

  it('cannot check whilst play in progress', async () => {
    await game.play(0, 0)

    let err

    try {
      await game.check(player2BoardHash, { from: accounts[1] })
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('requires valid board', async () => {
    await game.play(0, 1)
    await game.play(0, 1, { from: accounts[1] })
    await game.play(0, 0)
    await game.play(0, 0, { from: accounts[1] })

    let err

    try {
      await game.check(player2Board)
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('counts the hits', async () => {
    await game.play(0, 1)
    await game.play(0, 1, { from: accounts[1] })
    await game.play(0, 0)
    await game.play(0, 0, { from: accounts[1] })

    await game.check(player2Board, { from: accounts[1] })

    await _assertRead(game.state, 2)
    await _assertRead(game.currentRound, 2)
    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      2 | 1,
      false,
      1
    ])

    await game.check(player1Board, { from: accounts[0] })

    await _assertRead(game.player2, [
      accounts[1],
      player2BoardHash,
      2 | 1,
      true,
      0
    ])
  })

  it('game is over once both teams have revealed', async () => {
    await game.play(0, 1)
    await game.play(0, 1, { from: accounts[1] })
    await game.play(0, 0)
    await game.play(0, 0, { from: accounts[1] })

    await game.check(player2Board, { from: accounts[1] })
    await game.check(player1Board, { from: accounts[0] })

    await _assertRead(game.state, 3)
  })

  it('can count hits on vertical ships', async () => {
    await game.play(0, 1)
    await game.play(0, 1, { from: accounts[1] })
    await game.play(1, 1)
    await game.play(0, 0, { from: accounts[1] })

    await game.check(player2Board, { from: accounts[1] })

    await _assertRead(game.player1, [
      accounts[0],
      player1BoardHash,
      2 | 8,
      false,
      2
    ])
  })
})

contract('detect invalid boards', accounts => {
  const playMoves = async game => {
    await game.play(0,0)
    await game.play(1,1)
  }

  it('invalid boards', async () => {
    const err = []

    for (let board in invalidBoards) {
      try {
        const hash = invalidBoards[board]

        const game = await Game.new(shipSizes, 2, 1, hash)
        await game.join(hash, { from: accounts[1] })
        await game.play(0,0)
        await game.play(0,0, { from: accounts[1] })
        await game.check(board)
      } catch (e) {
        err.push(e)
      }
    }

    assert.equal(err.length, Object.keys(invalidBoards).length)
  })
})
