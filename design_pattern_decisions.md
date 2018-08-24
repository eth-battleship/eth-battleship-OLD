## Design decisions

## On-chain architecture

In order to prevent user's from seeing each other's boards before a game has
been finalized, we use a [Commit-Reveal paradigm](https://karl.tech/learning-solidity-part-2-voting/),
similar to that used for voting systems such as Colony.io.

Roughly speaking, here are steps:

1. Player 1 submits hash of their board (ship positions) to the contract constructor.
2. Player 2 submits hash of their board to the contract to join the game.
3. _Players play moves, all stored off-chain_
4a. One of the players submits their own list of moves to the contract.
4b. The opposing player submits their own list of moves to the contract.
5a. One of the players submits their board (this time in visible format) to the contract.
The contract hashes the board and compares with the originally submitted hash to ensure
it's still the same. The contract now calculates how many hits their opponent scored.
5a. The opposing player submits their board (this time in visible format) to the contract.
The contract hashes the board and compares with the originally submitted hash to ensure
it's still the same. The contract can now calculate how many hits the other player scored.

Notice above that players submit their moves first, and only after that do they
submit their boards. This is to avoid _front-running_ by the opposing player
being able to adjust their list of moves according to the first player's board.

## Off-chain architecture

All players moves are stored in
[Google Firestore](https://firebase.google.com/docs/firestore/). Firestore
is a noSQL database which has a concept of collections, and allows for
per-collection access control. Storing moves off-chain allows for a better
game experience, whereby rounds advances quickly as moves don't need to be
sent to the on-chain contract. Plus, because Firestore is a real-time database
we can instantly update the UI as opposing player's perform actions. It also
allows for _observers_ to watch a game being played between two other players.

Specifically, there are two collections:

* `games` - document id is the Game contract deployment address.
* `playerData` - document id a SHA3 hash of a player's auth key _(see below)_ and
the game contract address. This collection cannot be batch queries. You can only
fetch individual docs, and you need to know the id of the doc in order to do
this - this is a key security-enabling feature.

In the `games` collection each document represents a deployed Game contract
deployed on a chain. The document structure contains:

```
{
  // timestamp of when game was created
  created: 128773...,
  // player 1 address
  plaeyr1: '0x...',
  // player 1's moves (gets modified by player 2 to indicate if a move hit anything)
  player1Moves: [ { x, y, hit }, ... ],
  // player 2 address
  plaeyr2: '0x...',
  // player 2's moves (gets modified by player 1 to indicate if a move hit anything)
  player2Moves: [ { x, y, hit }, ... ],
  // block hash of genesis block of chain
  network: '0x...',
  // current game round
  round: 1 // 2, 3, etc
  // game status
  status: 1 // 2, 3, etc
}
```

The `playerData` document structure looks like:

```
{
  // player's moves (what they reveal to the contract in the end)
  moves: [ { x, y, hit }, ... ]
  // player's board (what they reveal to the contract in the end)
  shipPositions: [ { x, y, isVertical }, ... ]
}
```

The player's moves are stored in both the game document as well as their own
player data document.

The version stored in the game document gets updated by their opponent -
because their opponent has to tell them whether a given move hit a ship or
not, and they do this by modifying the first player's list of moves.

This is also obviously a major weakness in the system - that one
relies on one's opponent to be honest about whether a move hit a ship or not
(of course, the contract ensure honesty in the end). This is also why gambling
cannot yet be implemented for this implementation - not until a better off-chain
mechanism for calculating move hits is available. Given more time, I would
like to investigate the use of zkSnarks for this as I think it's suited for
this problem.

## Authentication

As stated above, the player's data stored in the cloud can only be accessed
by that player. The way this works is by generating an _auth key_ for each
player that only that player can generate using their private key. This
_auth key_ is simply a fixed string signed by one's private key (this is the
  sign in prompt a player gets when wish to view a game). It's similar to what
  cryptokitties and other dapps do.
s

## Efficient hit calculation using bitwise operators

Each players's moves are stored in a 256-bit uint in the contract. Each bit that is
set represents a move by the player. Thus, for a board of size `n` (i.e. `n`
  rows and `n` columns) then a position `(x, y)` maps to bit position `x * n + y`
  in the uint.

This results in a very efficient way testing for hits. However, since the max.
no. of bits is 256 the max board size is thus 16 (since 16 * 16 = 256). The
contract constructor enforces this board size limit.
