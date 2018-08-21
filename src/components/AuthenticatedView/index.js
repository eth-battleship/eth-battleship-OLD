import React, { PureComponent } from 'react'

import Button from '../Button'
import ErrorBox from '../ErrorBox'
import { connectStore } from '../../redux'

@connectStore('config')
export default class AuthenticatedView extends PureComponent {
  state = {
    error: null,
    submitting: false
  }

  render () {
    const { submitting, error } = this.state
    const { getAuthKey } = this.props.selectors
    const { text, children } = this.props

    const hasAuthKey = !!getAuthKey()

    return hasAuthKey ? children : (
      <div>
        <Button
          submitting={submitting}
          onClick={this._onPress}
        >
          {text || 'Please sign in'}
        </Button>
        {error ? <ErrorBox>{`${error}`}</ErrorBox> : null}
      </div>
    )
  }

  _onPress = () => {
    this.setState({
      error: null,
      submitting: true
    }, () => {
      this.props.actions.authenticate()
        .then(() => {
          this.setState({
            submitting: false
          })
        })
        .catch(error => {
          this.setState({
            submitting: false,
            error
          })
        })
    })
  }
}
