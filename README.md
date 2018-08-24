## eth-battleship

[![Build Status](https://travis-ci.org/eth-battleship/eth-battleship.github.io.svg?branch=source)](https://travis-ci.org/eth-battleship/eth-battleship.github.io)

Live demo (Mainnet, Rinkeby, Ropsten): [https://eth-battleship.github.io/](https://eth-battleship.github.io/)

This is a minimalist implementation of the game Battleship on the Ethereum blockchain.
It is to be played by 2 players (i.e. 2 accounts) with any no. of additional observers
able to watch the game progress.

In order to allow for a better user experience, only settlement (i.e. the final
  calculation of who won the game) is done in the smart contract on-chain. All
  intermediate moves played by each player are, until then, stored off chain.

To understand more of the technical architecture of the game and the rationale
behind it please read [design_pattern_desicions.md](design_pattern_desicions.md).

To understand how security risks are mitigated please read [avoiding_common_attacks.md](avoiding_common_attacks.md).

## Developer guide

This guide is for running the dapp locally.

Pre-requisites:

* Node.js 8.11.4
* NPM 6.2.0


Install [Truffle](https://truffleframework.com/docs/getting_started/installation):

Let's run a local private test network:

```
truffle develop
```

In the project folder, prepare and deploy the contracts:

```shell
yarn
npx truffle migrate --reset
```

To test the smart contract code please run:

```shell
truffle test
```
