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

const formatPdfNumber = (num: number) => {
    if (num === null || num === undefined) return '0,00 €'
    const parts = Number(num).toFixed(2).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return parts.join(',') + ' €'
}

export function generateAccountingPDF(data: {
    proSummary: any
    accounts: any[]
    expenses: any[]
}) {
    const doc = new jsPDF()
    const now = new Date().toLocaleDateString('fr-FR')
    const year = new Date().getFullYear()

    const TEXT_DARK: [number, number, number] = [40, 40, 40]
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

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 40, 196, 40)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('I. INDICATEURS FINANCIERS CLÉS', 14, 50)

    autoTable(doc, {
        startY: 55,
        head: [['Poste Comptable', 'Référence', 'Montant Net', 'Variation (%)']],
        body: [
            ['TOTAL PRODUITS D\'EXPLOITATION', 'Classe 7', formatPdfNumber(data.proSummary?.summary?.income || 0), '100%'],
            ['TOTAL CHARGES D\'EXPLOITATION', 'Classe 6', formatPdfNumber(data.proSummary?.summary?.costs || 0), `${((data.proSummary?.summary?.costs / (data.proSummary?.summary?.income || 1)) * 100).toFixed(1)}%`],
            ['RÉSULTAT NET (BÉNÉFICE / PERTE)', 'RÉSULTAT', formatPdfNumber(data.proSummary?.summary?.result || 0), `${((data.proSummary?.summary?.result / (data.proSummary?.summary?.income || 1)) * 100).toFixed(1)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8 }
    })

    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Workflow CRM - Page ${i}/${pageCount}`, 105, 290, { align: 'center' })
    }

    doc.save(`Bilan_Comptable_${year}.pdf`)
}

function drawElegantHeader(
    doc: any, 
    title: string, 
    docNumber: string, 
    date: string, 
    validUntil?: string, 
    clientName?: string, 
    companyName?: string, 
    clientCompany?: string, 
    serviceType?: string,
    prospect?: any,
    customization?: any
) {
    const PRIMARY_COLOR: [number, number, number] = [41, 128, 185] // Beautiful blue
    const DARK_TEXT: [number, number, number] = [44, 62, 80]
    const GRAY_TEXT: [number, number, number] = [127, 140, 141]

    // Top banner
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2])
    doc.rect(0, 0, 210, 15, 'F')

    // Document Type & Number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2])
    doc.text(title.toUpperCase(), 14, 35)
    
    doc.setFontSize(11)
    doc.setTextColor(DARK_TEXT[0], DARK_TEXT[1], DARK_TEXT[2])
    doc.text(`N° ${docNumber}`, 14, 43)

    // Dates
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2])
    let yDate = 50
    doc.text(`Date : ${date}`, 14, yDate)
    if (validUntil) doc.text(`Valable jusqu'au : ${validUntil}`, 14, yDate + 5)
    if (serviceType) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Objet : ${serviceType}`, 14, yDate + (validUntil ? 12 : 7))
        doc.setFont('helvetica', 'normal')
    }

    // Company (Seller) info - Left side
    let yEntity = 70
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2])
    doc.setLineWidth(0.5)
    doc.line(14, yEntity - 5, 80, yEntity - 5)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK_TEXT[0], DARK_TEXT[1], DARK_TEXT[2])
    doc.text('Émetteur :', 14, yEntity)
    doc.setFont('helvetica', 'normal')
    doc.text(companyName || 'Votre Entreprise', 14, yEntity + 6)
    
    doc.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2])
    doc.setFontSize(9)
    let currentY = yEntity + 11
    if (customization?.company_address) {
        doc.text(customization.company_address, 14, currentY)
        currentY += 5
    }
    if (customization?.company_zip || customization?.company_city) {
        const cityLine = [customization.company_zip, customization.company_city].filter(Boolean).join(' ')
        doc.text(cityLine, 14, currentY)
        currentY += 5
    }
    if (customization?.vat_number) {
        doc.text(`TVA : ${customization.vat_number}`, 14, currentY)
    }

    // Client info - Right side (beautiful bordered box)
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(249, 250, 251)
    
    // Auto-adjust box height based on address presence
    const hasClientAddress = prospect?.address || prospect?.city || prospect?.zip || prospect?.country
    const boxHeight = hasClientAddress ? 40 : 25
    doc.roundedRect(110, yEntity - 8, 86, boxHeight, 2, 2, 'FD')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2])
    doc.text('Client :', 115, yEntity)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK_TEXT[0], DARK_TEXT[1], DARK_TEXT[2])
    
    let currentClientY = yEntity + 6
    if (clientCompany) {
        doc.text(clientCompany, 115, currentClientY)
        currentClientY += 5
        doc.setFont('helvetica', 'normal')
        doc.text(clientName || '', 115, currentClientY)
        currentClientY += 5
    } else {
        doc.text(clientName || 'Client', 115, currentClientY)
        doc.setFont('helvetica', 'normal')
        currentClientY += 5
    }
    
    doc.setFontSize(9)
    doc.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2])
    
    if (prospect?.address) {
        doc.text(prospect.address, 115, currentClientY + 1)
        currentClientY += 5
    }
    if (prospect?.zip || prospect?.city || prospect?.country) {
        const cityInfo = [prospect.zip, prospect.city, prospect.country].filter(Boolean).join(' ')
        doc.text(cityInfo, 115, currentClientY + 1)
    }
}

function drawTotals(doc: any, subtotal: number, taxAmount: number, total: number, notes?: string) {
    const finalY = (doc as any).lastAutoTable.finalY + 15
    const PRIMARY_COLOR: [number, number, number] = [41, 128, 185]
    
    // Totals Box
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(250, 250, 250)
    doc.rect(130, finalY - 5, 66, 35, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Sous-total HT :`, 135, finalY + 2)
    doc.text(formatPdfNumber(subtotal), 190, finalY + 2, { align: 'right' })

    doc.text(`Total TVA :`, 135, finalY + 10)
    doc.text(formatPdfNumber(taxAmount), 190, finalY + 10, { align: 'right' })

    doc.setDrawColor(200, 200, 200)
    doc.line(135, finalY + 15, 190, finalY + 15)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2])
    doc.text(`TOTAL TTC :`, 135, finalY + 23)
    doc.text(formatPdfNumber(total), 190, finalY + 23, { align: 'right' })

    if (notes) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 60)
        doc.text('Notes & Conditions :', 14, finalY + 5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const splitNotes = doc.splitTextToSize(notes, 100)
        doc.text(splitNotes, 14, finalY + 11)
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${i}/${pageCount} - Généré par Workflow CRM`, 105, 290, { align: 'center' })
    }
}

export function generateInvoicePDF(invoice: any, customization?: any) {
    const doc = new jsPDF()
    const clientName = getClientName(invoice)
    const serviceType = getServiceType(invoice)
    const cleanNotes = getCleanNotes(invoice.notes)
    
    drawElegantHeader(
        doc,
        'FACTURE',
        invoice.invoice_number,
        new Date(invoice.issue_date).toLocaleDateString('fr-FR'),
        invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : undefined,
        clientName,
        customization?.company_name || undefined,
        invoice.prospect?.company || undefined,
        serviceType || undefined,
        invoice.prospect,
        customization
    )

    const items = invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: invoice.subtotal, tax_rate: invoice.tax_rate }]

    const tableBody = items.map((item: any) => [
        item.description || 'Article',
        item.quantity || 0,
        formatPdfNumber(item.unit_price || 0),
        `${(item.tax_rate || 20)}%`,
        formatPdfNumber((item.quantity || 0) * (item.unit_price || 0))
    ])

    autoTable(doc, {
        startY: 115,
        head: [['Description', 'Qté', 'Prix Unit. HT', 'TVA', 'Total HT']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4, textColor: [60, 60, 60] },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
        }
    })

    drawTotals(doc, invoice.subtotal, invoice.tax_amount, invoice.total, cleanNotes)
    doc.save(`Facture_${invoice.invoice_number}.pdf`)
}

export function generateQuotePDF(quote: any, customization?: any) {
    const doc = new jsPDF()
    const clientName = getClientName(quote)
    const cleanNotes = getCleanNotes(quote.notes)

    drawElegantHeader(
        doc,
        'DEVIS',
        quote.quote_number,
        new Date(quote.issue_date).toLocaleDateString('fr-FR'),
        quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : undefined,
        clientName,
        customization?.company_name || undefined,
        quote.prospect?.company || undefined,
        undefined,
        quote.prospect,
        customization
    )

    const items = quote.items && Array.isArray(quote.items) && quote.items.length > 0
        ? quote.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: quote.subtotal, tax_rate: quote.tax_rate }]

    const tableBody = items.map((item: any) => [
        item.description || 'Article',
        item.quantity || 0,
        formatPdfNumber(item.unit_price || 0),
        `${(item.tax_rate || 20)}%`,
        formatPdfNumber((item.quantity || 0) * (item.unit_price || 0))
    ])

    autoTable(doc, {
        startY: 115,
        head: [['Désignation', 'Qté', 'Prix Unit. HT', 'TVA', 'Total HT']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4, textColor: [60, 60, 60] },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
        }
    })

    drawTotals(doc, quote.subtotal, quote.tax_amount, quote.total, cleanNotes)
    doc.save(`Devis_${quote.quote_number}.pdf`)
}
