import React, { PureComponent } from 'react'

import AuthenticatedView from '../../components/AuthenticatedView'
import Loading from '../../components/Loading'
import { connectStore } from '../../redux'

@connectStore('config')
export default class ViewGame extends PureComponent {
  state = {
    loading: true
  }

  componentDidMount () {
    this._refetch()
  }

  _refetch () {
    const id = this._getId(this.props)

    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates()
    }

    this.setState({
      loading: true
    }, () => {
      this.props.actions.watchGame(id, this._onGameUpdate)
        .then(unsub => {
          this.unsubscribeFromUpdates = unsub
        })
        .catch(() => {})
    })
  }

  componentWillUnmount () {
    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates()
    }
  }

  render () {
    const { loading, game } = this.state

    return (
      <AuthenticatedView text='Please sign in to view game'>
        {loading ? <Loading /> : this._renderGame(game)}
      </AuthenticatedView>
    )
  }

  _renderGame (game) {
    console.log(game)
  }

  _onGameUpdate = game => {
    this.setState({
      loading: false,
      game
    })
  }

  _getId = props => props.match.params.address
}
