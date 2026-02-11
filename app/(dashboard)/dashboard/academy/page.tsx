'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap,
  Play,
  Clock,
  CheckCircle2,
  BookOpen,
  Video,
  Award,
  Users,
  Star,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  lessons_count: number
  progress: number
  level: string
  category: string
  thumbnail_url: string | null
}

interface Webinar {
  id: string
  title: string
  scheduled_at: string
  speaker_name: string
  registered_count: number
  is_registered: boolean
}

const levelColors: Record<string, string> = {
  'Debutant': 'bg-green-100 text-green-700',
  'Intermediaire': 'bg-yellow-100 text-yellow-700',
  'Avance': 'bg-red-100 text-red-700',
}

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)

      if (coursesError) throw coursesError

      // Load progress
      let progressData: any[] = []
      try {
        const { data } = await supabase
          .from('academy_user_progress')
          .select('course_id, lesson_id')
          .eq('user_id', user.id)
        progressData = data || []
      } catch (e) {
        console.warn('academy_user_progress table might be missing')
      }

      // Calculate progress per course
      const coursesWithProgress = (coursesData || []).map(course => {
        const completedLessons = progressData?.filter(p => p.course_id === course.id).length || 0
        const progress = course.lessons_count > 0
          ? Math.round((completedLessons / course.lessons_count) * 100)
          : 0

        return {
          ...course,
          progress
        }
      })

      setCourses(coursesWithProgress)

      // Load webinars
      const { data: webinarsData, error: webinarsError } = await supabase
        .from('academy_webinars')
        .select(`
          *,
          academy_webinar_registrations (
            count
          )
        `)
        .order('scheduled_at', { ascending: true })

      if (webinarsError) {
        console.warn('Webinars table might be missing or empty:', webinarsError)
      }

      // Load my registrations
      let myRegs: any[] = []
      try {
        const { data } = await supabase
          .from('academy_webinar_registrations')
          .select('webinar_id')
          .eq('user_id', user.id)
        myRegs = data || []
      } catch (e) {
        console.warn('academy_webinar_registrations table might be missing')
      }

      const formattedWebinars = (webinarsData || []).map(w => ({
        id: w.id,
        title: w.title,
        scheduled_at: w.scheduled_at,
        speaker_name: w.speaker_name,
        registered_count: w.academy_webinar_registrations?.[0]?.count || 0,
        is_registered: myRegs?.some(r => r.webinar_id === w.id) || false
      }))

      setWebinars(formattedWebinars)

    } catch (error: any) {
      console.error('Error loading academy data:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error
      })
      toast.error("Erreur lors du chargement des formations")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (webinarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Veuillez vous connecter")
        return
      }

      const { error } = await supabase
        .from('academy_webinar_registrations')
        .insert({ user_id: user.id, webinar_id: webinarId })

      if (error) throw error

      toast.success("Inscription reussie !")
      loadData()
    } catch (error: any) {
      toast.error("Erreur lors de l'inscription")
    }
  }

  const completedCourses = courses.filter(c => c.progress === 100).length
  const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement de l'Academy...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Academy</h1>
          <p className="text-muted-foreground">
            Formez-vous et developpez vos competences commerciales
          </p>
        </div>
        <Button variant="outline">
          <Award className="mr-2 h-4 w-4" />
          Mes certifications
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Cours disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCourses}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCourses}</p>
                <p className="text-sm text-muted-foreground">Termines</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCourses > 0 ? 1 : 0}</p>
                <p className="text-sm text-muted-foreground">Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning */}
      {inProgressCourses > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Reprendre votre formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {courses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 1).map(course => (
                <div key={course.id} className="flex-1 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20">
                    <Play className="h-8 w-8 text-primary fill-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Progress value={course.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                  </div>
                  <Button className="shadow-lg shadow-primary/20">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Continuer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Tous les cours
          </h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
            Voir tout
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-none shadow-md bg-card">
              <div className="relative h-40 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <GraduationCap className="h-16 w-16 text-primary/40" />
                {course.progress === 100 && (
                  <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={levelColors[course.level] || 'bg-gray-100 text-gray-700'}>
                    {course.level}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{course.category}</Badge>
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">{course.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {course.lessons_count} lecons
                  </span>
                </div>
                {course.progress > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="text-primary">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5" />
                    <div className="pt-2">
                      {course.progress === 100 ? (
                        <Button variant="outline" className="w-full border-green-200 bg-green-50/30 text-green-700 hover:bg-green-50" size="sm">
                          <CheckCircle2 className="mr-2 h-3 w-3" />
                          Termine
                        </Button>
                      ) : (
                        <Button className="w-full" size="sm">
                          Continuer
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors" size="sm" variant="outline">
                    <Play className="mr-2 h-3 w-3" />
                    Commencer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Webinars */}
      <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 dark:to-background">
        <CardHeader className="border-b border-purple-100 dark:border-purple-900/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Prochains webinaires</CardTitle>
                <CardDescription>Inscrivez-vous aux sessions d'experts en direct</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">Voir tous</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {webinars.map((webinar) => (
              <div key={webinar.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-purple-50 dark:border-purple-900/20 bg-white/50 dark:bg-black/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-white shadow-sm border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">
                    <span className="text-[10px] font-bold text-purple-600 uppercase">
                      {new Date(webinar.scheduled_at).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(webinar.scheduled_at).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground line-clamp-1">{webinar.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(webinar.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {webinar.speaker_name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-purple-600">{webinar.registered_count} inscrits</span>
                    <div className="flex -space-x-2 mt-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center overflow-hidden">
                          <Users className="h-3 w-3 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  {webinar.is_registered ? (
                    <Button size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Inscrit
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleRegister(webinar.id)}>S'inscrire</Button>
                  )}
                </div>
              </div>
            ))}
            {webinars.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun webinaire prévu pour le moment</p>
                <Button variant="link" className="text-primary mt-2">Dites-nous ce que vous aimeriez apprendre</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
