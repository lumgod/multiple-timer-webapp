"use client"

import { useState, useEffect } from "react"
import { Menu, LogOut, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientTimer } from "@/components/client-timer"
import { ClientSidebar } from "@/components/client-sidebar"
import { useMediaQuery } from "@/hooks/use-mobile"
import { AddNoteDialog } from "@/components/add-note-dialog"
import { DataPersistence } from "@/components/data-persistence"
import { ToastProvider } from "@/components/ui/toast"
import { ToastViewport } from "@/components/ui/toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define types
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

export default function TimerApp() {
  const [clients, setClients] = useState<Client[]>([])
  const [newClientName, setNewClientName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user, isLoading: authLoading, logout, isConfigured } = useAuth()
  const router = useRouter()

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Load clients when user is available
  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  const loadClients = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const dbClients = await DatabaseService.getClients(user.id)

      // Load time entries for each client
      const clientsWithEntries = await Promise.all(
        dbClients.map(async (client) => {
          const timeEntries = await DatabaseService.getTimeEntries(client.id)
          return {
            id: client.id,
            name: client.name,
            archived: client.archived,
            hourlyRate: client.hourly_rate || 0,
            timeEntries: timeEntries.map((entry) => ({
              id: entry.id,
              startTime: new Date(entry.start_time).getTime(),
              endTime: entry.end_time ? new Date(entry.end_time).getTime() : null,
              notes: entry.notes || undefined,
            })),
          }
        }),
      )

      setClients(clientsWithEntries)

      // Select first active client if none selected
      if (!selectedClientId) {
        const firstActiveClient = clientsWithEntries.find((c) => !c.archived)
        if (firstActiveClient) {
          setSelectedClientId(firstActiveClient.id)
        }
      }
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load your clients. Please try refreshing the page.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show configuration error if Supabase is not set up
  if (!isConfigured) {
    return (
      <ToastProvider>
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Configuration Required</CardTitle>
              </div>
              <CardDescription>Supabase environment variables are missing or incorrect.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please ensure the following environment variables are set in your Vercel project:
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <div>NEXT_PUBLIC_SUPABASE_URL</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              </div>
              <p className="text-sm text-muted-foreground">
                You can find these values in your Supabase project settings under "API".
              </p>
            </CardContent>
          </Card>
        </div>
        <ToastViewport />
      </ToastProvider>
    )
  }

  // Show loading state while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the app if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Add a new client
  const addClient = async () => {
    if (newClientName.trim() === "" || !user) return

    try {
      const newClient = await DatabaseService.createClient({
        user_id: user.id,
        name: newClientName.trim(),
        archived: false,
        hourly_rate: 0,
      })

      const clientWithEntries = {
        id: newClient.id,
        name: newClient.name,
        archived: newClient.archived,
        hourlyRate: newClient.hourly_rate || 0,
        timeEntries: [],
      }

      setClients([clientWithEntries, ...clients])
      setNewClientName("")
      setSelectedClientId(newClient.id)

      // Make sure we're showing active clients when adding a new one
      if (showArchived) {
        setShowArchived(false)
      }

      toast({
        title: "Client added",
        description: `${newClient.name} has been added to your clients.`,
      })
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        variant: "destructive",
        title: "Error adding client",
        description: "Failed to add the client. Please try again.",
      })
    }
  }

  // Update a client
  const updateClient = async (clientId: string, updates: { name?: string; hourlyRate?: number }) => {
    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate

      await DatabaseService.updateClient(clientId, updateData)

      setClients(
        clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              name: updates.name !== undefined ? updates.name : client.name,
              hourlyRate: updates.hourlyRate !== undefined ? updates.hourlyRate : client.hourlyRate,
            }
          }
          return client
        }),
      )

      toast({
        title: "Client updated",
        description: "Client information has been saved.",
      })
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        variant: "destructive",
        title: "Error updating client",
        description: "Failed to update the client. Please try again.",
      })
    }
  }

  // Start timer for a client
  const startTimer = async (clientId: string) => {
    if (!user) return

    try {
      const timeEntry = await DatabaseService.createTimeEntry({
        client_id: clientId,
        user_id: user.id,
        start_time: new Date().toISOString(),
      })

      setActiveEntryId(timeEntry.id)

      setClients(
        clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              timeEntries: [
                {
                  id: timeEntry.id,
                  startTime: new Date(timeEntry.start_time).getTime(),
                  endTime: null,
                  notes: undefined,
                },
                ...client.timeEntries,
              ],
            }
          }
          return client
        }),
      )

      toast({
        title: "Timer started",
        description: "Time tracking has begun for this client.",
      })
    } catch (error) {
      console.error("Error starting timer:", error)
      toast({
        variant: "destructive",
        title: "Error starting timer",
        description: "Failed to start the timer. Please try again.",
      })
    }
  }

  // Stop timer for a client and prompt for notes
  const stopTimer = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    const activeEntry = client?.timeEntries.find((entry) => entry.endTime === null)

    if (!activeEntry) return

    try {
      const updatedEntry = await DatabaseService.updateTimeEntry(activeEntry.id, {
        end_time: new Date().toISOString(),
      })

      setClients(
        clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              timeEntries: client.timeEntries.map((entry) => {
                if (entry.id === activeEntry.id) {
                  return {
                    ...entry,
                    endTime: new Date(updatedEntry.end_time!).getTime(),
                  }
                }
                return entry
              }),
            }
          }
          return client
        }),
      )

      // Then show the note dialog
      setShowNoteDialog(true)

      toast({
        title: "Timer stopped",
        description: "Time tracking has been stopped for this client.",
      })
    } catch (error) {
      console.error("Error stopping timer:", error)
      toast({
        variant: "destructive",
        title: "Error stopping timer",
        description: "Failed to stop the timer. Please try again.",
      })
    }
  }

  // Add note to the most recent time entry
  const addNoteToEntry = async (note: string) => {
    if (!selectedClientId || !activeEntryId) return

    try {
      await DatabaseService.updateTimeEntry(activeEntryId, {
        notes: note || null,
      })

      setClients(
        clients.map((client) => {
          if (client.id === selectedClientId) {
            return {
              ...client,
              timeEntries: client.timeEntries.map((entry) => {
                if (entry.id === activeEntryId) {
                  return { ...entry, notes: note || undefined }
                }
                return entry
              }),
            }
          }
          return client
        }),
      )

      setActiveEntryId(null)
      setShowNoteDialog(false)

      if (note) {
        toast({
          title: "Note added",
          description: "Your work notes have been saved.",
        })
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        variant: "destructive",
        title: "Error saving note",
        description: "Failed to save the note. Please try again.",
      })
    }
  }

  // Archive a client
  const toggleArchiveClient = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    const newArchivedState = !client.archived

    try {
      await DatabaseService.updateClient(clientId, {
        archived: newArchivedState,
      })

      setClients(clients.map((c) => (c.id === clientId ? { ...c, archived: newArchivedState } : c)))

      // If we're archiving the currently selected client, select another active client
      if (newArchivedState && selectedClientId === clientId) {
        const nextActiveClient = clients.find((c) => !c.archived && c.id !== clientId)
        if (nextActiveClient) {
          setSelectedClientId(nextActiveClient.id)
        } else {
          setSelectedClientId(null)
        }
      }

      toast({
        title: newArchivedState ? "Client archived" : "Client restored",
        description: `${client.name} has been ${newArchivedState ? "archived" : "restored"}.`,
      })
    } catch (error) {
      console.error("Error toggling archive:", error)
      toast({
        variant: "destructive",
        title: "Error updating client",
        description: "Failed to update the client. Please try again.",
      })
    }
  }

  // Delete a client
  const deleteClient = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    try {
      await DatabaseService.deleteClient(clientId)

      const updatedClients = clients.filter((c) => c.id !== clientId)
      setClients(updatedClients)

      // If the deleted client was selected, select another client or clear selection
      if (selectedClientId === clientId) {
        const nextActiveClient = updatedClients.find((c) => !c.archived)
        if (nextActiveClient) {
          setSelectedClientId(nextActiveClient.id)
        } else {
          setSelectedClientId(null)
        }
      }

      toast({
        title: "Client deleted",
        description: `${client.name} and all associated time entries have been permanently deleted.`,
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        variant: "destructive",
        title: "Error deleting client",
        description: "Failed to delete the client. Please try again.",
      })
    }
  }

  // Reset all time entries for a client
  const resetClientTime = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    // Don't allow reset if timer is active
    if (hasActiveTimer(client)) {
      toast({
        variant: "destructive",
        title: "Cannot reset time",
        description: "Please stop the active timer before resetting time.",
      })
      return
    }

    if (
      !confirm(`Are you sure you want to reset all time entries for "${client.name}"? This action cannot be undone.`)
    ) {
      return
    }

    try {
      // Delete all time entries for this client
      await Promise.all(client.timeEntries.map((entry) => DatabaseService.deleteTimeEntry(entry.id)))

      // Update the client in state
      setClients(
        clients.map((c) => {
          if (c.id === clientId) {
            return { ...c, timeEntries: [] }
          }
          return c
        }),
      )

      toast({
        title: "Time reset",
        description: `All time entries for ${client.name} have been cleared.`,
      })
    } catch (error) {
      console.error("Error resetting client time:", error)
      toast({
        variant: "destructive",
        title: "Error resetting time",
        description: "Failed to reset the client's time. Please try again.",
      })
    }
  }

  // Delete a specific time entry
  const deleteTimeEntry = async (entryId: string) => {
    try {
      await DatabaseService.deleteTimeEntry(entryId)

      // Update the client in state by removing the time entry
      setClients(
        clients.map((client) => ({
          ...client,
          timeEntries: client.timeEntries.filter((entry) => entry.id !== entryId),
        })),
      )

      toast({
        title: "Time entry deleted",
        description: "The time entry has been removed.",
      })
    } catch (error) {
      console.error("Error deleting time entry:", error)
      toast({
        variant: "destructive",
        title: "Error deleting entry",
        description: "Failed to delete the time entry. Please try again.",
      })
    }
  }

  // Calculate if a client has an active timer
  const hasActiveTimer = (client: Client) => {
    return client.timeEntries.some((entry) => entry.endTime === null)
  }

  // Calculate total time for a client (in milliseconds)
  const calculateTotalTime = (client: Client) => {
    return client.timeEntries.reduce((total, entry) => {
      const endTime = entry.endTime || Date.now()
      return total + (endTime - entry.startTime)
    }, 0)
  }

  // Format milliseconds to HH:MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Export data as JSON string
  const exportData = () => {
    const data = {
      clients,
      selectedClientId,
      exportDate: new Date().toISOString(),
      userId: user.id,
    }
    return JSON.stringify(data, null, 2)
  }

  // Import data from JSON string
  const importData = async (jsonData: string) => {
    if (!user) return

    try {
      const data = JSON.parse(jsonData)
      if (data.clients && Array.isArray(data.clients)) {
        // Import only client names, not full data
        const existingClientNames = clients.map((c) => c.name.toLowerCase())
        const newClients = data.clients.filter((c: any) => !existingClientNames.includes(c.name.toLowerCase()))

        for (const clientData of newClients) {
          await DatabaseService.createClient({
            user_id: user.id,
            name: clientData.name,
            archived: false,
            hourly_rate: clientData.hourlyRate || 0,
          })
        }

        // Reload clients from database
        await loadClients()

        toast({
          title: "Clients imported",
          description: `Successfully imported ${newClients.length} new clients.`,
        })
      }
    } catch (error) {
      console.error("Error importing data:", error)
      throw error
    }
  }

  // Reset all data
  const resetData = async () => {
    if (!user) return

    try {
      // Delete all clients (this will cascade delete time entries)
      await Promise.all(clients.map((client) => DatabaseService.deleteClient(client.id)))

      setClients([])
      setSelectedClientId(null)

      toast({
        title: "Data reset complete",
        description: "All time tracking data has been cleared.",
      })
    } catch (error) {
      console.error("Error resetting data:", error)
      toast({
        variant: "destructive",
        title: "Error resetting data",
        description: "Failed to reset data. Please try again.",
      })
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  // Filter clients based on search query and archive status
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchiveFilter = showArchived ? client.archived : !client.archived
    return matchesSearch && matchesArchiveFilter
  })

  // Get the selected client
  const selectedClient = clients.find((client) => client.id === selectedClientId)

  // Count active and archived clients
  const activeClientCount = clients.filter((client) => !client.archived).length
  const archivedClientCount = clients.filter((client) => client.archived).length

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar toggle */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${
            isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"
          } w-72 border-r bg-card transition-transform duration-200 ease-in-out flex flex-col`}
        >
          <ClientSidebar
            clients={filteredClients}
            selectedClientId={selectedClientId}
            onSelectClient={setSelectedClientId}
            onToggleArchive={toggleArchiveClient}
            onDeleteClient={deleteClient}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            newClientName={newClientName}
            setNewClientName={setNewClientName}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            activeClientCount={activeClientCount}
            archivedClientCount={archivedClientCount}
            hasActiveTimer={hasActiveTimer}
            calculateTotalTime={calculateTotalTime}
            formatTime={formatTime}
          />

          {/* Data persistence controls */}
          <div className="mt-auto p-4 border-t">
            <DataPersistence clients={clients} onExport={exportData} onImport={importData} onReset={resetData} />

            {/* User info and logout button */}
            <div className="mt-4 space-y-2">
              <div className="text-xs text-muted-foreground text-center">
                Logged in as <span className="font-medium">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-8 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Client Time Tracker</h1>

            {/* Selected client timer */}
            {selectedClient ? (
              <ClientTimer
                client={selectedClient}
                isActive={hasActiveTimer(selectedClient)}
                totalTime={formatTime(calculateTotalTime(selectedClient))}
                onStart={() => startTimer(selectedClient.id)}
                onStop={() => stopTimer(selectedClient.id)}
                onResetTime={() => resetClientTime(selectedClient.id)}
                onDeleteTimeEntry={deleteTimeEntry}
              />
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                {clients.length === 0 ? (
                  <p>No clients added yet. Add your first client using the sidebar.</p>
                ) : showArchived ? (
                  <p>Select an archived client from the sidebar to view their timer.</p>
                ) : (
                  <p>Select a client from the sidebar to view their timer.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Add note dialog */}
        {showNoteDialog && selectedClient && (
          <AddNoteDialog
            onSave={addNoteToEntry}
            onCancel={() => {
              setActiveEntryId(null)
              setShowNoteDialog(false)
            }}
          />
        )}

        <ToastViewport />
      </div>
    </ToastProvider>
  )
}
