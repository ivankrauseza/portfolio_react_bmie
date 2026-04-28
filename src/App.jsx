function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 shadow-2xl text-center max-w-xl">
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          Tailwind is Working 🚀
        </h1>

        <p className="text-gray-300 mb-6">
          Your Vite + React + Tailwind setup is now live inside Docker.
        </p>

        <button className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-all duration-300 shadow-lg">
          Test Button
        </button>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-purple-500 h-16 rounded-lg"></div>
          <div className="bg-pink-500 h-16 rounded-lg"></div>
          <div className="bg-indigo-500 h-16 rounded-lg"></div>
        </div>

      </div>
    </div>
  )
}

export default App
