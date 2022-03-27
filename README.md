## eth-battleship

**DEPRECATED: THIS HAS NOW BEEN REPLACED BY a Zero-Knowledge version that's more secure, see https://github.com/eth-battleship/eth-battleship-github.io**

This is a minimalist implementation of the game Battleship on the Ethereum blockchain.
It is to be played by 2 players (i.e. 2 accounts) with any no. of additional observers
able to watch the game progress.

In order to allow for a better user experience, only settlement (i.e. the final
  calculation of who won the game) is done in the smart contract on-chain. All
  intermediate moves played by each player are, until then, stored off chain.

To understand more of the technical architecture of the game and the rationale
behind it please read [design_pattern_decisions.md](design_pattern_decisions.md).

To understand how security risks are mitigated please read [avoiding_common_attacks.md](avoiding_common_attacks.md).

## Game guide

Rules: [https://en.wikipedia.org/wiki/Battleship_(game)](https://en.wikipedia.org/wiki/Battleship_(game))

This is a 2-player game. You cannot play against yourself (i.e. the same ETH address is not permitted to play against itself). Even if you can't play a game you can observe it and/or see it's final outcome.

The smart contract is flexible enough to allow for any configuration of ship
lengths, max. no. of rounds and any size board (<= 16 max size), but for demo sake and to
save time the board size is fixed at 10x10, max. rounds at 30, and the ships are
the same as the default for the traditional game.

## Developer guide

This guide is for running the dapp locally.

Pre-requisites:

* Node.js 8.11.4
* NPM 6.2.0
* Yarn

Install dependencies:

```
yarn
```


Install [Truffle](https://truffleframework.com/docs/getting_started/installation):

Let's run a local private test network:

```
truffle develop
```

In the project folder, prepare and deploy the contracts:

```shell
truffle migrate --reset
```

Now run the dapp:

```
yarn start
```

To test the smart contract code please run:

```shell
truffle test
```
