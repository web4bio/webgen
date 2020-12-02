import React, { useEffect, useState } from 'react'
import ImageContainer from './imagecontainer'

const Inputs = (props) => {
  const [id, setPartId] = useState('')
  const [x, setXCoord] = useState(0)
  const [y, setYCoord] = useState(0)
  const [zoom, setZoomLevel] = useState(0)
  const [imgSrc, setImgSrc] = useState('')

  const idOnChange = (event) => {
    setPartId(event.target.value)
    console.log(id)
  }

  const xOnChange = (event) => {
    setXCoord(event.target.value)
  }


  const yOnChange = (event) => {
    setYCoord(event.target.value)
  }


  const zoomOnChange = (event) => {
    setZoomLevel(event.target.value)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setImgSrc(`https://api.gdc.cancer.gov/tile/${id}?level=${zoom}&x=${x}&y=${y}`)

    const history = JSON.parse(localStorage.getItem('fileIds') || '[]')
    if (history.length > 10)
      history.splice(0, 1)

    const newSubmit = {
      order: ((Number(history.length > 0 ? history[history.length - 1].order : 0)) + 1) % 10,
      id: id,
    }
    history.push(newSubmit)
    localStorage.setItem('fileIds', JSON.stringify(history))

    //#region test
    /**
    setXCoord(0)
    setYCoord(0)
    setZoomLevel(0)
    */
    //#endregion
  }

  // useEffect acts as a callback function for my states: x and y
  useEffect(() => {
    console.log(`x: ${x} y: ${y}`)
    // not ideal but ...
    if (id !== '')
      setImgSrc(`https://api.gdc.cancer.gov/tile/${id}?level=${zoom}&x=${x}&y=${y}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, zoom, setImgSrc])


  useEffect(() => {
    const handleArrow = (event) => {
      // right Arrow
      if (event.keyCode === 39) {
        setZoomLevel(zoom + 1)
      }
      // left Arrow
      else if (event.keyCode === 37) {
        setZoomLevel(zoom - 1)
      }
    }

    window.addEventListener('keydown', handleArrow)

    // always REMOVE the event listener, even if you have to re-add every time 'zoom' is changed
    return () => {
      window.removeEventListener('keydown', handleArrow)
    }
  }, [zoom])

  const moveRight = (e) => {
    setXCoord(x + 1)
  }

  const moveLeft = (e) => {
    setXCoord(x - 1)
  }

  const moveUp = (e) => {
    setYCoord(y + 1)
  }

  const moveDown = (e) => {
    setYCoord(y - 1)
  }


  return (
    <div>
      <div id='inputs'>
        <form onSubmit={onSubmit}>
          <h3>PART ID</h3>
          <div id='partId'>
            <input value={id} onChange={idOnChange} />
          </div>

          <h3>X COORD</h3>
          <div id='xCoord'>
            <input value={x} onChange={xOnChange} />
          </div>

          <h3>Y COORD</h3>
          <div id='yCoord'>
            <input value={y} onChange={yOnChange} />
          </div>

          <h3>ZOOM LV</h3>
          <div id='zoomLv'>
            <input value={zoom} onChange={zoomOnChange} />
          </div>

          <div id='submit'>
            <button type='submit'>See image.</button>
          </div>
        </form>
      </div>
      <div id='imageRootContainer'>
        {id !== '' && <ImageContainer src={imgSrc} moveRight={moveRight} moveDown={moveDown} moveLeft={moveLeft} moveUp={moveUp} />}
      </div>

    </div>
  )

}

export default Inputs