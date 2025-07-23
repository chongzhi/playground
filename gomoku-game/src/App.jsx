import React from 'react'
import GomokuGame from './components/GomokuGame'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          五子棋游戏
        </h1>
        <GomokuGame />
      </div>
    </div>
  )
}

export default App
