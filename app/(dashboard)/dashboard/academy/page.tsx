'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap, Play, Clock, CheckCircle2, BookOpen,
  Video, Award, Users, ChevronRight, Loader2, ArrowLeft,
  Lock, PlayCircle, FileText, ChevronDown, ChevronUp, Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'

interface Lesson {
  id: string
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order_index: number
  is_published: boolean
  completed?: boolean
}

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

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`
  }
  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`
  return url // Direct URL (mp4, etc.)
}

// ─── Course Viewer ──────────────────────────────────────────────────────────
function CourseViewer({
  course,
  onBack,
  userId
}: {
  course: Course
  onBack: () => void
  userId: string
}) {
  const supabase = createClient()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: lessonsData } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index')

      const { data: progressData } = await supabase
        .from('academy_user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', course.id)

      const completedIds = new Set((progressData || []).map(p => p.lesson_id))
      const withProgress = (lessonsData || []).map(l => ({ ...l, completed: completedIds.has(l.id) }))
      setLessons(withProgress)

      // Auto-select first uncompleted lesson
      const firstUncompleted = withProgress.find(l => !l.completed) || withProgress[0]
      if (firstUncompleted) setActiveLesson(firstUncompleted)
      setLoading(false)
    }
    load()
  }, [course.id])

  async function markComplete() {
    if (!activeLesson || activeLesson.completed) return
    setMarking(true)
    try {
      const { error } = await supabase.from('academy_user_progress').insert({
        user_id: userId,
        course_id: course.id,
        lesson_id: activeLesson.id,
        status: 'completed',
      })
      if (error && !error.message.includes('duplicate')) throw error

      setLessons(prev => prev.map(l =>
        l.id === activeLesson.id ? { ...l, completed: true } : l
      ))
      setActiveLesson(prev => prev ? { ...prev, completed: true } : prev)
      toast.success('Leçon marquée comme terminée !')

      // Auto-advance to next lesson
      const currentIndex = lessons.findIndex(l => l.id === activeLesson.id)
      const next = lessons[currentIndex + 1]
      if (next) setTimeout(() => setActiveLesson({ ...next }), 800)
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setMarking(false)
    }
  }

  const completedCount = lessons.filter(l => l.completed).length
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const embedUrl = activeLesson?.video_url ? getYoutubeEmbedUrl(activeLesson.video_url) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mt-1">
            <Badge className={levelColors[course.level] || 'bg-gray-100 text-gray-700'}>{course.level}</Badge>
            <span className="text-sm text-muted-foreground">{completedCount}/{lessons.length} leçons terminées</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{progress}%</p>
          <Progress value={progress} className="w-24 h-2 mt-1" />
        </div>
      </div>

      {/* Main viewer layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Video / Content player */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            {activeLesson ? (
              <>
                {/* Video */}
                {embedUrl ? (
                  <div className="relative aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={activeLesson.title}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center">
                    <GraduationCap className="h-20 w-20 text-primary/30 mb-4" />
                    <p className="text-muted-foreground text-sm">Aucune vidéo pour cette leçon</p>
                  </div>
                )}

                {/* Lesson info */}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{activeLesson.title}</CardTitle>
                      {activeLesson.duration && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activeLesson.duration}
                        </CardDescription>
                      )}
                    </div>
                    {activeLesson.completed ? (
                      <Badge className="bg-green-100 text-green-700 shrink-0">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Terminée
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={markComplete} disabled={marking} className="shrink-0">
                        {marking ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
                        Marquer comme terminée
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Lesson content */}
                {activeLesson.content && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {activeLesson.content}
                    </div>
                  </CardContent>
                )}
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-20">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Sélectionnez une leçon pour commencer</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Lesson list */}
        <Card className="h-fit">
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Programme du cours
            </CardTitle>
            <CardDescription>{lessons.length} leçons · {course.duration}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto">
              {lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground px-4">
                  <FileText className="h-10 w-10 mb-2 opacity-20" />
                  <p>Aucune leçon disponible</p>
                  <p className="text-xs mt-1 text-center">Les leçons seront ajoutées prochainement</p>
                </div>
              ) : (
                lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-b-0 hover:bg-muted/50 ${
                      activeLesson?.id === lesson.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                      ${lesson.completed
                        ? 'bg-green-100 text-green-600'
                        : activeLesson?.id === lesson.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'}`}>
                      {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${lesson.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                      )}
                    </div>
                    {lesson.video_url && <PlayCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Academy Page ──────────────────────────────────────────────────────
export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: coursesData } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at')

      const { data: progressData } = await supabase
        .from('academy_user_progress')
        .select('course_id, lesson_id')
        .eq('user_id', user.id)

      const coursesWithProgress = (coursesData || []).map(course => {
        const completedLessons = (progressData || []).filter(p => p.course_id === course.id).length
        const progress = course.lessons_count > 0
          ? Math.round((completedLessons / course.lessons_count) * 100) : 0
        return { ...course, progress }
      })
      setCourses(coursesWithProgress)

      // Webinars
      const { data: webinarsData } = await supabase
        .from('academy_webinars')
        .select('*, academy_webinar_registrations(count)')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(4)

      const { data: myRegs } = await supabase
        .from('academy_webinar_registrations')
        .select('webinar_id')
        .eq('user_id', user.id)

      setWebinars((webinarsData || []).map(w => ({
        id: w.id,
        title: w.title,
        scheduled_at: w.scheduled_at,
        speaker_name: w.speaker_name,
        registered_count: w.academy_webinar_registrations?.[0]?.count || 0,
        is_registered: (myRegs || []).some(r => r.webinar_id === w.id)
      })))
    } catch (error: any) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (webinarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Veuillez vous connecter'); return }
      const { error } = await supabase.from('academy_webinar_registrations')
        .insert({ user_id: user.id, webinar_id: webinarId })
      if (error) throw error
      toast.success('Inscription réussie !')
      setWebinars(prev => prev.map(w => w.id === webinarId ? { ...w, is_registered: true, registered_count: w.registered_count + 1 } : w))
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.info('Vous êtes déjà inscrit')
      } else {
        toast.error("Erreur lors de l'inscription")
      }
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

  // If a course is open, show the viewer
  if (activeCourse) {
    return (
      <CourseViewer
        course={activeCourse}
        onBack={() => { setActiveCourse(null); loadData() }}
        userId={userId}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Academy" 
        description="Apprenez à maîtriser votre CRM et découvrez les meilleures stratégies de vente avec nos formations."
      >
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Award className="mr-2 h-4 w-4 text-yellow-500" />
          {completedCourses} certifications
        </Badge>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Formations disponibles', value: courses.length, icon: BookOpen, color: 'bg-primary/10 text-primary' },
          { label: 'En cours', value: inProgressCourses, icon: Play, color: 'bg-blue-100 text-blue-600' },
          { label: 'Terminées', value: completedCourses, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
          { label: 'Certifications', value: completedCourses, icon: Award, color: 'bg-yellow-100 text-yellow-600' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume banner */}
      {inProgressCourses > 0 && courses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 1).map(course => (
        <Card key={course.id} className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Play className="h-7 w-7 text-primary fill-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Reprendre où vous en étiez</p>
                <h3 className="font-semibold">{course.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <Progress value={course.progress} className="flex-1 h-2" />
                  <span className="text-sm font-bold text-primary">{course.progress}%</span>
                </div>
              </div>
              <Button onClick={() => setActiveCourse(course)} className="shrink-0">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* All Courses */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-primary" />
          Toutes les formations
        </h2>
        {courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-14 w-14 text-muted-foreground/20 mb-4" />
              <p className="font-medium text-muted-foreground">Aucune formation disponible</p>
              <p className="text-sm text-muted-foreground mt-1">Les formations seront ajoutées prochainement</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-none shadow-md bg-card"
                onClick={() => setActiveCourse(course)}
              >
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <GraduationCap className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  {course.progress === 100 && (
                    <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={levelColors[course.level] || 'bg-gray-100 text-gray-700'}>{course.level}</Badge>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px]">{course.category}</Badge>
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{course.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                    <span className="flex items-center gap-1"><Video className="h-3 w-3" />{course.lessons_count} leçons</span>
                  </div>
                  {course.progress > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-medium">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="text-primary">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                      <Button
                        className="w-full mt-2"
                        size="sm"
                        variant={course.progress === 100 ? 'outline' : 'default'}
                        onClick={(e) => { e.stopPropagation(); setActiveCourse(course) }}
                      >
                        {course.progress === 100 ? (
                          <><CheckCircle2 className="mr-2 h-3 w-3 text-green-600" />Revoir</>
                        ) : (
                          <>Continuer<ChevronRight className="ml-1 h-3 w-3" /></>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setActiveCourse(course) }}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Commencer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Webinars */}
      {webinars.length > 0 && (
        <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 dark:to-background">
          <CardHeader className="border-b border-purple-100 dark:border-purple-900/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Prochains webinaires</CardTitle>
                <CardDescription>Sessions d'experts en direct</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {webinars.map((webinar) => (
                <div key={webinar.id} className="flex items-center justify-between p-4 rounded-xl border hover:border-purple-200 transition-colors gap-4 bg-white/60 dark:bg-black/20">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-white shadow-sm border border-purple-100" suppressHydrationWarning>
                      <span className="text-[10px] font-bold text-purple-600 uppercase">
                        {new Date(webinar.scheduled_at).toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {new Date(webinar.scheduled_at).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{webinar.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                        <Clock className="h-3 w-3" />
                        {new Date(webinar.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        <span>·</span>
                        <Users className="h-3 w-3" />
                        {webinar.speaker_name}
                      </div>
                    </div>
                  </div>
                  {webinar.is_registered ? (
                    <Button size="sm" variant="outline" className="border-green-200 text-green-600 shrink-0" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4" />Inscrit
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      onClick={() => handleRegister(webinar.id)}>
                      S'inscrire
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
