"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Square, Clock, Calendar, CalendarDays, FileText, RotateCcw, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimeEntry {
  id: string
  startTime: number
  endTime: number | null
  notes?: string
}

interface Client {
  id: string
  name: string
  timeEntries: TimeEntry[]
  archived?: boolean
  hourlyRate: number
}

interface ClientTimerProps {
  client: Client
  isActive: boolean
  totalTime: string
  onStart: () => void
  onStop: () => void
  onResetTime: () => void
  onDeleteTimeEntry: (entryId: string) => void
}

export function ClientTimer({
  client,
  isActive,
  totalTime,
  onStart,
  onStop,
  onResetTime,
  onDeleteTimeEntry,
}: ClientTimerProps) {
  const [displayTime, setDisplayTime] = useState(totalTime)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update timer display
  useEffect(() => {
    const updateTimer = () => {
      if (isActive) {
        // For active timers, calculate real-time display
        const activeEntry = client.timeEntries.find((entry) => entry.endTime === null)
        if (activeEntry) {
          // Calculate completed time + current session time
          const completedTime = client.timeEntries.reduce((total, entry) => {
            if (entry.endTime !== null) {
              return total + (entry.endTime - entry.startTime)
            }
            return total
          }, 0)

          const currentSessionTime = Date.now() - activeEntry.startTime
          const totalCurrentTime = completedTime + currentSessionTime
          setDisplayTime(formatTime(totalCurrentTime))
        }
      } else {
        // For inactive timers, use the total time passed from parent
        setDisplayTime(totalTime)
      }
    }

    // Initial update
    updateTimer()

    // Set up interval for active timer
    if (isActive) {
      timerRef.current = setInterval(updateTimer, 1000) // Update every second
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, client.timeEntries, totalTime])

  // Format milliseconds to HH:MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate earnings for a given duration in milliseconds
  const calculateEarnings = (durationMs: number) => {
    const hours = durationMs / (1000 * 60 * 60) // Convert to hours
    return hours * client.hourlyRate
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Get the start of the current week (Sunday)
  const getStartOfWeek = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek) // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    return startOfWeek.getTime()
  }

  // Get the start of the current month
  const getStartOfMonth = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)
    return startOfMonth.getTime()
  }

  // Calculate total time for the current week
  const calculateWeeklyTime = () => {
    const startOfWeek = getStartOfWeek()
    const now = Date.now()

    // Sum up completed entries for this week
    const weeklyTime = client.timeEntries.reduce((total, entry) => {
      // Only count entries that started this week
      if (entry.startTime >= startOfWeek) {
        const endTime = entry.endTime || now // Use current time for active entries
        return total + (endTime - entry.startTime)
      }
      return total
    }, 0)

    return weeklyTime
  }

  // Calculate total time for the current month
  const calculateMonthlyTime = () => {
    const startOfMonth = getStartOfMonth()
    const now = Date.now()

    // Sum up completed entries for this month
    const monthlyTime = client.timeEntries.reduce((total, entry) => {
      // Only count entries that started this month
      if (entry.startTime >= startOfMonth) {
        const endTime = entry.endTime || now // Use current time for active entries
        return total + (endTime - entry.startTime)
      }
      return total
    }, 0)

    return monthlyTime
  }

  // Calculate total earnings
  const calculateTotalEarnings = () => {
    const now = Date.now()
    const totalTime = client.timeEntries.reduce((total, entry) => {
      const endTime = entry.endTime || now
      return total + (endTime - entry.startTime)
    }, 0)
    return calculateEarnings(totalTime)
  }

  // Format today's date entries
  const getTodayEntries = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return client.timeEntries
      .filter((entry) => {
        const entryDate = new Date(entry.startTime)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime() && entry.endTime !== null
      })
      .map((entry) => {
        const start = new Date(entry.startTime)
        const end = new Date(entry.endTime as number)
        const durationMs = (entry.endTime as number) - entry.startTime
        const duration = Math.floor(durationMs / 1000)

        const hours = Math.floor(duration / 3600)
        const minutes = Math.floor((duration % 3600) / 60)
        const seconds = duration % 60

        return {
          id: entry.id,
          startTime: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          endTime: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          earnings: calculateEarnings(durationMs),
          notes: entry.notes,
        }
      })
  }

  const todayEntries = getTodayEntries()
  const weeklyTime = calculateWeeklyTime()
  const monthlyTime = calculateMonthlyTime()
  const weeklyEarnings = calculateEarnings(weeklyTime)
  const monthlyEarnings = calculateEarnings(monthlyTime)
  const totalEarnings = calculateTotalEarnings()

  // Get the week date range for display
  const getWeekDateRange = () => {
    const startOfWeek = new Date(getStartOfWeek())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
  }

  // Get the month name for display
  const getMonthName = () => {
    const now = new Date()
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Handle deleting a specific time entry
  const handleDeleteEntry = (entryId: string, entryDuration: string) => {
    if (confirm(`Are you sure you want to delete this ${entryDuration} time entry? This action cannot be undone.`)) {
      onDeleteTimeEntry(entryId)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle>{client.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatCurrency(client.hourlyRate)}/hour</span>
            </div>
          </div>
          {isActive && <Badge className="bg-green-500">Active</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-mono">{displayTime}</span>
          </div>
          <div className="flex gap-2">
            <Button variant={isActive ? "destructive" : "default"} size="sm" onClick={isActive ? onStop : onStart}>
              {isActive ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetTime}
              disabled={isActive}
              title="Reset all time for this client"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Time and Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Total Time */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Total Time</span>
              <span className="text-lg font-mono font-semibold">{totalTime}</span>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Total Earnings</span>
              <span className="text-lg font-semibold text-green-700 dark:text-green-400">
                {formatCurrency(totalEarnings)}
              </span>
            </div>
          </div>

          {/* Weekly Time */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">This Week</span>
              </div>
              <span className="text-lg font-mono font-semibold">{formatTime(weeklyTime)}</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {formatCurrency(weeklyEarnings)}
              </span>
              <span className="text-xs text-muted-foreground">{getWeekDateRange()}</span>
            </div>
          </div>

          {/* Monthly Time */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">This Month</span>
              </div>
              <span className="text-lg font-mono font-semibold">{formatTime(monthlyTime)}</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {formatCurrency(monthlyEarnings)}
              </span>
              <span className="text-xs text-muted-foreground">{getMonthName()}</span>
            </div>
          </div>
        </div>

        {todayEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Today's Sessions:</h3>
            <div className="text-sm space-y-2 max-h-48 overflow-y-auto">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="group border rounded-md p-2 hover:bg-muted/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          {entry.startTime} - {entry.endTime}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{entry.duration}</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(entry.earnings)}
                          </span>
                        </div>
                      </div>
                      {entry.notes && (
                        <div className="mt-1 text-xs flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{entry.notes}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteEntry(entry.id, entry.duration)}
                      title="Delete this time entry"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
