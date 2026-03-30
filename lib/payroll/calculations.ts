// Barème français simplifié 2024
// Les taux sont indicatifs pour usage interne

export interface CotisationsResult {
    // Salariales
    retraiteBase: number
    retraiteComp: number
    prevoyance: number
    csgDeductible: number
    csgCrds: number
    totalSalarial: number
    // Patronales (info)
    securiteSocialePatronal: number
    retraiteBasePatronal: number
    retraiteCompPatronal: number
    chomagePatronal: number
    prevoyancePatronal: number
    totalPatronal: number
    // Net
    brutAssietteCSG: number
    netAvantImpot: number
    netAPayer: number
}

export function calculerCotisations(
    brutBase: number,
    bonus: number = 0,
    mealAllowance: number = 0,
    transportAllowance: number = 0,
    overtimeAmount: number = 0,
    tauxImpot: number = 0,
): CotisationsResult {
    const brut = brutBase + bonus + overtimeAmount

    // Assiette CSG/CRDS = 98.25% du brut
    const assietteCSG = brut * 0.9825

    // ─── COTISATIONS SALARIALES ───
    const retraiteBase = brut * 0.069        // 6.90%
    const retraiteComp = brut * 0.0315       // 3.15% (Tranche 1)
    const prevoyance = brut * 0.0083         // 0.83%
    const csgDeductible = assietteCSG * 0.024  // CSG déductible 2.4%
    const csgCrds = assietteCSG * 0.029       // CSG non déductible + CRDS (2.5% + 0.5%)

    const totalSalarial = retraiteBase + retraiteComp + prevoyance + csgDeductible + csgCrds

    // ─── COTISATIONS PATRONALES ───
    const securiteSocialePatronal = brut * 0.13    // 13%
    const retraiteBasePatronal = brut * 0.0855     // 8.55%
    const retraiteCompPatronal = brut * 0.0472     // 4.72%
    const chomagePatronal = brut * 0.0405          // 4.05%
    const prevoyancePatronal = brut * 0.015        // 1.5%

    const totalPatronal = securiteSocialePatronal + retraiteBasePatronal + retraiteCompPatronal + chomagePatronal + prevoyancePatronal

    // ─── NET ───
    const netAvantImpot = brut - totalSalarial + mealAllowance + transportAllowance
    const impot = netAvantImpot * (tauxImpot / 100)
    const netAPayer = netAvantImpot - impot

    return {
        retraiteBase: round2(retraiteBase),
        retraiteComp: round2(retraiteComp),
        prevoyance: round2(prevoyance),
        csgDeductible: round2(csgDeductible),
        csgCrds: round2(csgCrds),
        totalSalarial: round2(totalSalarial),
        securiteSocialePatronal: round2(securiteSocialePatronal),
        retraiteBasePatronal: round2(retraiteBasePatronal),
        retraiteCompPatronal: round2(retraiteCompPatronal),
        chomagePatronal: round2(chomagePatronal),
        prevoyancePatronal: round2(prevoyancePatronal),
        totalPatronal: round2(totalPatronal),
        brutAssietteCSG: round2(assietteCSG),
        netAvantImpot: round2(netAvantImpot),
        netAPayer: round2(netAPayer),
    }
}

function round2(n: number) { return Math.round(n * 100) / 100 }

export const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}
