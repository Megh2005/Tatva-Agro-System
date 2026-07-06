import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LatLon {
    lat: number;
    lon: number;
}

interface DroneParams {
    lat: number;
    lon: number;
    altitudeMsl: number;
    headingDeg: number;
    mountTiltDeg: number;
    verticalFovDeg: number;
    horizontalFovDeg: number;
}

type DamageArea =
    | { mode: "polygon"; points: LatLon[] }
    | { mode: "drone"; drone: DroneParams };

interface SoilSensorValues {
    moisture: number;       // Moisture_%
    temperature: number;    // Temperature_C
    ec: number;             // EC_uS_cm
    ph: number;             // pH
    nitrogen: number;       // N_mg_per_kg
    phosphorus: number;     // P_mg_per_kg
    potassium: number;      // K_mg_per_kg
}

// Pre-computed by your ML service / Python backend
interface SoilInfo {
    isFertile: boolean;
    fertilityScore: number; // 0.0–1.0
    issues: string[];
}

// Pre-computed by your ML service / Python backend
interface PestInfo {
    isPestAffected: boolean;
    pestRiskScore: number;  // 0.0–1.0
    pestName: string;
    confidence: number;
    pesticideName: string;
    acreDose: Record<string, number | string>;
    miniFarmDose: Record<string, number | string>;
}

interface RequestBody {
    // Farm dimensions
    farmAreaM2: number;
    rowSpacingM: number;
    plantSpacingM: number;
    paddyType: string;

    // Damage areas (polygon coords or drone footprint params)
    damageAreas: DamageArea[];

    // Soil sensor readings (for issue detection)
    soilSensor: SoilSensorValues;

    // Pre-computed ML results from your Python/ML service
    soilInfo: SoilInfo;
    pestInfo: PestInfo;

    // Target yield choice: "estimated" | "predicted"
    targetYieldChoice: "estimated" | "predicted";

    // Optional: elevation override (metres). If omitted, 0 is used as fallback
    // when the open-elevation API is unavailable.
    groundElevationM?: number;
}

interface ActionPlan {
    summary: string;
    steps: string[];
}

interface ResponseBody {
    farmAreaM2: number;
    totalPlants: number;
    totalDamageAreaM2: number;
    totalLostPlants: number;
    survivingPlants: number;
    yieldRemainingPercent: number;
    yieldLostPercent: number;
    estimatedYieldKg: number;
    predictedYieldKg: number;
    targetYieldKg: number;
    targetYieldSource: string;
    soilIssues: string[];
    actionPlan: ActionPlan;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function polygonAreaM2(points: LatLon[]): number {
    if (points.length < 3) return 0;

    const latRef = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lonRef = points[0].lon;
    const LAT_TO_M = 111320;
    const LON_TO_M = 111320 * Math.cos((latRef * Math.PI) / 180);

    const xy = points.map((p) => ({
        x: (p.lon - lonRef) * LON_TO_M,
        y: (p.lat - latRef) * LAT_TO_M,
    }));

    let area = 0;
    for (let i = 0; i < xy.length; i++) {
        const { x: x1, y: y1 } = xy[i];
        const { x: x2, y: y2 } = xy[(i + 1) % xy.length];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) * 0.5;
}

function metersToLatLonOffsets(
    eastM: number,
    northM: number,
    latRef: number
): { dLat: number; dLon: number } {
    const LAT_TO_M = 111320;
    const LON_TO_M = 111320 * Math.cos((latRef * Math.PI) / 180);
    return { dLat: northM / LAT_TO_M, dLon: eastM / LON_TO_M };
}

function cameraFootprintFromDrone(
    p: DroneParams,
    groundElevM: number
): LatLon[] {
    let h = p.altitudeMsl - groundElevM;
    if (h <= 0) h = 5;

    const halfV = p.verticalFovDeg / 2;
    const nearAngle = Math.max(0.0001, p.mountTiltDeg - halfV);
    const farAngle = p.mountTiltDeg + halfV;

    const nearD = h * Math.tan((nearAngle * Math.PI) / 180);
    const farD = h * Math.tan((farAngle * Math.PI) / 180);
    const halfWNear = nearD * Math.tan(((p.horizontalFovDeg / 2) * Math.PI) / 180);
    const halfWFar = farD * Math.tan(((p.horizontalFovDeg / 2) * Math.PI) / 180);

    const theta = (p.headingDeg * Math.PI) / 180;

    function corner(dForward: number, right: number): { eastM: number; northM: number } {
        return {
            eastM: dForward * Math.sin(theta) + right * Math.cos(theta),
            northM: dForward * Math.cos(theta) - right * Math.sin(theta),
        };
    }

    return [
        corner(nearD, -halfWNear),
        corner(nearD, +halfWNear),
        corner(farD, +halfWFar),
        corner(farD, -halfWFar),
    ].map(({ eastM, northM }) => {
        const { dLat, dLon } = metersToLatLonOffsets(eastM, northM, p.lat);
        return { lat: p.lat + dLat, lon: p.lon + dLon };
    });
}

// ---------------------------------------------------------------------------
// Soil issue detection (rule-based, mirrors Python nutrient_suggestions)
// ---------------------------------------------------------------------------

function detectSoilIssues(s: SoilSensorValues): string[] {
    const issues: string[] = [];
    const moistureValue = s.moisture <= 1.0 ? s.moisture * 100 : s.moisture;

    if (s.ph < 5.5 || s.ph > 7.5) issues.push("pH out of ideal range (5.5–7.5)");
    if (s.ec >= 1000) issues.push("High EC – salinity too high");
    if (s.temperature < 20 || s.temperature > 30) issues.push("Temperature not ideal (20–30°C)");
    if (moistureValue < 30) issues.push("Soil moisture too low (<30%)");
    if (s.nitrogen < 20) issues.push("Nitrogen deficiency");
    if (s.phosphorus < 12) issues.push("Phosphorus deficiency");
    if (s.potassium < 100) issues.push("Potassium deficiency");
    return issues;
}

// ---------------------------------------------------------------------------
// Yield prediction (pure formula, mirrors predict_yield_from_models)
// ---------------------------------------------------------------------------

function predictYield(
    survivingPlants: number,
    paddyType: string,
    soilInfo: SoilInfo,
    pestInfo: PestInfo
): number {
    const BASE_KG_PER_PLANT = 0.014;
    const fertilityFactor = 0.9 + soilInfo.fertilityScore * 0.2;
    const pestFactor = 1.0 - pestInfo.pestRiskScore * 0.3;

    const lower = paddyType.toLowerCase();
    const varietyFactor =
        lower.includes("hybrid") || lower.includes("high") ? 1.1
            : lower.includes("local") ? 0.95
                : 1.0;

    return survivingPlants * BASE_KG_PER_PLANT * fertilityFactor * pestFactor * varietyFactor;
}

// ---------------------------------------------------------------------------
// Action plan builder
// ---------------------------------------------------------------------------

function buildActionPlan(
    estimatedYieldKg: number,
    predictedYieldKg: number,
    targetChoice: "estimated" | "predicted",
    soilInfo: SoilInfo,
    pestInfo: PestInfo
): ActionPlan {
    const steps: string[] = [];

    if (estimatedYieldKg > predictedYieldKg) {
        if (targetChoice === "estimated") {
            steps.push("To reach your expected yield, address the issues below.");
            if (pestInfo.isPestAffected) {
                steps.push(`Apply pesticide for detected pest: ${pestInfo.pestName} – ${pestInfo.pesticideName}.`);
            } else {
                steps.push("No major pest detected. Focus on soil correction.");
            }
            if (soilInfo.issues.length) {
                soilInfo.issues.forEach((i) => steps.push(`Fix: ${i}`));
            } else {
                steps.push("Soil looks fine. Maintain good irrigation and nutrient management.");
            }
        } else {
            steps.push("Maintaining the lower ML-predicted yield.");
            steps.push("Follow recommended soil and nutrient management.");
            if (soilInfo.issues.length) {
                soilInfo.issues.forEach((i) => steps.push(`Gradually fix: ${i}`));
            }
            if (pestInfo.isPestAffected) {
                steps.push(`Consider pesticide to prevent further loss: ${pestInfo.pesticideName} for ${pestInfo.pestName}.`);
            }
            steps.push("Plan cost and harvest based on this lower yield.");
        }
    } else {
        if (targetChoice === "predicted") {
            steps.push("Continue current management (soil, water, fertilizer).");
            steps.push("Monitor other field areas for pest or disease symptoms.");
            steps.push("Use targeted spray only where new symptoms appear.");
        } else {
            steps.push("No urgent action required.");
            steps.push("Maintain current practices and monitor the field normally.");
            steps.push("If new pest symptoms appear, run pest detection again.");
        }
    }

    return {
        summary:
            estimatedYieldKg > predictedYieldKg
                ? "Estimated yield exceeds prediction – action needed to close the gap."
                : "Prediction meets or exceeds estimate – maintain current practices.",
        steps,
    };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const body: RequestBody = await req.json();

        const {
            farmAreaM2,
            rowSpacingM,
            plantSpacingM,
            paddyType,
            damageAreas,
            soilSensor,
            soilInfo,
            pestInfo,
            targetYieldChoice,
            groundElevationM = 0,
        } = body;

        // ── Plant population ────────────────────────────────────────────────────
        const plantDensity = 1 / (rowSpacingM * plantSpacingM);
        const totalPlants = Math.round(plantDensity * farmAreaM2);

        // ── Damage areas ────────────────────────────────────────────────────────
        let totalDamageAreaM2 = 0;
        let totalLostPlants = 0;

        for (const area of damageAreas) {
            let points: LatLon[];

            if (area.mode === "polygon") {
                points = area.points;
            } else {
                points = cameraFootprintFromDrone(area.drone, groundElevationM);
            }

            const areaM2 = polygonAreaM2(points);
            const lost = Math.round(areaM2 * plantDensity);
            totalDamageAreaM2 += areaM2;
            totalLostPlants += lost;
        }

        const survivingPlants = Math.max(0, totalPlants - totalLostPlants);
        const yieldRemainingPercent = totalPlants > 0 ? (survivingPlants / totalPlants) * 100 : 0;
        const yieldLostPercent = 100 - yieldRemainingPercent;

        // ── Yield calculations ──────────────────────────────────────────────────
        const estimatedYieldKg = totalPlants * 0.014;
        const predictedYieldKg = predictYield(survivingPlants, paddyType, soilInfo, pestInfo);

        const isTargetPredicted = targetYieldChoice === "predicted";
        const targetYieldKg = isTargetPredicted ? predictedYieldKg : estimatedYieldKg;
        const targetYieldSource = isTargetPredicted
            ? "ML Predicted Yield (post-damage & conditions)"
            : "Estimated Yield (farmer expectation)";

        // ── Soil issues (rule-based, runs server-side) ─────────────────────────
        const soilIssues = detectSoilIssues(soilSensor);

        // ── Action plan ─────────────────────────────────────────────────────────
        const actionPlan = buildActionPlan(
            estimatedYieldKg,
            predictedYieldKg,
            targetYieldChoice,
            { ...soilInfo, issues: soilIssues },
            pestInfo
        );

        const response: ResponseBody = {
            farmAreaM2,
            totalPlants,
            totalDamageAreaM2,
            totalLostPlants,
            survivingPlants,
            yieldRemainingPercent,
            yieldLostPercent,
            estimatedYieldKg,
            predictedYieldKg,
            targetYieldKg,
            targetYieldSource,
            soilIssues,
            actionPlan,
        };

        return NextResponse.json(response);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}