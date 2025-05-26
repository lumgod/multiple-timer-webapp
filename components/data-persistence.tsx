"use client"

import { useState } from "react"
import { Download, Upload, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

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
}

interface DataPersistenceProps {
  clients: Client[]
  onExport: () => string
  onImport: (data: string) => void
  onReset: () => void
}

export function DataPersistence({ clients, onExport, onImport, onReset }: DataPersistenceProps) {
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")

  const handleExportJSON = () => {
    const data = onExport()

    // Create a download link
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-tracker-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Data exported successfully",
      description: "Your time tracking data has been exported to a JSON file.",
    })
  }

  const handleExportCSV = () => {
    // Generate CSV content
    let csvContent = "Client Name,Status,Date,Start Time,End Time,Duration,Notes\n"

    clients.forEach((client) => {
      const clientStatus = client.archived ? "Archived" : "Active"

      client.timeEntries.forEach((entry) => {
        if (entry.endTime) {
          // Format dates
          const startDate = new Date(entry.startTime)
          const endDate = new Date(entry.endTime)
          const date = startDate.toLocaleDateString()
          const startTime = startDate.toLocaleTimeString()
          const endTime = endDate.toLocaleTimeString()

          // Calculate duration
          const durationMs = entry.endTime - entry.startTime
          const durationHours = Math.floor(durationMs / 3600000)
          const durationMinutes = Math.floor((durationMs % 3600000) / 60000)
          const durationSeconds = Math.floor((durationMs % 60000) / 1000)
          const duration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes
            .toString()
            .padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`

          // Escape notes for CSV
          const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : ""

          // Add row
          csvContent += `"${client.name}",${clientStatus},${date},${startTime},${endTime},${duration},${notes}\n`
        }
      })
    })

    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-tracker-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "CSV exported successfully",
      description: "Your time tracking data has been exported to a CSV file.",
    })
  }

  const handleExportMonthlyCSV = () => {
    // Get current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthName = now.toLocaleString("default", { month: "long" })

    // Generate CSV content
    let csvContent = "Client Name,Date,Start Time,End Time,Duration,Notes\n"
    let totalDuration = 0

    clients.forEach((client) => {
      if (!client.archived) {
        // Filter entries for current month
        const monthEntries = client.timeEntries.filter((entry) => {
          if (!entry.endTime) return false
          const entryDate = new Date(entry.startTime)
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
        })

        // Skip client if no entries this month
        if (monthEntries.length === 0) return

        let clientTotalDuration = 0

        monthEntries.forEach((entry) => {
          // Format dates
          const startDate = new Date(entry.startTime)
          const endDate = new Date(entry.endTime as number)
          const date = startDate.toLocaleDateString()
          const startTime = startDate.toLocaleTimeString()
          const endTime = endDate.toLocaleTimeString()

          // Calculate duration
          const durationMs = (entry.endTime as number) - entry.startTime
          clientTotalDuration += durationMs
          totalDuration += durationMs

          const durationHours = Math.floor(durationMs / 3600000)
          const durationMinutes = Math.floor((durationMs % 3600000) / 60000)
          const durationSeconds = Math.floor((durationMs % 60000) / 1000)
          const duration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes
            .toString()
            .padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`

          // Escape notes for CSV
          const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : ""

          // Add row
          csvContent += `"${client.name}",${date},${startTime},${endTime},${duration},${notes}\n`
        })

        // Add client total
        const clientTotalHours = Math.floor(clientTotalDuration / 3600000)
        const clientTotalMinutes = Math.floor((clientTotalDuration % 3600000) / 60000)
        const clientTotalSeconds = Math.floor((clientTotalDuration % 60000) / 1000)
        const clientTotal = `${clientTotalHours.toString().padStart(2, "0")}:${clientTotalMinutes
          .toString()
          .padStart(2, "0")}:${clientTotalSeconds.toString().padStart(2, "0")}`

        csvContent += `"${client.name} TOTAL",,,,${clientTotal},\n\n`
      }
    })

    // Add grand total
    const totalHours = Math.floor(totalDuration / 3600000)
    const totalMinutes = Math.floor((totalDuration % 3600000) / 60000)
    const totalSeconds = Math.floor((totalDuration % 60000) / 1000)
    const total = `${totalHours.toString().padStart(2, "0")}:${totalMinutes
      .toString()
      .padStart(2, "0")}:${totalSeconds.toString().padStart(2, "0")}`

    csvContent += `"GRAND TOTAL",,,,${total},\n`

    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-tracker-${monthName}-${currentYear}.csv`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Monthly report exported",
      description: `Your time tracking report for ${monthName} ${currentYear} has been exported to a CSV file.`,
    })
  }

  // Replace the handleImport function with this simplified version that only imports client lists
  const handleImport = () => {
    try {
      const trimmedData = importData.trim()

      // Check if it's CSV format (simple heuristic)
      if (trimmedData.includes(",") && !trimmedData.startsWith("{") && !trimmedData.startsWith("[")) {
        // Parse as CSV
        const lines = trimmedData
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)
        const clientsToImport = []

        // Check if first line is a header
        const firstLine = lines[0].toLowerCase()
        const hasHeader = firstLine.includes("name") || firstLine.includes("client") || firstLine.includes("rate")
        const startIndex = hasHeader ? 1 : 0

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i]
          const columns = line.split(",").map((col) => col.trim().replace(/^["']|["']$/g, "")) // Remove quotes

          if (columns.length >= 1 && columns[0]) {
            const clientName = columns[0]
            const hourlyRate = columns.length >= 2 ? Number.parseFloat(columns[1]) || 0 : 0

            clientsToImport.push({
              name: clientName,
              hourlyRate: hourlyRate,
            })
          }
        }

        if (clientsToImport.length === 0) {
          throw new Error("No valid clients found in CSV")
        }

        // Import the clients
        onImport(JSON.stringify({ clients: clientsToImport }))
        setShowImportDialog(false)
        setImportData("")

        toast({
          title: "Clients imported from CSV",
          description: `Successfully imported ${clientsToImport.length} clients.`,
        })
      } else {
        // Try to parse as JSON (existing functionality)
        const importedData = JSON.parse(importData)

        // Check if it's an array (simple client list) or the full backup format
        let clientsToImport = []

        if (Array.isArray(importedData)) {
          // Direct array of clients
          clientsToImport = importedData
        } else if (importedData.clients && Array.isArray(importedData.clients)) {
          // Full backup format - extract just the clients
          clientsToImport = importedData.clients
        } else {
          throw new Error("Invalid format")
        }

        // Process clients - keep only the client names and rates, create new IDs
        const newClients = clientsToImport.map((client) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: client.name,
          hourlyRate: client.hourlyRate || client.hourly_rate || 0,
          timeEntries: [],
          archived: false,
        }))

        // Import the clients
        onImport(JSON.stringify({ clients: newClients }))
        setShowImportDialog(false)
        setImportData("")

        toast({
          title: "Client list imported",
          description: `Successfully imported ${newClients.length} clients.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Please check your file format. Supported formats: CSV (Name,Rate) or JSON client list.",
      })
    }
  }

  const handleReset = () => {
    if (
      confirm("Are you sure you want to reset all data? This will permanently delete all clients and time entries.")
    ) {
      onReset()
      toast({
        title: "Data reset complete",
        description: "All time tracking data has been cleared.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExportJSON}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportMonthlyCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Monthly Report
        </Button>
        {/* Update the button text to be clearer */}
        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Clients
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {/* Update the dialog title and placeholder */}
            <DialogTitle>Import Client List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Update the textarea placeholder */}
            <Textarea
              placeholder={`Paste your client data here...

CSV Format:
Client Name, Hourly Rate
Acme Corp, 75
Tech Startup, 100
Local Business, 50

Or JSON Format:
[{"name":"Client 1","hourlyRate":75}]`}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
