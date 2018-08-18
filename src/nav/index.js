import React from 'react'
import { Switch, Route } from 'react-router'
import { ConnectedRouter } from 'connected-react-router'

import { getHistory } from '../redux'
import Home from '../pages/Home'
import NewGame from '../pages/NewGame'
import ViewGame from '../pages/ViewGame'

export const Router = () => (
  <ConnectedRouter history={getHistory()}>
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route path="/new" component={NewGame}/>
      <Route path="/:address" component={ViewGame}/>
    </Switch>
  </ConnectedRouter>
)
