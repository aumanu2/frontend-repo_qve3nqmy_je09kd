import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null)
    setError('')
    setResult(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!file) {
      setError('Please choose a PDF syllabus to upload.')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported for now.')
      return
    }
    try {
      setLoading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${backend}/api/upload`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || `Upload failed (${res.status})`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Syllabus AI Analyzer</h1>
          <p className="text-gray-600 mt-2">Upload your academic syllabus (PDF). We extract the subject, main topics, and subtopics, then find relevant YouTube videos.</p>
        </header>

        <div className="bg-white/70 backdrop-blur shadow-md rounded-xl p-5 md:p-6">
          <form onSubmit={onSubmit} className="flex flex-col md:flex-row items-stretch gap-4">
            <label className="flex-1 border-2 border-dashed rounded-lg p-4 flex items-center justify-between gap-4 hover:border-indigo-400 transition-colors cursor-pointer">
              <div className="text-left">
                <p className="text-sm text-gray-600">Choose PDF file</p>
                <p className="font-medium text-gray-800 truncate max-w-[22ch]">{file ? file.name : 'No file selected'}</p>
              </div>
              <div className="shrink-0">
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">.pdf</span>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="md:w-40 h-12 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing…' : 'Analyze PDF'}
            </button>
          </form>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
          )}
          {!error && result && result.youtube_results?.length === 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 p-3 text-sm">
              No YouTube API key detected. Set YOUTUBE_API_KEY in the backend environment to fetch video suggestions.
            </div>
          )}
        </div>

        {result && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="md:col-span-1 bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold text-gray-800">Subject</h2>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{result.subject}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Source file</p>
                <p className="text-sm font-medium text-gray-700 break-all">{result.filename}</p>
              </div>
            </section>

            <section className="md:col-span-2 bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold text-gray-800">Extracted Topics</h2>
              <div className="mt-4 space-y-4">
                {result.topics?.map((t, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{t.main_topic}</p>
                    {t.subtopics && t.subtopics.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                        {t.subtopics.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {result && result.youtube_results && result.youtube_results.length > 0 && (
          <section className="mt-8 bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold text-gray-800">Recommended YouTube Videos</h2>
            <p className="text-gray-600 text-sm mt-1">Top picks per main topic</p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.youtube_results.map((group, gIdx) => (
                <div key={gIdx} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-4 pt-4">
                    <p className="font-medium text-gray-900">{group.main_topic}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {group.videos && group.videos.length > 0 ? (
                      group.videos.map((v, vIdx) => (
                        <a key={vIdx} href={v.url} target="_blank" rel="noreferrer" className="flex gap-3 group">
                          <img src={v.thumbnail} alt={v.title} className="w-28 h-16 object-cover rounded" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 line-clamp-2">{v.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{v.channel}</p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No videos found for this topic.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          Backend: <span className="font-mono">{backend}</span>
        </footer>
      </div>
    </div>
  )
}

export default App
