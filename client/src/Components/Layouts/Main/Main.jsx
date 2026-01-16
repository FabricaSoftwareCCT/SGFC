import React from 'react'
import './Main.css'

export const Main = ({children, className}) => {
    return (
        <div className='main'>
            <div className="circle"></div>
            <div className="circle_2"></div>

            <div className='container_main'>
                {children}
            </div>
        
        </div> 
    )
}
