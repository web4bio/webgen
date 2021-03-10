import React from 'react'
import { Switch, Route } from 'react-router-dom'

import DisplayImage from './DisplayImage'
import Dropdown from './components/dropdown'

const DropDownTest = () => {
  return (
    <div className='dropdownmenu'>
      <Dropdown />
    </div>
  )
}

const Router = () => {
  return (
    <Switch>
      <Route exact path='/' component={DisplayImage}></Route>
      <Route exact path='/test' component={DropDownTest}></Route>
    </Switch>
  )
}

export default Router