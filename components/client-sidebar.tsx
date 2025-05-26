"use client"

import { PlusCircle, Search, X, Clock, Trash2, Archive, RefreshCw, DollarSign, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

interface Client {
  id: string
  name: string
  timeEntries: any[]
  archived?: boolean
  hourlyRate: number
}

interface ClientSidebarProps {
  clients: Client[]
  selectedClientId: string | null
  onSelectClient: (id: string) => void
  onToggleArchive: (id: string) => void
  onDeleteClient: (id: string) => void
  onAddClient: () => void
  onUpdateClient: (id: string, updates: { name?: string; hourlyRate?: number }) => void
  newClientName: string
  setNewClientName: (name: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showArchived: boolean
  setShowArchived: (show: boolean) => void
  activeClientCount: number
  archivedClientCount: number
  hasActiveTimer: (client: Client) => boolean
  calculateTotalTime: (client: Client) => number
  formatTime: (milliseconds: number) => string
}

export function ClientSidebar({
  clients,
  selectedClientId,
  onSelectClient,
  onToggleArchive,
  onDeleteClient,
  onAddClient,
  onUpdateClient,
  newClientName,
  setNewClientName,
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
  activeClientCount,
  archivedClientCount,
  hasActiveTimer,
  calculateTotalTime,
  formatTime,
}: ClientSidebarProps) {
  const [newClientRate, setNewClientRate] = useState("0")
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editRate, setEditRate] = useState("")

  const handleAddClient = () => {
    if (newClientName.trim()) {
      onAddClient()
      setNewClientRate("0")
    }
  }

  const startEditing = (client: Client) => {
    setEditingClient(client.id)
    setEditName(client.name)
    setEditRate(client.hourlyRate.toString())
  }

  const saveEdit = () => {
    if (editingClient && editName.trim()) {
      onUpdateClient(editingClient, {
        name: editName.trim(),
        hourlyRate: Number.parseFloat(editRate) || 0,
      })
      setEditingClient(null)
    }
  }

  const cancelEdit = () => {
    setEditingClient(null)
    setEditName("")
    setEditRate("")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const calculateEarnings = (client: Client) => {
    const totalTimeMs = calculateTotalTime(client)
    const hours = totalTimeMs / (1000 * 60 * 60)
    return hours * client.hourlyRate
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Clients</h2>

        {/* Add new client - only show when viewing active clients */}
        {!showArchived && (
          <div className="flex flex-col gap-2 mb-4">
            <Input
              placeholder="Enter client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddClient()
              }}
            />
            <div className="flex gap-2">
              <div className="flex items-center flex-1">
                <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                <Input
                  type="number"
                  placeholder="Rate/hour"
                  value={newClientRate}
                  onChange={(e) => setNewClientRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddClient()
                  }}
                  className="text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <Button onClick={handleAddClient} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        )}

        {/* Search clients */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 flex items-center pr-3">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Active/Archived toggle */}
        <div className="flex justify-between items-center mb-2">
          <Button
            variant={showArchived ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => setShowArchived(false)}
          >
            Active ({activeClientCount})
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setShowArchived(true)}
          >
            Archived ({archivedClientCount})
          </Button>
        </div>
      </div>

      {/* Client list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {clients.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              {searchQuery
                ? "No clients match your search."
                : showArchived
                  ? "No archived clients."
                  : "No active clients."}
            </div>
          ) : (
            <div className="space-y-1">
              {clients.map((client) => {
                const isActive = hasActiveTimer(client)
                const totalTime = formatTime(calculateTotalTime(client))
                const earnings = calculateEarnings(client)
                const isEditing = editingClient === client.id

                return (
                  <div
                    key={client.id}
                    className={`group rounded-md ${
                      selectedClientId === client.id ? "bg-accent" : ""
                    } ${isEditing ? "bg-accent/50" : ""}`}
                  >
                    {isEditing ? (
                      <div className="p-3 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Client name"
                          className="text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            placeholder="Hourly rate"
                            className="text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit} className="flex-1">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between hover:bg-accent/50 transition-colors">
                        <button
                          onClick={() => onSelectClient(client.id)}
                          className="flex-1 text-left px-3 py-2 flex flex-col"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span
                                className={`font-medium truncate ${client.archived ? "text-muted-foreground" : ""}`}
                              >
                                {client.name}
                              </span>
                              {isActive && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1 opacity-70" />
                              {totalTime}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(client.hourlyRate)}/hr
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {formatCurrency(earnings)}
                            </span>
                          </div>
                        </button>
                        <div className="flex">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(client)
                            }}
                            className="p-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit client"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleArchive(client.id)
                            }}
                            className="p-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            title={client.archived ? "Unarchive client" : "Archive client"}
                          >
                            {client.archived ? <RefreshCw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                confirm(
                                  `Are you sure you want to permanently delete "${client.name}"? This will remove all time entries for this client.`,
                                )
                              ) {
                                onDeleteClient(client.id)
                              }
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
