import {
  bindActionCreators,
  applyMiddleware,
  compose,
  combineReducers,
  createStore
} from 'redux'

import actionCreators from './actionCreators'
import selectors from './selectors'
import { createReducers } from './reducers'
import { createMiddleware } from './middleware'

let store

export const setupStore = app => {
  const appMiddleware = createMiddleware(app)
  const reducers = createReducers(app)

  store = compose(
    applyMiddleware(...appMiddleware),
    window && window.devToolsExtension ? window.devToolsExtension() : f => f
  )(createStore)(combineReducers(reducers))

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

  return store
}

export const getStore = () => store
