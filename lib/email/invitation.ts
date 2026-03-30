import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
    to: string
    ownerName: string
    role: string
    acceptUrl: string
    expiresAt: string
}

const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    manager: 'Manager',
    member: 'Membre',
    viewer: 'Lecteur',
}

export async function sendInvitationEmail({
    to,
    ownerName,
    role,
    acceptUrl,
    expiresAt,
}: SendInvitationEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        return { success: false, error: 'RESEND_API_KEY non configurée' }
    }

    const expiryDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    })

    const roleLabel = roleLabels[role] || role

    try {
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Workflow CRM <onboarding@resend.dev>',
            to,
            subject: `${ownerName} vous invite à rejoindre son équipe sur Workflow CRM`,
            html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à rejoindre l'équipe</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 40px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Workflow CRM</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Invitation à rejoindre une équipe</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 12px;font-size:22px;font-weight:700;">
                Vous avez été invité ! 🎉
              </h2>
              <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                <strong>${ownerName}</strong> vous invite à rejoindre son organisation sur Workflow CRM en tant que <strong>${roleLabel}</strong>.
              </p>

              <!-- Role badge -->
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:0 0 32px;">
                <p style="margin:0;color:#1e40af;font-size:14px;">
                  <strong>Rôle assigné :</strong> ${roleLabel}<br>
                  <strong>Lien valable jusqu'au :</strong> ${expiryDate}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${acceptUrl}" 
                   style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                  ✅ Accepter l'invitation
                </a>
              </div>

              <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0 0 8px;">
                Ou copier ce lien dans votre navigateur :
              </p>
              <p style="color:#3b82f6;font-size:12px;text-align:center;word-break:break-all;margin:0;">
                ${acceptUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                Si vous ne connaissez pas ${ownerName}, ignorez cet email.<br>
                © 2025 Workflow CRM — Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `,
        })

        if (error) {
            console.error('Resend error:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Resend exception:', err)
        return { success: false, error: err.message }
    }
}
