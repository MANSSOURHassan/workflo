'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
// import { useDebounce } from '@/hooks/use-debounce'; // Assuming I have this, or I'll implement simple debounce

export function SearchPageInput() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') || ''
    const [value, setValue] = useState(initialQuery)

    // Custom simple useDebounce since I don't know if the hook exists
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, 500)
        return () => clearTimeout(handler)
    }, [value])

    useEffect(() => {
        if (debouncedValue === initialQuery) return

        const params = new URLSearchParams(searchParams)
        if (debouncedValue) {
            params.set('q', debouncedValue)
        } else {
            params.delete('q')
        }
        router.replace(`/dashboard/search?${params.toString()}`)
    }, [debouncedValue, router, searchParams, initialQuery])

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                className="pl-10 h-12 text-lg"
                placeholder="Recherchez des prospects, deals, campagnes..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
            />
        </div>
    )
}
