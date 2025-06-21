import React from 'react'
import Aurora from './Aurora'

function Background() {

    return (
        <div className='absolute w-full h-screen z-[0] bg-black'>
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={2.0}
                amplitude={3.0}
                speed={1}
                className="absolute inset-0 -z-10 pointer-events-none"
            />
        </div>
    )
}

export default Background