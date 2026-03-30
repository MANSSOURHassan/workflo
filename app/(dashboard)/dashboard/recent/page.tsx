import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText } from 'lucide-react'
import { getRecentActivity } from '@/lib/actions/dashboard'
import { actionIcons, actionLabels, formatRelativeTime } from '@/components/dashboard/activity-constants'
import { cn } from '@/lib/utils'

export default async function RecentActivityPage() {
    const { data: activities, error } = await getRecentActivity(50)

    return (
        <div className="space-y-6">

            <Card>
                <CardContent className="pt-6">
                    {!activities || activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p>Aucune activité récente.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {activities.map((item, index) => {
                                const Icon = actionIcons[item.action] || FileText
                                const prospectName = item.metadata?.prospect
                                    ? item.metadata.prospect.first_name && item.metadata.prospect.last_name
                                        ? `${item.metadata.prospect.first_name} ${item.metadata.prospect.last_name}`
                                        : item.metadata.prospect.company || 'un prospect'
                                    : null

                                // Group by date logic could be added here, but simple list for now
                                return (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-colors group-hover:border-primary/50",
                                                item.type === 'audit' ? "border-primary/20 bg-primary/5" : "border-muted"
                                            )}>
                                                <Icon className={cn(
                                                    "h-5 w-5",
                                                    item.type === 'audit' ? "text-primary" : "text-muted-foreground"
                                                )} />
                                            </div>
                                            {index < activities.length - 1 && (
                                                <div className="w-[2px] h-full bg-muted/30 mt-2 mb-[-10px]" />
                                            )}
                                        </div>

                                        <div className="flex-1 pb-8">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                                    item.type === 'audit' ? "bg-primary/10 text-primary border-primary/10" : "bg-muted text-muted-foreground border-transparent"
                                                )}>
                                                    {actionLabels[item.action] || item.action}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {formatRelativeTime(item.created_at)}
                                                </span>
                                            </div>

                                            <h3 className="font-semibold text-foreground">
                                                {item.title}
                                            </h3>

                                            {item.description && item.type === 'audit' && (
                                                <p className="text-sm text-muted-foreground mt-1 italic">
                                                    {item.description}
                                                </p>
                                            )}

                                            {prospectName && item.type === 'activity' && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">Concernant :</span>
                                                    <Link href={`/dashboard/prospects/${item.metadata?.prospect?.id}`} className="text-sm font-medium text-primary hover:underline">
                                                        {prospectName}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
