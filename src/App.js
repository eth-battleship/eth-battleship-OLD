import React, { PureComponent } from 'react'
// import GameContract from '../build/contracts/Game.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'

import styles from './App.styl'

export default class App extends PureComponent {
  state = {
    web3: null,
    web3Error: null
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        }, () => {
          // Instantiate contract once web3 provided.
          this.instantiateContract()
        })
      })
      .catch(() => {
        this.setState({
          web3Error: 'Unable to detect web3 provider instance. Ensure you have MetaMask installed or that you are viewing this page within a Dapp browser.'
        })
      })
  }

  // instantiateContract() {
  //   const contract = require('truffle-contract')
  //   const game = contract(GameContract)
  //   game.setProvider(this.state.web3.currentProvider)
  //
  //   // Get accounts.
  //   this.state.web3.eth.getAccounts((error, accounts) => {
  //     if (error) {
  //       this.setState({ error })
  //     } else {
  //       game.deployed().catch(error => {
  //         this.setState({ error })
  //       })
  //     }
  //   })
  // }
  //
  render() {
    // const { web3Error, web3 } = this.state

    return (
      <div className={styles.web3Error}>
        Not found!
      </div>
    )
  }
}
