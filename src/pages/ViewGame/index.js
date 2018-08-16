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
    this.componentDidUpdate()
  }

  componentDidUpdate (prevProps) {
    const { getAuthKey } = this.props.selectors

    // if no auth key then don't do anything
    if (!getAuthKey()) {
      return
    }

    const id = this._getId(this.props)

    // if previously didn't have auth key or if game id has changed
    if ((!this.state.gotAuthKey) || this._getId(prevProps) !== id) {
      if (this.unsubscribeFromUpdates) {
        this.unsubscribeFromUpdates()
      }

      this.setState({
        gotAuthKey: true,
        loading: true
      }, () => {
        this.props.actions.watchGame(id, this._onGameUpdate)
          .then(unsub => {
            this.unsubscribeFromUpdates = unsub
          })
          .catch(() => {})
      })
    }
  }

  componentWillUnmount () {
    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates()
    }
  }

  render () {
    const { loading, game } = this.state

    return (
      <AuthenticatedView>
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
