import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'
import ErrorBox from '../../components/ErrorBox'
import AuthenticatedView from '../../components/AuthenticatedView'
import SetupGameBoard from '../../components/SetupGameBoard'

import styles from './index.styl'

@connectStore()
export default class NewGame extends PureComponent {
  state = {
    submitting: false,
    maxRounds: 30,
    boardLength: 10,
    shipLengths: [ 5, 4, 3, 3, 2 ],
  }

  render () {
    const { submitting, error, boardLength, shipLengths } = this.state

    return (
      <AuthenticatedView text='Please sign in to play'>
        <div>
          <SetupGameBoard
            boardLength={boardLength}
            shipLengths={shipLengths}
            buttonText='Start game'
            buttonSubmitting={submitting}
            onPressButton={this._onStartGame}
            className={styles.setupBoard}
          />
          {error ? <ErrorBox>{`${error}`}</ErrorBox> : null}
        </div>
      </AuthenticatedView>
    )
  }

  _onStartGame = ({ shipPositions }) => {
    const { submitting, maxRounds, boardLength, shipLengths } = this.state

    // already in progress?
    if (submitting) {
      return
    }

    this.setState({
      submitting: true,
      error: null
    }, () => {
      this.props.actions.createNewGame({
        maxRounds, boardLength, shipLengths, shipPositions
      })
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
