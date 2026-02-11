'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import {
  CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  Phone,
  MapPin,
  RefreshCw,
  MoreHorizontal,
  Bell,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { getCalendarEvents, createCalendarEvent } from "@/lib/actions/calendar"

// Internal UI Type
interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  type: "meeting" | "call" | "task" | "reminder"
  prospect?: string
  location?: string
  isOnline: boolean
}

const eventTypeConfig = {
  meeting: { label: "Réunion", color: "bg-blue-500", icon: Video },
  call: { label: "Appel", color: "bg-green-500", icon: Phone },
  task: { label: "Tâche", color: "bg-orange-500", icon: Clock },
  reminder: { label: "Rappel", color: "bg-purple-500", icon: Bell }
}

const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8h to 19h

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<"week" | "day">("week")

  // Real data state
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "meeting",
    start: "",
    end: "",
    description: "",
    prospect: ""
  })

  // Fetch Data
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true)
      // Fetch a bit more than just the week to cover month view or navigations
      const start = startOfMonth(subWeeks(currentDate, 1))
      const end = endOfMonth(addWeeks(currentDate, 1))

      const { data, error } = await getCalendarEvents(start, end)
      if (data) {
        const mapped: CalendarEvent[] = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          start: new Date(d.start_time),
          end: new Date(d.end_time),
          type: (['meeting', 'call', 'task', 'reminder'].includes(d.event_type) ? d.event_type : 'meeting') as any,
          isOnline: false, // Could infer from location
          location: d.location
        }))
        setEvents(mapped)
      } else if (error) {
        console.error(error)
        toast.error("Impossible de charger le calendrier")
      }
      setIsLoading(false)
    }
    fetchEvents()
  }, [currentDate])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => direction > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1))
  }

  const handleCreate = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast.error("Veuillez remplir le titre et les dates")
      return
    }

    setIsCreating(true)
    const { data, error } = await createCalendarEvent({
      title: newEvent.title,
      description: newEvent.description,
      event_type: newEvent.type as any,
      start_time: newEvent.start,
      end_time: newEvent.end,
      status: 'confirmed'
    })

    if (error) {
      toast.error("Erreur lors de la création")
    } else if (data) {
      toast.success("Événement ajouté")
      setIsCreateOpen(false)
      setNewEvent({ title: "", type: "meeting", start: "", end: "", description: "", prospect: "" })

      // Optimistic update
      const createdEvent: CalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        start: new Date(data.start_time),
        end: new Date(data.end_time),
        type: (['meeting', 'call', 'task', 'reminder'].includes(data.event_type) ? data.event_type : 'meeting') as any,
        isOnline: false,
      }
      setEvents(prev => [...prev, createdEvent])
    }
    setIsCreating(false)
  }

  // --- Helpers ---
  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.start, date))
  }

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.getHours()
    const startMinutes = event.start.getMinutes()
    const endHour = event.end.getHours()
    const endMinutes = event.end.getMinutes()

    const top = ((startHour - 8) * 60 + startMinutes) * (60 / 60)
    let height = ((endHour - startHour) * 60 + (endMinutes - startMinutes)) * (60 / 60)

    // Minimum visual height
    height = Math.max(height, 30)

    // Bounds check (simply clip for now if out of 8-20h view)
    const topPx = Math.max(0, top)

    return { top: `${topPx}px`, height: `${height}px` }
  }

  const todaysEvents = getEventsForDay(new Date())
  const upcomingEvents = events
    .filter(e => e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Calendrier</h1>
          <p className="text-muted-foreground">Planifiez vos rendez-vous et synchronisez avec Google Calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Synchroniser calendrier
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel événement</DialogTitle>
                <DialogDescription>
                  Créer un nouvel événement dans votre calendrier
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Ex: Réunion avec client..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(val) => setNewEvent({ ...newEvent, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Réunion</SelectItem>
                        <SelectItem value="call">Appel</SelectItem>
                        <SelectItem value="task">Tâche</SelectItem>
                        <SelectItem value="reminder">Rappel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prospect</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Bientôt disponible..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Jean Dupont</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Détails de l'événement..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* Sync Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <CalendarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Google Calendar</h3>
                  <Badge className="bg-green-100 text-green-700">Synchronisé</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dernière synchronisation: il y a 2 minutes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{todaysEvents.length}</p>
                <p className="text-muted-foreground">Aujourd'hui</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{upcomingEvents.length}</p>
                <p className="text-muted-foreground">Cette semaine</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-lg font-semibold">
                    {format(weekStart, "MMMM yyyy", { locale: fr })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("week")}
                  >
                    Semaine
                  </Button>
                  <Button
                    variant={view === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("day")}
                  >
                    Jour
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Aujourd'hui
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r" />
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isSameDay(day, new Date()) && "bg-primary/5"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE", { locale: fr })}
                    </p>
                    <p className={cn(
                      "text-lg font-semibold",
                      isSameDay(day, new Date()) && "text-primary"
                    )}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative overflow-auto max-h-[600px]">
                <div className="grid grid-cols-8 min-h-[720px]">
                  {/* Time Labels */}
                  <div className="border-r">
                    {hours.map((hour) => (
                      <div key={hour} className="h-[60px] border-b px-2 py-1 text-xs text-muted-foreground">
                        {hour}:00
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="relative border-r last:border-r-0">
                      {hours.map((hour) => (
                        <div key={hour} className="h-[60px] border-b" />
                      ))}
                      {/* Events */}
                      {getEventsForDay(day).map((event) => {
                        const position = getEventPosition(event)
                        const config = eventTypeConfig[event.type]
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "absolute left-1 right-1 rounded-md p-1.5 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
                              config.color
                            )}
                            style={position}
                          >
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="opacity-80 truncate">
                              {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prochains événements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => {
                const config = eventTypeConfig[event.type]
                const EventIcon = config.icon
                return (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-white shrink-0",
                      config.color
                    )}>
                      <EventIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.start, "EEE d MMM, HH:mm", { locale: fr })}
                      </p>
                      {event.prospect && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />
                          {event.prospect}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Légende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(eventTypeConfig).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded", config.color)} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{config.label}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
