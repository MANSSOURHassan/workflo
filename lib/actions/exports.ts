'use server'

import { createClient } from '@/lib/supabase/server'

// Export prospects to PDF format (returns HTML that can be printed as PDF)
export async function exportProspectsToPDF() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé', html: null }
  }

  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, html: null }
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Export Prospects - Workflow CRM</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2E5B9A; border-bottom: 2px solid #2E5B9A; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2E5B9A; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-new { background: #e3f2fd; color: #1976d2; }
    .status-contacted { background: #fff3e0; color: #ef6c00; }
    .status-qualified { background: #e8f5e9; color: #388e3c; }
    .status-converted { background: #e8f5e9; color: #2e7d32; }
    .status-lost { background: #ffebee; color: #c62828; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 Export des Prospects</h1>
  <p class="meta">
    Généré le ${new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}<br>
    Total: ${prospects?.length || 0} prospects
  </p>
  
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Email</th>
        <th>Entreprise</th>
        <th>Téléphone</th>
        <th>Statut</th>
        <th>Score IA</th>
      </tr>
    </thead>
    <tbody>
      ${(prospects || []).map(p => `
        <tr>
          <td>${p.first_name || ''} ${p.last_name || ''}</td>
          <td>${p.email}</td>
          <td>${p.company || '-'}</td>
          <td>${p.phone || '-'}</td>
          <td><span class="status status-${p.status}">${p.status}</span></td>
          <td>${p.ai_score || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Workflow CRM - Export automatique</p>
  </div>
</body>
</html>
`

  return { html }
}

// Export deals/pipeline to PDF
export async function exportDealsToPDF() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé', html: null }
  }

  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      stage:pipeline_stages (name, color),
      prospect:prospects (email, first_name, last_name, company)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, html: null }
  }

  const totalValue = (deals || []).reduce((sum, d) => sum + (d.value || 0), 0)

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Export Pipeline - Workflow CRM</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2E5B9A; border-bottom: 2px solid #2E5B9A; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #2E5B9A; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2E5B9A; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    .value { font-weight: bold; color: #2E5B9A; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>💼 Export du Pipeline Commercial</h1>
  <p class="meta">
    Généré le ${new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
  </p>
  
  <div class="summary">
    <p>Total des opportunités: <span class="summary-value">${deals?.length || 0}</span></p>
    <p>Valeur totale du pipeline: <span class="summary-value">${totalValue.toLocaleString('fr-FR')} €</span></p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Opportunité</th>
        <th>Client</th>
        <th>Étape</th>
        <th>Valeur</th>
        <th>Statut</th>
        <th>Date prévue</th>
      </tr>
    </thead>
    <tbody>
      ${(deals || []).map(d => `
        <tr>
          <td>${d.name}</td>
          <td>${d.prospect?.company || d.prospect?.email || '-'}</td>
          <td>${d.stage?.name || '-'}</td>
          <td class="value">${(d.value || 0).toLocaleString('fr-FR')} €</td>
          <td>${d.status}</td>
          <td>${d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString('fr-FR') : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Workflow CRM - Export automatique</p>
  </div>
</body>
</html>
`

  return { html }
}

// Export analytics summary to PDF
export async function exportAnalyticsToPDF() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé', html: null }
  }

  // Get stats
  const { count: prospectCount } = await supabase
    .from('prospects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: dealCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: wonDeals } = await supabase
    .from('deals')
    .select('value')
    .eq('user_id', user.id)
    .eq('status', 'won')

  const totalRevenue = (wonDeals || []).reduce((sum, d) => sum + (d.value || 0), 0)

  const { count: campaignCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Analytics - Workflow CRM</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2E5B9A; border-bottom: 2px solid #2E5B9A; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 40px; }
    .meta { color: #666; margin-bottom: 30px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
    .kpi-card { background: linear-gradient(135deg, #2E5B9A, #1E3A5F); color: white; padding: 30px; border-radius: 12px; text-align: center; }
    .kpi-value { font-size: 48px; font-weight: bold; }
    .kpi-label { font-size: 14px; opacity: 0.9; margin-top: 10px; }
    .green { background: linear-gradient(135deg, #4CAF50, #2E7D32); }
    .orange { background: linear-gradient(135deg, #FF9800, #EF6C00); }
    .purple { background: linear-gradient(135deg, #9C27B0, #6A1B9A); }
    .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📈 Rapport Analytics</h1>
  <p class="meta">
    Période: Depuis le début<br>
    Généré le ${new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
  </p>
  
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">${prospectCount || 0}</div>
      <div class="kpi-label">Prospects</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-value">${dealCount || 0}</div>
      <div class="kpi-label">Opportunités</div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-value">${totalRevenue.toLocaleString('fr-FR')} €</div>
      <div class="kpi-label">Chiffre d'affaires gagné</div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-value">${campaignCount || 0}</div>
      <div class="kpi-label">Campagnes</div>
    </div>
  </div>
  
  <div class="footer">
    <p>Workflow CRM - Rapport généré automatiquement</p>
  </div>
</body>
</html>
`

  return { html }
}
