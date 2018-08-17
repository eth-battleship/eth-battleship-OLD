import React, { PureComponent } from 'react'

import Loading from '../../components/Loading'
import ErrorBox from '../../components/ErrorBox'
import GamesTable from '../../components/GamesTable'
import { connectStore } from '../../redux'

@connectStore()
export default class Home extends PureComponent {
  state = {
    loading: true,
    error: null,
    games: []
  }

  componentDidMount () {
    this.props.actions.loadActiveGames()
      .then(games => {
        this.setState({ games, loading: false })
      })
      .catch(error => this.setState({ error, loading: false }))
  }

  render () {
    const { loading, error, games } = this.state

    let content

    if (loading) {
      content = <Loading />
    } else if (error) {
      content = <ErrorBox error={error} />
    } else {
      content = this._renderGames(games)
    }

    return (
      <div>
        <button onClick={this._onStartGame}>Start new game</button>
        {content}
      </div>
    )
  }

  _renderGames = games => (
    <div>
      <h2>Active games:</h2>
      <GamesTable games={games} />
    </div>
  )

  _onStartGame = () => {
    this.props.actions.navNewGame()
  }
}
