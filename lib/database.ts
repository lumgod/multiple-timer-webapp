import { supabase, isSupabaseConfigured } from "./supabase"
import type { Database } from "./supabase"

type Client = Database["public"]["Tables"]["clients"]["Row"]
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"]
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]
type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"]

export class DatabaseService {
  private static checkConfiguration() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }
  }

  private static validateUserId(userId: string) {
    if (!userId || typeof userId !== "string" || userId.length < 10) {
      throw new Error("Invalid user ID")
    }
  }

  private static sanitizeInput(input: string): string {
    if (typeof input !== "string") return ""
    return input.trim().slice(0, 1000) // Limit length and trim
  }

  private static validateHourlyRate(rate: number): number {
    if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 10000) {
      return 0 // Default to 0 for invalid rates
    }
    return Math.round(rate * 100) / 100 // Round to 2 decimal places
  }

  // Client operations
  static async getClients(userId: string): Promise<Client[]> {
    this.checkConfiguration()
    this.validateUserId(userId)

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000) // Reasonable limit

    if (error) throw error
    return data || []
  }

  static async createClient(client: ClientInsert): Promise<Client> {
    this.checkConfiguration()

    if (!client.user_id) throw new Error("User ID is required")
    this.validateUserId(client.user_id)

    // Sanitize and validate inputs
    const sanitizedClient = {
      ...client,
      name: this.sanitizeInput(client.name || ""),
      hourly_rate: this.validateHourlyRate(client.hourly_rate || 0),
    }

    if (!sanitizedClient.name) {
      throw new Error("Client name is required")
    }

    const { data, error } = await supabase.from("clients").insert(sanitizedClient).select().single()

    if (error) throw error
    return data
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    this.checkConfiguration()

    if (!id || typeof id !== "string") {
      throw new Error("Invalid client ID")
    }

    // Sanitize updates
    const sanitizedUpdates: any = { updated_at: new Date().toISOString() }

    if (updates.name !== undefined) {
      sanitizedUpdates.name = this.sanitizeInput(updates.name)
      if (!sanitizedUpdates.name) {
        throw new Error("Client name cannot be empty")
      }
    }

    if (updates.hourly_rate !== undefined) {
      sanitizedUpdates.hourly_rate = this.validateHourlyRate(updates.hourly_rate)
    }

    if (updates.archived !== undefined) {
      sanitizedUpdates.archived = Boolean(updates.archived)
    }

    const { data, error } = await supabase.from("clients").update(sanitizedUpdates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  static async deleteClient(id: string): Promise<void> {
    this.checkConfiguration()

    if (!id || typeof id !== "string") {
      throw new Error("Invalid client ID")
    }

    // First delete all time entries for this client
    await supabase.from("time_entries").delete().eq("client_id", id)

    // Then delete the client
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) throw error
  }

  // Time entry operations
  static async getTimeEntries(clientId: string): Promise<TimeEntry[]> {
    this.checkConfiguration()

    if (!clientId || typeof clientId !== "string") {
      throw new Error("Invalid client ID")
    }

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("client_id", clientId)
      .order("start_time", { ascending: false })
      .limit(10000) // Reasonable limit

    if (error) throw error
    return data || []
  }

  static async createTimeEntry(timeEntry: TimeEntryInsert): Promise<TimeEntry> {
    this.checkConfiguration()

    if (!timeEntry.user_id || !timeEntry.client_id) {
      throw new Error("User ID and Client ID are required")
    }

    this.validateUserId(timeEntry.user_id)

    // Validate start time
    const startTime = new Date(timeEntry.start_time)
    if (isNaN(startTime.getTime())) {
      throw new Error("Invalid start time")
    }

    // Ensure start time is not in the future (with 1 minute tolerance)
    const now = new Date()
    if (startTime.getTime() > now.getTime() + 60000) {
      throw new Error("Start time cannot be in the future")
    }

    const sanitizedEntry = {
      ...timeEntry,
      notes: timeEntry.notes ? this.sanitizeInput(timeEntry.notes) : null,
    }

    const { data, error } = await supabase.from("time_entries").insert(sanitizedEntry).select().single()

    if (error) throw error
    return data
  }

  static async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    this.checkConfiguration()

    if (!id || typeof id !== "string") {
      throw new Error("Invalid time entry ID")
    }

    const sanitizedUpdates: any = { updated_at: new Date().toISOString() }

    if (updates.end_time !== undefined) {
      const endTime = new Date(updates.end_time)
      if (isNaN(endTime.getTime())) {
        throw new Error("Invalid end time")
      }
      sanitizedUpdates.end_time = updates.end_time
    }

    if (updates.notes !== undefined) {
      sanitizedUpdates.notes = updates.notes ? this.sanitizeInput(updates.notes) : null
    }

    const { data, error } = await supabase.from("time_entries").update(sanitizedUpdates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  static async deleteTimeEntry(id: string): Promise<void> {
    this.checkConfiguration()

    if (!id || typeof id !== "string") {
      throw new Error("Invalid time entry ID")
    }

    const { error } = await supabase.from("time_entries").delete().eq("id", id)

    if (error) throw error
  }

  // Get all time entries for a user (for exports)
  static async getAllTimeEntries(userId: string): Promise<(TimeEntry & { client_name: string })[]> {
    this.checkConfiguration()
    this.validateUserId(userId)

    const { data, error } = await supabase
      .from("time_entries")
      .select(`
        *,
        clients!inner(name)
      `)
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(50000) // Reasonable limit for exports

    if (error) throw error

    return (data || []).map((entry) => ({
      ...entry,
      client_name: (entry.clients as any).name,
    }))
  }
}
