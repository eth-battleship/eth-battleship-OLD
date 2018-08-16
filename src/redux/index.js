import _ from 'lodash'
import {
  bindActionCreators,
  applyMiddleware,
  compose,
  combineReducers,
  createStore
} from 'redux'
import { connect } from 'react-redux'
import { createHashHistory } from 'history'
import { connectRouter, routerMiddleware } from 'connected-react-router'

import actionCreators from './actionCreators'
import selectors from './selectors'
import { createReducers } from './reducers'
import { createMiddleware } from './middleware'

let store
const history = createHashHistory()

export const getHistory = () => history

export const setupStore = app => {
  const appMiddleware = createMiddleware(app)
  const reducers = createReducers(app)

  store = createStore(
    connectRouter(history)(combineReducers(reducers)), // new root reducer with router state
    undefined,
    compose(
      applyMiddleware(
        routerMiddleware(history), // for dispatching history actions
        ...appMiddleware
      ),
      window && window.devToolsExtension ? window.devToolsExtension() : f => f
    )
  )

  // hot module reload
  if (window.__DEV__) {
    if (module.hot) {
      module.hot.accept('./reducers', () =>
        store.replaceReducer(require('./reducers').createReducers(app)))
    }
  }

  // as a convenience, bind actions and selectors onto the store
  store.actions = bindActionCreators(actionCreators, store.dispatch)
  store.selectors = Object.keys(selectors).reduce(
    (set, fn) => ({
      ...set,
      [fn]: (...args) => selectors[fn](store.getState(), ...args)
    }),
    {}
  )

  // store.subscribe(() => {
  //   console.warn(JSON.stringify(store.getState(), null, 2))
  // })

  return store
}

export const getStore = () => store

export const connectStore = (...storeSubParts) => Component =>
  connect(
    // mapStateToProps
    state => {
      const stateParts = Object.keys(state)
      const requestedParts = storeSubParts

      const missing = _.difference(requestedParts, stateParts)
      if (missing.length) {
        throw new Error(`Invalid store sub-parts requested: ${missing.join(' ')}`)
      }

      return _.reduce(
        state,
        (m, item, key) => {
          if (!storeSubParts.length || storeSubParts.includes(key)) {
            return {
              ...m,
              [key]: item
            }
          }

          return m
        },
        {}
      )
    },
    // mapDispatchToProps
    null,
    (stateProps, dispatchProps, ownProps) => ({
      ...stateProps,
      ...ownProps,
      dispatch: store.dispatch,
      actions: store.actions,
      selectors: store.selectors
    }),
    { withRef: true }
  )(Component)
