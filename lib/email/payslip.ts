import { Resend } from 'resend'
import { formatCurrency, MONTHS_FR } from '@/lib/payroll/calculations'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendPayslipEmailParams {
    to: string
    employeeName: string
    month: number
    year: number
    netToPay: number
    grossSalary: number
    payslipUrl: string
}

export async function sendPayslipEmail({
    to, employeeName, month, year, netToPay, grossSalary, payslipUrl
}: SendPayslipEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) return { success: false, error: 'RESEND_API_KEY non configurée' }

    const monthLabel = `${MONTHS_FR[month - 1]} ${year}`

    try {
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Workflow CRM <onboarding@resend.dev>',
            to,
            subject: `Votre bulletin de paie - ${monthLabel}`,
            html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;">
      <tr>
        <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Bulletin de Paie</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${monthLabel}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:16px;margin:0 0 16px;">Bonjour <strong>${employeeName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Votre bulletin de paie pour le mois de <strong>${monthLabel}</strong> est disponible.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px;">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#374151;">Salaire brut :</td>
              <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;font-weight:600;">${formatCurrency(grossSalary)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-top:1px solid #e5e7eb;font-size:16px;color:#1e3a5f;font-weight:700;">Net à payer :</td>
              <td style="padding:6px 0;border-top:1px solid #e5e7eb;font-size:16px;color:#1e3a5f;font-weight:700;text-align:right;">${formatCurrency(netToPay)}</td>
            </tr>
          </table>
          <div style="text-align:center;">
            <a href="${payslipUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              📄 Voir mon bulletin de paie
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0;">
            Conservez ce document sans limitation de durée.<br>
            Pour toute question, contactez votre service RH.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2025 Workflow CRM — Tous droits réservés</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
        })
        if (error) return { success: false, error: error.message }
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
