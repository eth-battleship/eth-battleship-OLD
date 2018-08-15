import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import { setupStore } from './redux'
import App from './App'

import './index.styl'

const store = setupStore()
store.actions.setupWeb3()

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
