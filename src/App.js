import React, { PureComponent } from 'react'

import { Router } from './nav'
import { connectStore } from './redux'
import ErrorBox from './components/ErrorBox'

import styles from './App.styl'


@connectStore('config', 'router')
export default class App extends PureComponent {
  render () {
    let content

    const connError = this.props.selectors.getConnectionError()
    if (connError) {
      content = (
        <ErrorBox>
          <p>
            Unable to connect to Ethereum. Ensure you have MetaMask
            installed or that you are viewing this page within a Dapp browser,
            and ensure that you are connected to the right Ethereum network.
          </p>
          <p>Error: {`${connError}`}</p>
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
          <a className={styles.githubLink} href="https://github.com/eth-battleship/eth-battleship.github.io">
            View source
          </a>
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
