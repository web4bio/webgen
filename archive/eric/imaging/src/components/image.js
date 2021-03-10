import React from 'react'

const Image = (props) => {

  if (props.src === '')
    return (
      <div id='image'>

      </div>
    )
  else
    return (
      <div id='image'>
        <img width='400' height='400' src={props.src} alt='mia' />
      </div>
    )
}

export default Image