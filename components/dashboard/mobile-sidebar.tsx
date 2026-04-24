'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { navSections, bottomNavItems } from '@/components/dashboard/sidebar'

export function MobileSidebar({ customization }: { customization: any }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <SheetTitle className="sr-only">Menu Principal</SheetTitle>
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center">
            <img
              src={customization?.logo_url || "/logo.png"}
              alt={customization?.company_name || "Workflow CRM"}
              className="h-8 object-contain"
            />
          </Link>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-6">
            {navSections.map((section) => (
              <div key={section.name} className="space-y-2">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <section.icon className={cn("h-4 w-4", section.color)} />
                  {section.name}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border p-3 space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
