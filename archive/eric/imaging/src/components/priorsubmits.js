import React, { useState } from 'react'

const History = () => {

  const [historyArray] = useState((JSON.parse(localStorage.getItem('fileIds') || '[]')).reverse())

  const keys = historyArray.length > 0 ? Object.keys(historyArray[0]) : []

  // the table isn't updating onSubmit 

  return (
    <div id='history'>
      <table>
        <thead>
          <tr>
            {keys.map((key, index) => <th key={index}>{key}</th>)}
          </tr>
        </thead>
        <tbody>
          {historyArray.map((history, index) => (
            <tr key={index}>
              {(Object.values(history)).map((value, i) => (
                <td key={i}>{value}</td>
              )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default History