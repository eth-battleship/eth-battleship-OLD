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

    await _assertRead(game.calculateBoardHash.call('0x000101'), '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d')
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
})
