import React from 'react'
import Navbar from './components/navbar'
import Router from './Router'

const App = () => {

  // localStorage.clear()
  return (
    <div id='main'>
      <Navbar />
      <Router />
    </div>
  )
}

export default App
