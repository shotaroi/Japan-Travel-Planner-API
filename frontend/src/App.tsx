import { useEffect, useState } from 'react'
import './App.css'

type Destination = {
  id: string
  name: string
  description: string
}

function App() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/destinations')
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        const data = (await response.json()) as Destination[]
      setDestinations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      } 
    }

    fetchDestinations()
  }, [])

  return (
    <main className='app'>
      <h1>Japan Travel Planner</h1>
      <p>Choose your next destination</p>

      {loading && <p>Loading destinations...</p>}
      {error && <p className='error'>Failed to load: {error}</p>}

      {!loading && !error && (
        <ul className='destination-list'>
          {destinations.map((destination) => (
            <li key={destination.id} className='destination-card'>
              <h2>{destination.name}</h2>
              <p>{destination.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App