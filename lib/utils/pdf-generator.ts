import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Helper to extract manual client name from notes
const getClientName = (doc: any) => {
    if (doc.prospect) {
        return `${doc.prospect.first_name || ''} ${doc.prospect.last_name || ''}`.trim() || doc.prospect.company || 'Client'
    }
    if (doc.notes && doc.notes.includes('Client: ')) {
        const match = doc.notes.match(/Client: (.*)/)
        if (match) return match[1].trim()
    }
    return 'Client'
}

// Helper to extract service type from notes
const getServiceType = (doc: any) => {
    if (doc.notes && doc.notes.includes('Service: ')) {
        const match = doc.notes.match(/Service: (.*)/)
        if (match) return match[1].trim()
    }
    return null
}

// Helper to get real notes (clean)
const getCleanNotes = (notes: string) => {
    if (!notes) return ""
    return notes
        .replace(/Client: .*\n?/, '')
        .replace(/Service: .*\n?/, '')
        .trim()
}

export function generateAccountingPDF(data: {
    proSummary: any
    accounts: any[]
    expenses: any[]
}) {
    const doc = new jsPDF()
    const now = new Date().toLocaleDateString('fr-FR')
    const year = new Date().getFullYear()

    const TEXT_DARK: [number, number, number] = [0, 0, 0]
    const TEXT_LIGHT: [number, number, number] = [100, 100, 100]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text('WORKFLOW CRM', 14, 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2])
    doc.text('BILAN COMPTABLE ET FINANCIER', 14, 32)

    doc.setFontSize(10)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text(`Exercice Clos : 31/12/${year}`, 140, 25)
    doc.text(`Édité le : ${now}`, 140, 30)

    doc.setDrawColor(0, 0, 0)
    doc.line(14, 40, 196, 40)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('I. INDICATEURS FINANCIERS CLÉS', 14, 50)

    autoTable(doc, {
        startY: 55,
        head: [['Poste Comptable', 'Référence', 'Montant Net (€)', 'Variation (%)']],
        body: [
            ['TOTAL PRODUITS D\'EXPLOITATION', 'Classe 7', `${data.proSummary?.summary?.income?.toLocaleString('fr-FR')} €`, '100%'],
            ['TOTAL CHARGES D\'EXPLOITATION', 'Classe 6', `${data.proSummary?.summary?.costs?.toLocaleString('fr-FR')} €`, `${((data.proSummary?.summary?.costs / (data.proSummary?.summary?.income || 1)) * 100).toFixed(1)}%`],
            ['RÉSULTAT NET (BÉNÉFICE / PERTE)', 'RÉSULTAT', `${data.proSummary?.summary?.result?.toLocaleString('fr-FR')} €`, `${((data.proSummary?.summary?.result / (data.proSummary?.summary?.income || 1)) * 100).toFixed(1)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8 }
    })

    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`Workflow CRM - Page ${i}/${pageCount}`, 105, 290, { align: 'center' })
    }

    doc.save(`Bilan_Comptable_${year}.pdf`)
}

export function generateInvoicePDF(invoice: any) {
    const doc = new jsPDF()
    const clientName = getClientName(invoice)
    const serviceType = getServiceType(invoice)
    const cleanNotes = getCleanNotes(invoice.notes)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(0, 0, 0)
    doc.text('FACTURE', 14, 25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`N° ${invoice.invoice_number}`, 14, 33)

    doc.setDrawColor(0, 0, 0)
    doc.line(14, 40, 196, 40)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Émetteur :', 14, 55)
    doc.setFont('helvetica', 'normal')
    doc.text('Votre Entreprise', 14, 60)
    doc.text('Adresse de l\'entreprise', 14, 65)

    doc.setFont('helvetica', 'bold')
    doc.text('Client :', 120, 55)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, 120, 60)
    if (invoice.prospect?.company) doc.text(invoice.prospect.company, 120, 65)

    doc.text(`Date d'émission : ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, 14, 85)
    if (invoice.due_date) doc.text(`Date d'échéance : ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, 14, 91)
    if (serviceType) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Type de service :`, 120, 85)
        doc.setFont('helvetica', 'normal')
        doc.text(serviceType, 160, 85)
    }

    const items = invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: invoice.subtotal, tax_rate: invoice.tax_rate }]

    const tableBody = items.map((item: any) => [
        item.description || 'Article',
        item.quantity || 0,
        `${(item.unit_price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
        `${(item.tax_rate || 20)}%`,
        `${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
    ])

    autoTable(doc, {
        startY: 100,
        head: [['Description', 'Qté', 'Prix Unit.', 'TVA', 'Total HT']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Sous-total HT:`, 140, finalY)
    doc.text(`${invoice.subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY, { align: 'right' })

    doc.text(`Total TVA :`, 140, finalY + 7)
    doc.text(`${invoice.tax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY + 7, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`TOTAL TTC :`, 140, finalY + 17)
    doc.text(`${invoice.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY + 17, { align: 'right' })

    if (cleanNotes) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes & Conditions :', 14, finalY + 30)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(cleanNotes, 180)
        doc.text(splitNotes, 14, finalY + 36)
    }

    doc.save(`Facture_${invoice.invoice_number}.pdf`)
}

export function generateQuotePDF(quote: any) {
    const doc = new jsPDF()
    const clientName = getClientName(quote)
    const cleanNotes = getCleanNotes(quote.notes)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(0, 0, 0)
    doc.text('DEVIS', 14, 25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`N° ${quote.quote_number}`, 14, 33)

    doc.setDrawColor(0, 0, 0)
    doc.line(14, 40, 196, 40)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Émetteur :', 14, 55)
    doc.setFont('helvetica', 'normal')
    doc.text('Votre Entreprise', 14, 60)
    doc.text('Adresse de l\'entreprise', 14, 65)

    doc.setFont('helvetica', 'bold')
    doc.text('Client :', 120, 55)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, 120, 60)
    if (quote.prospect?.company) doc.text(quote.prospect.company, 120, 65)

    doc.text(`Date du devis : ${new Date(quote.issue_date).toLocaleDateString('fr-FR')}`, 14, 85)
    if (quote.valid_until) doc.text(`Valable jusqu'au : ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}`, 14, 91)

    const items = quote.items && Array.isArray(quote.items) && quote.items.length > 0
        ? quote.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: quote.subtotal, tax_rate: quote.tax_rate }]

    const tableBody = items.map((item: any) => [
        item.description || 'Article',
        item.quantity || 0,
        `${(item.unit_price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
        `${(item.tax_rate || 20)}%`,
        `${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
    ])

    autoTable(doc, {
        startY: 100,
        head: [['Désignation', 'Qté', 'Prix Unit.', 'TVA', 'Total HT']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Sous-total HT:`, 140, finalY)
    doc.text(`${quote.subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY, { align: 'right' })

    doc.text(`Total TVA :`, 140, finalY + 7)
    doc.text(`${quote.tax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY + 7, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`TOTAL EUR :`, 140, finalY + 17)
    doc.text(`${quote.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, 195, finalY + 17, { align: 'right' })

    if (cleanNotes) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Conditions & Notes :', 14, finalY + 30)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(cleanNotes, 180)
        doc.text(splitNotes, 14, finalY + 36)
    }

    doc.save(`Devis_${quote.quote_number}.pdf`)
}
