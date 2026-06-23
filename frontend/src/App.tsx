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

type PlanHistoryPageResponse = {
  content: PlanHistoryItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

type ValidationErrorResponse = {
  timestamp: string
  status: number
  message: string
  fieldErrors: Record<string, string>
}

type ApiErrorResponse = {
  timestamp: string
  status: number
  message: string
}

const HISTORY_PAGE_SIZE = 5;
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '') // Remove trailing slash if present
const apiUrl = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, '')
  return `${API_BASE_URL}/${normalizedPath}`
}
const SELECTED_DESTINATION_KEY = 'planner.selectedDestination'
const DAYS_KEY = 'planner.days'

function App() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState(() => {
    return localStorage.getItem(SELECTED_DESTINATION_KEY) ?? 'tokyo'
  })
  const [days, setDays] = useState(() => {
    const raw = localStorage.getItem(DAYS_KEY) 
    const parsed = raw ? Number(raw) : NaN
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 14 ? parsed : 3
  })

  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [deletingPlanIds, setDeletingPlanIds] = useState<number[]>([])
  const [clearingHistory, setClearingHistory] = useState(false)

  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [editingDays, setEditingDays] = useState(1)
  const [updatingPlanIds, setUpdatingPlanIds] = useState<number[]>([])

  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [history, setHistory] = useState<PlanHistoryItem[]>([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(0)
  const [historyTotalElements, setHistoryTotalElements] = useState(0)

  const loadPlanHistory = async (
    targetPage = historyPage,
    signal?: AbortSignal
  ) => {
    const fetchPage = async (page: number) => {
      const response = await fetch(
        apiUrl(`/api/plan?page=${page}&size=${HISTORY_PAGE_SIZE}`),
        { signal }
      )

      if (!response.ok) {
        const message = await readApiErrorMessage(
          response,
          `Failed to load history (${response.status})`
        )
        throw new Error(message)
      }
      return (await response.json()) as PlanHistoryPageResponse
    }
    

    try {
      setLoadingHistory(true)

      let data = await fetchPage(targetPage)

      // if requested page is now invalid (e.g., after deletes), retry once with last page.
      if (data.totalPages > 0 && targetPage > data.totalPages - 1) {
        data = await fetchPage(data.totalPages - 1)
      }

      setError(null)
      setHistory(data.content)
      setHistoryPage(data.page)
      setHistoryTotalPages(data.totalPages)
      setHistoryTotalElements(data.totalElements)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 
      setError(err instanceof Error ? err.message : 'Unknown error')
    }  finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    
    const fetchDestinations = async () => {
      try {
        const response = await fetch(apiUrl('/api/destinations'), { signal })
        if (!response.ok) {
          throw new Error(`Failed to load destinations ${response.status}`)
        }
        const data = (await response.json()) as Destination[]
        setDestinations(data)

        if (data.length > 0 && !data.some((d) => d.id === selectedDestination)) {
          setSelectedDestination(data[0].id)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoadingDestinations(false)
      } 
    }

    fetchDestinations()
    loadPlanHistory(0, signal)

    return () => controller.abort()
  }, [])

  useEffect(() => {
    localStorage.setItem(SELECTED_DESTINATION_KEY, selectedDestination)
  }, [selectedDestination])

  useEffect(() => {
    localStorage.setItem(DAYS_KEY, String(days))
  }, [days])

  const handleGeneratePlan: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setLoadingPlan(true)
    setError(null)
    setValidationErrors({})
    setSuccessMessage(null)
    try {
      const response = await fetch(apiUrl('/api/plan'), {
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

        const message = await readApiErrorMessage(
          response,
          `Failed to generate plan (${response.status})`
        )

        throw new Error(message)
      }

      const data = (await response.json()) as PlanResponse
      setPlan(data)
      await loadPlanHistory(0)
      setError(null)
      setSuccessMessage('Plan generated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPlan(null)
    } finally {
      setLoadingPlan(false)
    }
  }

  const handleDeletePlan = async (id: number) => {
    setError(null)
    setDeletingPlanIds((prev) => [...prev, id])
    setSuccessMessage(null)

    try {
      const response = await fetch(apiUrl(`/api/plan/${id}`), {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        const fallback = response.status === 404
        ? 'This plan was already removed. History has been refreshed.'
        : `Failed to delete plan (${response.status})`

        const message = await readApiErrorMessage(response, fallback)
        throw new Error(message)
      }

      const shouldGoPreviousPage = history.length === 1 && historyPage > 0
      await loadPlanHistory(shouldGoPreviousPage ? historyPage - 1 : historyPage)
      setError(null)
      setSuccessMessage('Plan deleted successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      await loadPlanHistory()
    } finally {
      setDeletingPlanIds((prev) => prev.filter((planId) => planId !== id))
    }
  }

  const readApiErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data = (await response.json()) as Partial<ApiErrorResponse>
      if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message
      }
    } catch {

    } 
    return fallback
  }

  const handleClearHistory = async () => {
    setError(null)
    setSuccessMessage(null)

    const confirmed = window.confirm('Clear all saved plans? This cannot be undone.')
    if (!confirmed) return

    setClearingHistory(true)

    try {
      const response = await fetch(apiUrl('/api/plan'), {
        method: 'DELETE'
      })

      if (!response.ok && response.status !== 204) {
        const message = await readApiErrorMessage(
          response,
          `Failed to clear history (${response.status})`
        )
        throw new Error(message)
      }

      await loadPlanHistory(0)
      setError(null)
      setSuccessMessage('History cleared successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setClearingHistory(false)
    }
  }

  const hasHistoryPages = historyTotalPages > 0
  const canGoPrevious = hasHistoryPages && historyPage > 0
  const canGoNext = hasHistoryPages && historyPage + 1 < historyTotalPages
  const historyRangeStart = historyTotalElements === 0 ? 0 : historyPage * HISTORY_PAGE_SIZE + 1
  const historyRangeEnd = historyTotalElements === 0 ? 0 : Math.min((historyPage + 1) * HISTORY_PAGE_SIZE, historyTotalElements)

  const formatDateTime = (isoString: string) => 
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString))

  const startEditingPlan = (item: PlanHistoryItem) => {
    setEditingPlanId(item.id)
    setEditingDays(item.days)
    setError(null)
  }

  const handleUpdatePlanDays = async (id: number) => {
    setError(null)
    setUpdatingPlanIds((prev) => [...prev, id])
    setSuccessMessage(null)

    try {
      if (!Number.isInteger(editingDays) || editingDays < 1 || editingDays > 14) {
        setError('Days must be an integer between 1 and 14.')
        setUpdatingPlanIds((prev) => prev.filter((planId) => planId !== id))
        return 
      }
      
      const response = await fetch(apiUrl(`/api/plan/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ days: editingDays }),
      })

      if (!response.ok) {
        const message = await readApiErrorMessage(
          response,
          `Failed to update plan (${response.status})`
        )
        throw new Error(message)
      }

      const updated = (await response.json()) as PlanHistoryItem

      setHistory((prev) => 
        prev.map((item) => item.id === id 
          ? {...item, days: updated.days, createdAt: updated.createdAt}
          : item)
      )

      setEditingPlanId(null)
      setError(null)
      setSuccessMessage('Plan updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdatingPlanIds((prev) => prev.filter((planId) => planId !== id))
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

      {successMessage && <p className='success'>{successMessage}</p>}

      {Object.keys(validationErrors).length > 0 && ( // If there are validation errors, show them in a list
        <div className='error'>
          <p>Please fix the following:</p>
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
          <button type='button' onClick={() => loadPlanHistory(historyPage)} disabled={loadingHistory}>
            {loadingHistory ? 'Refreshing...' : 'Refresh history'}
          </button>
          <button
            type='button'
            className='clear-button'
            onClick={handleClearHistory}
            disabled={clearingHistory || loadingHistory || historyTotalElements === 0}
          >
            {clearingHistory ? 'Clearing...' : 'Clear History'}
          </button>
        </div>

        <p>
          Showing {historyRangeStart} - {historyRangeEnd} of {' '}
          <strong>{historyTotalElements}</strong>
        </p>

        {!loadingHistory && history.length === 0 && <p>No saved plans yet.</p>}

        {!loadingHistory && history.length > 0 && (
          <ul className='history-list'>
            {history.map((item) => {
              const isDeleting = deletingPlanIds.includes(item.id)
              const isUpdating = updatingPlanIds.includes(item.id)
              const isEditing = editingPlanId === item.id
              const isAnotherRowBeingEdited = editingPlanId !== null && editingPlanId !== item.id

              return (
                <li key={item.id} className='history-item'>
                  <span>
                    #{item.id} - {item.destination.toUpperCase()} ({item.days} days) - {' '}
                    {formatDateTime(item.createdAt)}
                  </span>

                  <div className='history-item-actions'>
                    {isEditing ? (
                      <>
                        <input
                          type='number' 
                          min={1}
                          max={14}
                          value={editingDays}
                          onChange={(e) => setEditingDays(Number(e.target.value))}
                        />
                        <button 
                          type='button'
                          onClick={() => handleUpdatePlanDays(item.id)}
                          disabled={isDeleting || isUpdating || isAnotherRowBeingEdited}
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type='button'
                          onClick={() => setEditingPlanId(null)}
                          disabled={isDeleting || isUpdating || isAnotherRowBeingEdited}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type='button'
                          onClick={() => startEditingPlan(item)}
                          disabled={isDeleting || isUpdating || isAnotherRowBeingEdited}
                        >
                          Edit
                        </button>
                        <button
                          type='button'
                          className='delete-button'
                          onClick={() => handleDeletePlan(item.id)}
                          disabled={isDeleting || isUpdating || isAnotherRowBeingEdited}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {hasHistoryPages && (
          <div className='history-pagination'>
            <button
              type='button'
              onClick={() => loadPlanHistory(historyPage - 1)}
              disabled={loadingHistory || !canGoPrevious}
            >
              Previous
            </button>
            <span>
              Page {historyPage + 1} / {historyTotalPages}
            </span>
            <button
              type='button'
              onClick={() => loadPlanHistory(historyPage + 1)}
              disabled={loadingHistory || !canGoNext}
            >
              Next
            </button>
          </div>
        )}
        
      </section>
    </main>
  )
}

export default App