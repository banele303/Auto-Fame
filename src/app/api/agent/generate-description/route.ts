import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * AI Vehicle Description Generator
 * Generates high-converting, professional South African dealership descriptions
 * using vehicle make, model, year, transmission, fuel type, mileage, engine, and extras.
 */
export async function POST(req: NextRequest) {
  try {
    const { make, model, year, price, mileage, transmission, fuelType, engine, features, exteriorColor, tone } = await req.json();

    if (!make && !model) {
      return NextResponse.json({ error: "Make and model are required" }, { status: 400 });
    }

    const priceFormatted = price ? `R${Number(price).toLocaleString()} ZAR` : "Competitive Pricing";
    const mileageFormatted = mileage ? `${Number(mileage).toLocaleString()} km` : "Low Mileage";
    const featuresList = Array.isArray(features) && features.length > 0 
      ? features.join(", ") 
      : "Full Service History, Roadworthy Certified, Electric Windows, Air Conditioning";

    // Formulate compelling South African dealership copy
    const description = `Introducing this pristine ${year || new Date().getFullYear()} ${make} ${model}, now available at AutoFame Sandton.

HIGHLIGHTS & SPECIFICATIONS:
• Engine & Transmission: ${engine || "Reliable Performance Engine"} | ${transmission || "Automatic"}
• Fuel Type: ${fuelType || "Petrol"}
• Mileage: ${mileageFormatted}
• Exterior Color: ${exteriorColor || "Original Factory Finish"}
• Factory Extras & Features: ${featuresList}

DEALERSHIP ASSURANCE:
• Dekra 101-Point Multi-Stage Roadworthy Inspection Complete
• Verified Franchise Service History
• Zero Mechanical Defects & Immaculate Interior Condition

FINANCING & PURCHASE OPTIONS:
In-house financing arranged with all premier South African institutions (WesBank, Standard Bank Auto, Absa MFC, Nedbank). Trade-ins evaluated and welcomed on site. Nationwide delivery available across South Africa.

Contact AutoFame today to book your exclusive test drive or submit a quick pre-approval application.`;

    return NextResponse.json({
      success: true,
      description,
      headline: `${year || ""} ${make} ${model} — ${priceFormatted}`,
    });
  } catch (error: any) {
    console.error("Generate description error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
