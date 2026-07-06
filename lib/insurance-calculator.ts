export interface InsuranceAnalysisResult {
    estimatedAmount: number;
    interestRate: number;
    netPayableAmount: number;
    schemeName: string;
    eligibilityRemark: string;
    breakdownSummary: string;
    recommendation: string;
}

const TIER_1_STATES = ["punjab", "haryana", "uttar pradesh"];
const TIER_2_STATES = [
    "maharashtra",
    "madhya pradesh",
    "andhra pradesh",
    "gujarat",
    "karnataka",
    "tamil nadu",
    "west bengal",
];

const CALAMITY_LABELS: Record<string, string> = {
    flood: "Flood",
    drought: "Drought",
    pest_attack: "Pest Attack",
    fire: "Fire",
    hailstorm: "Hailstorm",
    cyclone: "Cyclone",
    landslide: "Landslide",
    frost: "Frost",
    crop_disease: "Crop Disease",
    unseasonal_rain: "Unseasonal Rain",
    other: "Other",
};

export async function calculateInsurance(claimData: {
    state: string;
    city: string;
    areaAcres: number;
    calamityType: string;
    calamityDescription: string;
    damagedPercentage: number;
    damagedAreaSqm: number;
}): Promise<InsuranceAnalysisResult> {
    // 1. Determine Base Sum Insured (SI) per Acre
    const stateLower = claimData.state.toLowerCase();
    let baseSIAcre = 25000; // Tier 3

    if (TIER_1_STATES.some((s) => stateLower.includes(s))) {
        baseSIAcre = 40000;
    } else if (TIER_2_STATES.some((s) => stateLower.includes(s))) {
        baseSIAcre = 30000;
    }

    // 2. Calamity Impact Factor
    let cif = 0.5; // default Other
    const cType = claimData.calamityType;
    if (["flood", "cyclone", "fire"].includes(cType)) cif = 1.0;
    else if (["drought", "hailstorm", "landslide"].includes(cType)) cif = 0.8;
    else if (["pest_attack", "crop_disease", "frost", "unseasonal_rain"].includes(cType)) cif = 0.6;

    // 3. Interest Rate (Farmer Premium Equivalent)
    let interestRate = 8.0; // default Other / Fire
    if (
        [
            "flood",
            "cyclone",
            "drought",
            "hailstorm",
            "frost",
            "unseasonal_rain",
            "landslide",
        ].includes(cType)
    ) {
        interestRate = 2.0;
    } else if (["pest_attack", "crop_disease"].includes(cType)) {
        interestRate = 5.0;
    }

    // 4. Mathematical Calculation
    const damagedAreaAcres = claimData.areaAcres * (claimData.damagedPercentage / 100);
    const grossPayout = damagedAreaAcres * baseSIAcre * cif;

    // Apply Hard Floor of 10000
    const estimatedAmount = Math.max(Math.round(grossPayout), 10000);

    const deduction = estimatedAmount * (interestRate / 100);
    const netPayableAmount = Math.round(estimatedAmount - deduction);

    const schemeName = "PMFBY (Pradhan Mantri Fasal Bima Yojana)";
    const calamityLabel = CALAMITY_LABELS[cType] || cType;

    // 5. Deterministic Text Generation
    const eligibilityRemark = `The claim falls under PMFBY guidelines for ${calamityLabel} in ${claimData.state}. With ${claimData.damagedPercentage}% of the land affected, the farmer is eligible for standardized compensation under the Area Approach.`;

    const breakdownSummary = `Under PMFBY norms for ${claimData.state}, the baseline Sum Insured (SI) is estimated at ₹${baseSIAcre.toLocaleString(
        "en-IN"
    )} per acre. The total damaged area is ${damagedAreaAcres.toFixed(
        2
    )} acres. Applying a Calamity Impact Factor of ${(cif * 100).toFixed(
        0
    )}% for ${calamityLabel}, the gross calculated payout is ₹${Math.round(grossPayout).toLocaleString(
        "en-IN"
    )}. ${
        grossPayout < 10000
            ? "A minimum statutory payout floor of ₹10,000 has been applied. "
            : ""
    }Finally, a ${interestRate}% standardized premium deduction (₹${Math.round(
        deduction
    ).toLocaleString("en-IN")}) yields the net payable amount.`;

    const recommendation = `1. Ensure your land deed matches the uploaded document exactly.\n2. Keep the affected crop area undisturbed until the field investigator (Crop Cutting Experiment) completes their physical survey.\n3. Track your claim status regularly via the dashboard.`;

    // Simulate minimal processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
        estimatedAmount,
        interestRate,
        netPayableAmount,
        schemeName,
        eligibilityRemark,
        breakdownSummary,
        recommendation,
    };
}
