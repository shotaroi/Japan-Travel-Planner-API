import { useEffect, useState, type SubmitEventHandler } from 'react'
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

type PlanHistoryItem = {
  id: number
  destination: string
  days: number
  createdAt: string
}

type ValidationErrorResponse = {
  timestamp: string
  status: number
  message: string
  fieldErrors: Record<string, string>
}

function App() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState('tokyo')
  const [days, setDays] = useState(3)

  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [history, setHistory] = useState<PlanHistoryItem[]>([])

  const loadPlanHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch('http://localhost:8080/api/plan')
      if (!response.ok) {
        throw new Error(`Failed to load history (${response.status})`)
      }

      const data = (await response.json()) as PlanHistoryItem[]
      setHistory(data.slice().reverse())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingHistory(false)
    }
  }

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
    loadPlanHistory()
  }, [])

  const handleGeneratePlan: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setLoadingPlan(true)
    setError(null)
    setValidationErrors({})

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

      if (!response.ok) {
        if (response.status === 400) {
          const validation = (await response.json()) as ValidationErrorResponse
          setValidationErrors(validation.fieldErrors ?? {})
          setPlan(null)
          return
        }

        throw new Error(`Failed to generate plan (${response.status})`)
      }

      const data = (await response.json()) as PlanResponse
      setPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPlan(null)
    } finally {
      setLoadingPlan(false)
    }
  }

  const handleDeletePlan = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/plan/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete plan (${response.status})`)
      }

      setHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <main className='app'>
      <h1>Japan Travel Planner</h1>
      <p>Create a simple day-by-day itinerary.</p>

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
                <option key={destination.id} value={destination.id}>
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

      {Object.keys(validationErrors).length > 0 && ( // If there are validation errors, show them in a list
        <div className='error'>
          <p>Please fix the folowing:</p>
          <ul>
            {Object.entries(validationErrors).map(([field, message]) => (
              <li key={field}>
                <strong>{field}</strong>: {message}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <section className='history'>
        <div className='history-header'>
          <h2>Saved Plans</h2>
          <button type='button' onClick={loadPlanHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Refreshing...' : 'Refresh history'}
          </button>
        </div>

        {!loadingHistory && history.length === 0 && <p>No saved plans yet.</p>}

        {!loadingHistory && history.length > 0 && (
          <ul className='history-list'>
            {history.map((item) => (
              <li key={item.id} className='history-item'>
                <span>
                  #{item.id} - {item.destination.toUpperCase()} ({item.days} days) -{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <button type='button' onClick={() => handleDeletePlan(item.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App