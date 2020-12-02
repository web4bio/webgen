import { useEffect, useState } from 'react'
import fetchingData from './fetchingData'

const useFetch = (selected) => {
  const [state, setState] = useState({ data: null, loading: true })

  useEffect(() => {
    if (state !== []) {
      setState({ data: null, loading: true })

      // console.log(JSON.stringify(selected)) // type string 

      fetchingData.fileData(selected)
        .then(json => {
          setState({ data: json.data.hits, loading: false })
        })
    }
  }, [selected])

  return state
}

export default useFetch
