## blockchain-battleship

Live demo (Ropsten): _TBC_

## Developer guide

Install [Truffle](https://truffleframework.com/docs/getting_started/installation):

```shell
npm i -g truffle
```

In the project folder, prepare the contracts:

```shell
truffle install zeppelin
truffle compile
```

Now let's get an Ethereum client running and connected to one of the test networks.
To run a local development chain do:

```
truffle develop
```

Now copy `truffle-config.js` to `truffle.js` and edit the contents according
to which network you wish to deploy to. Then run:

```
truffle migrate
```

Now you can the tests to ensure everything works:

```shell
truffle test
```

To run the app (against locally running dev chain):

```shell
./dev
```
