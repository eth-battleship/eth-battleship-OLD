import React, { PureComponent } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

import AuthenticatedView from '../../components/AuthenticatedView'
import Loading from '../../components/Loading'
import ErrorBox from '../../components/ErrorBox'
import GamesTable from '../../components/GamesTable'
import Button from '../../components/Button'
import { connectStore } from '../../redux'

import styles from './index.styl'

@connectStore('config')
export default class Home extends PureComponent {
  state = {
    loading: true,
    error: null,
    games: []
  }

  componentDidMount () {
    this.props.actions.loadGames()
      .then(games => {
        this.setState({ games, loading: false })
      })
      .catch(error => this.setState({ error, loading: false }))
  }

  render () {
    const { loading, error, games } = this.state

    let content

    if (loading) {
      content = <div><Loading /></div>
    } else {
      content = this._renderGames(games)
    }

    return (
      <div>
        <Button
          className={styles.startButton}
          onClick={this._onStartGame}
        >
          Start new game
        </Button>
        {error ? <ErrorBox className={styles.error}>{`${error}`}</ErrorBox> : null}
        {content}
      </div>
    )
  }

  _renderGames = games => {
    const { getDefaultAccount } = this.props.selectors

    const address = getDefaultAccount()

    const myGames = {}

    if (address) {
      Object.keys(games).forEach(id => {
        const game = games[id]

        if (game.player1 === address || game.player2 === address) {
          myGames[id] = game
        }
      })
    }

    return (
      <Tabs>
        <TabList>
          <Tab>All games</Tab>
          <Tab>My games</Tab>
        </TabList>
        <TabPanel>
          <GamesTable games={games} />
        </TabPanel>
        <TabPanel>
          <AuthenticatedView text='Please sign in to view your games'>
            <GamesTable games={myGames} />
          </AuthenticatedView>
        </TabPanel>
      </Tabs>
    )
  }

  _onStartGame = () => {
    this.props.actions.navNewGame()
  }
}
