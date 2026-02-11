'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AIInsightsProps {
  avgScore: number
  highScoreCount: number
  totalProspects: number
}

export function AIInsights({ avgScore, highScoreCount, totalProspects }: AIInsightsProps) {
  const conversionPotential = totalProspects > 0 
    ? Math.round((highScoreCount / totalProspects) * 100) 
    : 0

  const insights = [
    {
      title: 'Score Moyen',
      description: avgScore >= 60 
        ? 'Votre base de prospects est de bonne qualité'
        : avgScore >= 40
        ? 'Qualité moyenne - Enrichissez vos données'
        : 'Qualité faible - Améliorez la qualification',
      value: avgScore,
      color: avgScore >= 60 ? 'text-green-500' : avgScore >= 40 ? 'text-yellow-500' : 'text-red-500',
      icon: avgScore >= 60 ? CheckCircle2 : avgScore >= 40 ? AlertCircle : AlertCircle
    },
    {
      title: 'Potentiel de Conversion',
      description: `${highScoreCount} prospects avec un score >= 70`,
      value: conversionPotential,
      color: conversionPotential >= 30 ? 'text-green-500' : conversionPotential >= 15 ? 'text-yellow-500' : 'text-red-500',
      icon: Target
    }
  ]

  const recommendations = [
    {
      condition: avgScore < 50,
      text: 'Enrichissez les données de vos prospects (LinkedIn, téléphone, entreprise)',
      priority: 'high'
    },
    {
      condition: highScoreCount < 5,
      text: 'Concentrez-vous sur la qualification de vos meilleurs leads',
      priority: 'medium'
    },
    {
      condition: totalProspects < 20,
      text: 'Augmentez votre base de prospects via l\'import ou la prospection',
      priority: 'low'
    },
    {
      condition: conversionPotential > 30,
      text: 'Excellent pipeline ! Lancez une campagne ciblée',
      priority: 'success'
    }
  ].filter(r => r.condition)

  return (
    <div className="space-y-6">
      {/* AI Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyse IA
          </CardTitle>
          <CardDescription>
            Insights sur la qualité de vos leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {insights.map((insight) => (
            <div key={insight.title} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{insight.title}</span>
                <span className={`text-lg font-bold ${insight.color}`}>
                  {insight.value}%
                </span>
              </div>
              <Progress 
                value={insight.value} 
                className={`h-2 ${
                  insight.color === 'text-green-500' ? '[&>div]:bg-green-500' :
                  insight.color === 'text-yellow-500' ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-red-500'
                }`}
              />
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    rec.priority === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-muted'
                  }`}
                >
                  {rec.priority === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                      rec.priority === 'high' ? 'text-red-500' :
                      rec.priority === 'medium' ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`} />
                  )}
                  <p className="text-sm">{rec.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Comment le score est calculé</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Complétude des données (30 pts)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Qualité de la source (20 pts)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Progression du statut (25 pts)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Engagement récent (15 pts)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Tags et notes (10 pts)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
