import React, { PureComponent } from 'react'

import { Router } from './nav'
import { connectStore } from './redux'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import styles from './App.styl'


@connectStore('config', 'router')
export default class App extends PureComponent {
  render () {
    let content

    const web3Error = this.props.selectors.getWeb3Error()
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
