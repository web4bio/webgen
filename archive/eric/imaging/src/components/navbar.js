import React from 'react'
import { Link } from 'react-router-dom'


const Navbar = () => {
  return (
    <div className='navigation'>
      <nav>
        <ul>
          <li>
            <Link to='/'>Main</Link>
          </li>
          <li>
            <Link to='/test'>Test</Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar