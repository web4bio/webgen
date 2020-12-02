import React, { useEffect, useState } from 'react'
import fetchingData from '../helper/fetchingData'
import '../css/dropdown.css'
import useFetch from '../helper/fetchhook'

const Dropdown = (props) => {
  const [list, setList] = useState(['a', 'b', 'c'])
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const { data, loading } = useFetch(selected)

  // please only select one for now
  useEffect(() => {
    if (!loading)
      console.log(data)
  }, [data, loading])

  useEffect(() => {
    const fetchData = async () => {
      const projData = await fetchingData.projectData();
      const data = fetchingData.getCaseCounts(projData);
      setList(data)
    }
    fetchData()
  }, [])

  const onSelect = (selectedItem) => {
    if (selected.some((item) => item === selectedItem)) {
      setSelected(selected.filter((i) => {
        return i !== selectedItem;
      }))
    } else {
      setSelected([...selected, selectedItem])
    }
  }

  return (
    <div className="dd-wrapper">
      <div className="dd-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="dd-header-title">Click me :D</div>
      </div>
      {isOpen && <ul className="dd-list">
        {list.map((item, index) => (
          <li className="dd-list-item" key={index} onClick={() => onSelect(item)}>
            {item} {selected.some((i) => i === item) && '✓'}
          </li>
        ))}
      </ul>}
    </div>
  )
}

export default Dropdown