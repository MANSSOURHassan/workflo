import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

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

// Helper to get real notes
const getCleanNotes = (notes: string) => {
    if (!notes) return ""
    return notes
        .replace(/Client: .*\n?/, '')
        .replace(/Service: .*\n?/, '')
        .trim()
}

export async function generateInvoiceWord(invoice: any) {
    const items = invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: invoice.subtotal }]

    const clientName = getClientName(invoice)
    const serviceType = getServiceType(invoice)
    const cleanNotes = getCleanNotes(invoice.notes)

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: "FACTURE", bold: true, size: 32 }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `N° ${invoice.invoice_number}`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun({ text: "Émetteur :", bold: true })]
                }),
                new Paragraph({ text: "Votre Entreprise" }),
                new Paragraph({ text: "Adresse de l'entreprise" }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun({ text: "Destinataire :", bold: true })]
                }),
                new Paragraph({ text: clientName }),
                new Paragraph({ text: invoice.prospect?.company || "" }),

                new Paragraph({ text: "" }),
                new Paragraph({ text: `Date d'émission : ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}` }),
                new Paragraph({ text: `Échéance : ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : 'N/A'}` }),
                serviceType ? new Paragraph({
                    children: [
                        new TextRun({ text: "Type de service : ", bold: true }),
                        new TextRun({ text: serviceType })
                    ]
                }) : new Paragraph({ text: "" }),

                new Paragraph({ text: "" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qté", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Prix Unit.", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total HT", bold: true })] })] }),
                            ],
                        }),
                        ...items.map((item: any) => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: item.description })] }),
                                new TableCell({ children: [new Paragraph({ text: String(item.quantity) })] }),
                                new TableCell({ children: [new Paragraph({ text: `${item.unit_price.toLocaleString('fr-FR')} €` })] }),
                                new TableCell({ children: [new Paragraph({ text: `${(item.quantity * item.unit_price).toLocaleString('fr-FR')} €` })] }),
                            ],
                        })),
                    ],
                }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Sous-total HT : ${invoice.subtotal.toLocaleString('fr-FR')} €`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `TVA : ${invoice.tax_amount.toLocaleString('fr-FR')} €`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `TOTAL TTC : ${invoice.total.toLocaleString('fr-FR')} €`, bold: true, size: 28 }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),

                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Notes :", bold: true, size: 18 })] }),
                new Paragraph({ text: cleanNotes }),
            ],
        }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Facture_${invoice.invoice_number}.docx`)
}

export async function generateQuoteWord(quote: any) {
    const items = quote.items && Array.isArray(quote.items) && quote.items.length > 0
        ? quote.items
        : [{ description: 'Prestation de services', quantity: 1, unit_price: quote.subtotal }]

    const clientName = getClientName(quote)
    const cleanNotes = getCleanNotes(quote.notes)

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: "DEVIS", bold: true, size: 32 }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `N° ${quote.quote_number}`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun({ text: "Émetteur :", bold: true })]
                }),
                new Paragraph({ text: "Votre Entreprise" }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun({ text: "Client :", bold: true })]
                }),
                new Paragraph({ text: clientName }),

                new Paragraph({ text: "" }),
                new Paragraph({ text: `Date d'émission : ${new Date(quote.issue_date).toLocaleDateString('fr-FR')}` }),
                new Paragraph({ text: `Validité : ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'}` }),

                new Paragraph({ text: "" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qté", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Prix Unit.", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total HT", bold: true })] })] }),
                            ],
                        }),
                        ...items.map((item: any) => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: item.description })] }),
                                new TableCell({ children: [new Paragraph({ text: String(item.quantity) })] }),
                                new TableCell({ children: [new Paragraph({ text: `${item.unit_price.toLocaleString('fr-FR')} €` })] }),
                                new TableCell({ children: [new Paragraph({ text: `${(item.quantity * item.unit_price).toLocaleString('fr-FR')} €` })] }),
                            ],
                        })),
                    ],
                }),

                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Sous-total HT : ${quote.subtotal.toLocaleString('fr-FR')} €`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `TVA : ${quote.tax_amount.toLocaleString('fr-FR')} €`, bold: true }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `TOTAL : ${quote.total.toLocaleString('fr-FR')} €`, bold: true, size: 28 }),
                    ],
                    alignment: AlignmentType.RIGHT,
                }),

                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Conditions :", bold: true, size: 18 })] }),
                new Paragraph({ text: cleanNotes }),
            ],
        }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Devis_${quote.quote_number}.pdf`)
}
