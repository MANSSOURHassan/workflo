'use client'

import React from 'react'

interface FormattedMessageProps {
  content: string
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  // Support basique pour Markdown: Gras (**), Italique (*), Listes (-), Blocs de code (```)
  
  const lines = content.split('\n')
  let inList = false
  let inCode = false
  
  const elements: React.ReactNode[] = []
  let currentListItems: React.ReactNode[] = []
  let currentCodeLines: string[] = []

  lines.forEach((line, index) => {
    // 1. Détection de bloc de code
    if (line.trim().startsWith('```')) {
      if (inCode) {
        // Fin de bloc de code
        elements.push(
          <div key={`code-${index}`} className="my-3 p-3 bg-slate-900 rounded-lg overflow-x-auto font-mono text-xs text-cyan-400 border border-slate-700">
            <pre>{currentCodeLines.join('\n')}</pre>
          </div>
        )
        currentCodeLines = []
        inCode = false
      } else {
        // Début de bloc de code
        inCode = true
      }
      return
    }

    if (inCode) {
      currentCodeLines.push(line)
      return
    }

    // 2. Gestion des listes
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2)
      currentListItems.push(
        <li key={`li-${index}`} className="ml-4 list-disc text-sm mb-1 last:mb-0">
          {renderInline(text)}
        </li>
      )
      inList = true
      return
    } else if (inList) {
      // Fin de liste détectée
      elements.push(<ul key={`ul-${index}`} className="my-2 space-y-1">{[...currentListItems]}</ul>)
      currentListItems = []
      inList = false
    }

    // 3. Lignes vides ou paragraphes
    if (line.trim() === '') {
      elements.push(<div key={`empty-${index}`} className="h-2" />)
    } else {
      elements.push(
        <p key={`p-${index}`} className="text-sm leading-relaxed mb-2 last:mb-0">
          {renderInline(line)}
        </p>
      )
    }
  })

  // Nettoyage final
  if (inList) {
    elements.push(<ul key="final-ul" className="my-2 space-y-1">{currentListItems}</ul>)
  }
  if (inCode) {
    elements.push(
      <div key="final-code" className="my-3 p-3 bg-slate-900 rounded-lg overflow-x-auto font-mono text-xs text-cyan-400 border border-slate-700">
        <pre>{currentCodeLines.join('\n')}</pre>
      </div>
    )
  }

  return <div className="formatted-message prose prose-sm dark:prose-invert max-w-none">{elements}</div>
}

function renderInline(text: string) {
  // Regex simple pour le gras et l'italique
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  
  return parts.map((part, i) => {
    // Gras
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-inherit opacity-90">{part.slice(2, -2)}</strong>
    }
    // Italique
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic opacity-80">{part.slice(1, -1)}</em>
    }
    // Code inline
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-muted rounded font-mono text-xs text-pink-500">{part.slice(1, -1)}</code>
    }
    return part
  })
}
