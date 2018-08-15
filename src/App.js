import React, { PureComponent } from 'react'

import getWeb3 from './utils/getWeb3'
import { Router } from './nav'
import { connectStore } from './redux'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import styles from './App.styl'


@connectStore('router')
export default class App extends PureComponent {
  state = {
    web3: null,
    web3Error: null
  }

  componentDidMount () {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        })
      })
      .catch(web3Error => {
        this.setState({
          web3Error
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
  render () {
    const { web3Error } = this.state

    let content

    if (web3Error) {
      content = (
        <div className={styles.web3Error}>
          <p>
            Unable to detect web3 provider instance. Ensure you have MetaMask
            installed or that you are viewing this page within a Dapp browser.
          </p>
          <p>{`${web3Error}`}</p>
        </div>
      )
    } else {
      content = <Router />
    }

    return (
      <main>
        <header>
          <div className={styles.brand}>
            Blockchain Battleship!
          </div>
        </header>
        <section className={styles.content}>
          {content}
        </section>
      </main>
    )
  }
}
