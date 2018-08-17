import React, { PureComponent } from 'react'

import { Router } from './nav'
import { connectStore } from './redux'
import ErrorBox from './components/ErrorBox'

import styles from './App.styl'


@connectStore('config', 'router')
export default class App extends PureComponent {
  render () {
    let content

    const web3Error = this.props.selectors.getWeb3Error()
    if (web3Error) {
      content = (
        <ErrorBox>
          <p>
            Unable to detect web3 provider instance. Ensure you have MetaMask
            installed or that you are viewing this page within a Dapp browser.
          </p>
          <p>Error: {`${web3Error}`}</p>
        </ErrorBox>
      )
    } else {
      content = <Router />
    }

    return (
      <main>
        <header className={styles.header}>
          <div className={styles.brand} onClick={this._navHome}>
            Blockchain Battleship!
          </div>
        </header>
        <section className={styles.content}>
          {content}
        </section>
      </main>
    )
  }

  _navHome = () => {
    this.props.actions.navHome()
  }
}
