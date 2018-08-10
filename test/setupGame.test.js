const Game = artifacts.require("./Game.sol")

contract('contruct', accounts => {
  it('fails if less than one ship specified', async () => {
    let e

    try {
      await Game.new("0x0",10,30,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is less than 2', async () => {
    let e

    try {
      await Game.new("0x0504030302",1,30,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is greater than 16', async () => {
    let e

    try {
      await Game.new("0x0504030302",17,30,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds < 1', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,0,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds > board size squared', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,17,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('passes if all parameters are correct', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,10,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
    } catch (err) {
      e = err
    }

    assert.isUndefined(e)
  })
})
//
// contract('Setup game', function(accounts) {
//   const owner = accounts[0]
//   let game
//
//   beforeEach(async () => {
//     game = await Game.deployed()
//   })
//
//   it("sets owner", async () => {
//     assert.equal(await game.owner(), owner)
//   })
//
//   it()
// })
