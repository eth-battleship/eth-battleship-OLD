import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import { setupStore } from './redux'
import App from './App'

import '../node_modules/react-tabs/style/react-tabs.css'
import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './index.styl'

const store = setupStore()
store.actions.setupWeb3()

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
