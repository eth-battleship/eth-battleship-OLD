import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Route } from 'react-router'

import Home from '../pages/Home'

export const Router = () => (
  <BrowserRouter>
    <Route path="/" component={Home}/>
  </BrowserRouter>
)
