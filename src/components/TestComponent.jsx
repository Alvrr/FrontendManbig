import React from 'react'
import { HomeIcon } from '@heroicons/react/24/outline'

const TestComponent = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Component</h1>
      <HomeIcon className="w-6 h-6 text-blue-500" />
      <p>If you can see the home icon above, Heroicons is working!</p>
    </div>
  )
}

export default TestComponent
