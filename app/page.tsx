export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold text-white mb-6">
          🚀 PromptMind
        </h1>
        
        <p className="text-2xl text-slate-300 mb-8">
          The First Prompt Stock Market
        </p>
        
        <p className="text-lg text-slate-400 mb-12 leading-relaxed">
          Buy, sell, and breed AI prompts as tokenized assets. Monetize your expertise on Arbitrum blockchain. 
          Earn passive income from your prompt creations.
        </p>

        <div className="flex gap-4 justify-center mb-16 flex-wrap">
          <a 
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Launch App
          </a>
          
          <a 
            href="/docs"
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Documentation
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">💰 Monetize</h3>
            <p className="text-slate-400">Earn passive income from your AI prompts</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">📈 Trade</h3>
            <p className="text-slate-400">Buy and sell prompts on a decentralized market</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">🧬 Breed</h3>
            <p className="text-slate-400">Create hybrid prompts by combining two parents</p>
          </div>
        </div>

        <div className="mt-16 p-8 bg-slate-800 rounded-lg border border-blue-500/20">
          <p className="text-slate-300 mb-4">
            🔗 Powered by:
          </p>
          <div className="flex justify-center gap-8 flex-wrap">
            <span className="text-slate-400">Next.js 16</span>
            <span className="text-slate-400">Arbitrum</span>
            <span className="text-slate-400">Claude AI</span>
            <span className="text-slate-400">PostgreSQL</span>
          </div>
        </div>
      </div>
    </main>
  )
}
