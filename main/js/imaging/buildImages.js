const removeButtonElements = () => {
  let collection = document.getElementsByClassName('directionalButtons')

  for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
    collection[0].remove()
  }
}

const imageTabListener = () => {
  document.getElementById('imageContainerParent').style = ("display: block;")
  document.getElementById('historyContainerParent').style = ("display: none;")
}

const historyTabListener = () => {
  document.getElementById('imageContainerParent').style = ("display: none;")
  document.getElementById('historyContainerParent').style = ("display: block;")
  buildHistory()
}

const buildButtons = () => {
  const buttonContainer = document.createElement('div')
  const array = ['up', 'down', 'left', 'right']
  const fArray = [
    () => {
      const yPos = document.getElementById('yCoord') || 0
      yPos.value = yPos.value - 1
      onSubmitFunc()
    },
    () => {
      const yPos = document.getElementById('yCoord') || 0
      yPos.value = Number(yPos.value) + 1 + ''
      onSubmitFunc()
    },
    () => {
      const xPos = document.getElementById('xCoord') || 0
      xPos.value = xPos.value - 1
      onSubmitFunc()
    },
    () => {
      const xPos = document.getElementById('xCoord') || 0
      xPos.value = Number(xPos.value) + 1 + ''
      onSubmitFunc()
    }
  ]

  for (let i = 0; i < 4; i++) {
    const button = document.createElement('button')
    button.type = 'button'
    button.innerText = array[i]
    button.onclick = fArray[i]
    button.classList.add('directionalButtons', 'col', 's3', 'btn', 'waves-effect', 'waves-light')
    buttonContainer.appendChild(button)
  }
  document.getElementById('imageContainerParent').appendChild(buttonContainer)
}

const buildImage = ({ fileId, xPos, yPos, zoom }) => {
  const aContainer = document.getElementById('aContainer')
  aContainer.innerHTML = ""
  const imageTag = document.createElement('img')
  imageTag.height = 400
  imageTag.width = 400
  imageTag.alt = "No image found :("
  imageTag.src = `https://api.gdc.cancer.gov/tile/${fileId}?level=${zoom}&x=${xPos}&y=${yPos}`
  aContainer.href = imageTag.src
  aContainer.appendChild(imageTag)
}

const parseURL = () => {
  const params = new URLSearchParams(location.search)
  const idFromSearch = params.get('id')
  const xFromSearch = params.get('x')
  const yFromSearch = params.get('y')
  const zoomFromSearch = params.get('zoom')

  const fileId = document.getElementById('fileId')
  const xPos = document.getElementById('xCoord')
  const yPos = document.getElementById('yCoord')
  const zoom = document.getElementById('zoomLevel')

  fileId.value = idFromSearch
  xPos.value = xFromSearch
  yPos.value = yFromSearch
  zoom.value = zoomFromSearch
}

const getDataFromInputs = () => {
  // URL parser http://localhost:3001?id=xyz&x=xyz&y=xyz&zoom=xyz
  const params = new URLSearchParams(location.search)
  const idFromSearch = params.get('id')
  const xFromSearch = params.get('x')
  const yFromSearch = params.get('y')
  const zoomFromSearch = params.get('zoom')

  // Globals might be better here ...
  const fileId = document.getElementById('fileId').value
  const xPos = document.getElementById('xCoord').value
  const yPos = document.getElementById('yCoord').value
  const zoom = document.getElementById('zoomLevel').value

  console.log({ fileId: fileId, xPos: xPos, yPos: yPos, zoomLevel: zoom })

  return { fileId: idFromSearch || fileId, xPos: xFromSearch || xPos, yPos: yFromSearch || yPos, zoom: zoomFromSearch || zoom }
}

const onSubmitFunc = (e) => {
  const obj = getDataFromInputs()
  buildImage(obj)
  // removeButtonElements()
  // buildButtons()
  storeHistory(obj.fileId)
}

const onResetFunc = () => {
  document.getElementById('fileId').value = ''
  document.getElementById('xCoord').value = ''
  document.getElementById('yCoord').value = ''
  document.getElementById('zoomLevel').value = ''
}

// Uses localStorage
const storeHistory = (fileId) => {
  const history = JSON.parse(localStorage.getItem('fileIds') || '[]')
  if (history.length > 10)
    history.splice(0, 1)

  const newSubmit = {
    order: ((Number(history.length > 0 ? history[history.length - 1].order : 0)) + 1) % 10,
    id: fileId,
  }
  history.push(newSubmit)
  localStorage.setItem('fileIds', JSON.stringify(history))
}

const buildHistory = () => {
  const historyArray = JSON.parse(localStorage.getItem('fileIds') || '[]').reverse()
  const historyContainer = document.getElementById('historyContainer')
  historyContainer.innerHTML = ""

  const listElement = document.createElement('ul')
  for (let i = 0; i < historyArray.length; i++) {
    const liElement = document.createElement('li')
    liElement.innerText = historyArray[i].order + '. ' + historyArray[i].id
    listElement.appendChild(liElement)
  }
  historyContainer.appendChild(listElement)
}

// Executes the function only once the DOM (divs, etc) has been loaded in
document.addEventListener("DOMContentLoaded", (e) => {
  buildButtons()
  parseURL()
})

// Keyboard listener
document.onkeydown = (e) => {
  const zoomInput = document.getElementById('zoomLevel')
  switch (e.keyCode) {
    case 37:
      zoomInput.value = Number(zoomInput.value || 0) - 1 + ''
      onSubmitFunc()
      break;
    case 39:
      zoomInput.value = Number(zoomInput.value || 0) + 1 + ''
      onSubmitFunc()
      break;

  }
}

