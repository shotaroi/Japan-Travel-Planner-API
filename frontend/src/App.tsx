import { useEffect, useState } from 'react'
import './App.css'

type Destination = {
  id: string
  name: string
  description: string
}

type DayPlan = {
  day: number
  title: string
  activities: string[]
}

type PlanResponse = {
  destination: string
  days: number
  itinerary: DayPlan[]
}

function App() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState('tokyo')
  const [days, setDays] = useState(3)

  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [plan, setPlan] = useState<PlanResponse | null>(null)

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/destinations')
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        const data = (await response.json()) as Destination[]
        setDestinations(data)
        if (data.length > 0) setSelectedDestination(data[0].id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoadingDestinations(false)
      } 
    }

    fetchDestinations()
  }, [])

  const handleGeneratePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoadingPlan(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8080/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          destination: selectedDestination,
          days
        })
      })

      if (!response.ok) throw new Error(`Failed to generate plan (${response.status})`)

      const data = (await response.json()) as PlanResponse
      setPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPlan(null)
    } finally {
      setLoadingPlan(false)
    }
  }

  return (
    <main className='app'>
      <h1>Japan Travel Planner</h1>
      <p>Choose your next destination</p>

      {loadingDestinations && <p>Loading destinations...</p>}

      {!loadingDestinations && (
        <form className='planner-form' onSubmit={handleGeneratePlan}>
          <label>
            Destination
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
            >
              {destinations.map((destination) => (
                <option key={destination.id} value='destination.id'>
                  {destination.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Days (1-14)
            <input 
              type='number'
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>

          <button type='submit' disabled={loadingPlan}>
            {loadingPlan ? 'Generating...' : 'Generate Plan'}
          </button>
        </form>
      )}

      {error && <p className='error'>{error}</p>}

      {plan && (
        <section className='itinerary'>
          <h2>
            {plan.destination.toUpperCase()} - {plan.days} day plan
          </h2>

          <ul className='day-list'>
            {plan.itinerary.map((day) => (
              <li key={day.day} className='day-card'>
                <h3>Day {day.day}: {day.title}</h3>
                <ul>
                  {day.activities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default App