import React from 'react'
import Image from './image'

const ImageContainer = ({ src, moveUp, moveDown, moveRight, moveLeft }) => {

  return (
    <div id='imageContainer'>
      <Image src={src} />
      <div id='buttons'>
        <button type='button' onClick={(e) => moveRight(e)}> Move right! </button>
        <button type='button' onClick={(e) => moveLeft(e)}> Move left! </button>
        <button type='button' onClick={(e) => moveUp(e)}> Move down! </button>
        <button type='button' onClick={(e) => moveDown(e)}> Move up! </button>
      </div>
    </div>
  )

}

export default ImageContainer