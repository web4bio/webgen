import React from 'react'
import Inputs from './components/inputs'
import History from './components/priorsubmits'

const DisplayImage = () => {
  return (
    <div className='displayimage'>
      <Inputs />
      <History />
    </div>
  )
}

export default DisplayImage