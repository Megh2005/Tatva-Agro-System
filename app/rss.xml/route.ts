import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Interface defining individual RSS 2.0 feed items
interface RSSItem {
  guid: string;
  title: string;
  description: string;
  pubDate: string; // Must be RFC 822 format (e.g. Wed, 08 Jul 2026 12:00:00 GMT)
  category: string;
  author: string;
  link: string;
}

// ─── Data Layer ─────────────────────────────────────────────────────────────
// Easily replaceable with a MongoDB query (e.g. `await connectToDatabase(); await Article.find()...`)
async function getFeedItems(): Promise<RSSItem[]> {
  const staticItems: RSSItem[] = [
    {
      guid: "tatva-update-pwa-20260708",
      title: "TATVA Progressive Web App (PWA) Integration Released",
      description: "TATVA is now fully installable as a mobile application. Access real-time satellite imagery, environmental observations, crop disease diagnostics, and PMFBY insurance claims directly from your home screen with smooth offline caching and native app feeling.",
      pubDate: new Date("2026-07-08T12:00:00Z").toUTCString(),
      category: "Feature Release",
      author: "Team Tropical Coders",
      link: "https://tatva.teamdatanexus.xyz/",
    },
    {
      guid: "tatva-update-localization-20260707",
      title: "Automated Multi-lingual Localization & Voice Summaries",
      description: "All emails and suitability reports can now be generated and sent in Hindi, Marathi, Tamil, and Bengali based on user preferences. Plus, a new audio summary feature synthesizes single-paragraph voice guidance for seamless listening.",
      pubDate: new Date("2026-07-07T10:30:00Z").toUTCString(),
      category: "Feature Release",
      author: "Team Tropical Coders",
      link: "https://tatva.teamdatanexus.xyz/tools/floriculture",
    },
    {
      guid: "tatva-update-insurance-20260706",
      title: "PMFBY Insurance Automated Mathematical Claims Calculator",
      description: "We integrated a mathematical ex-gratia calculator that assesses claim payout amounts, interest rates, and scheme eligibility parameters strictly under Pradhan Mantri Fasal Bima Yojana guidelines, requiring only a farmer selfie for verification.",
      pubDate: new Date("2026-07-06T15:00:00Z").toUTCString(),
      category: "Product Update",
      author: "Team Tropical Coders",
      link: "https://tatva.teamdatanexus.xyz/insurance",
    },
    {
      guid: "tatva-advisory-monsoon-20260705",
      title: "Monsoon Preparedness for Paddy Cultivation in India",
      description: "Key cultural steps for rice fields before heavy rain blocks: Ensure optimal drainage pathways to prevent water stagnation, postpone chemical nitrogen sprays, and spray potassium-rich blends to encourage leaf cell defense.",
      pubDate: new Date("2026-07-05T08:00:00Z").toUTCString(),
      category: "Agricultural Advisory",
      author: "Team Tropical Coders",
      link: "https://tatva.teamdatanexus.xyz/tools/disease",
    },
  ];

  return staticItems;
}

// Simple XML string escaper helper
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

// ─── GET Handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const items = await getFeedItems();
    const lastBuildDate = new Date().toUTCString();
    
    // Construct valid RSS 2.0 XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TATVA Agro System</title>
    <link>https://tatva.teamdatanexus.xyz</link>
    <description>TATVA is an AI-enabled precision agriculture ecosystem that helps Indian farmers make smarter, data-driven decisions across the complete agricultural lifecycle.</description>
    <language>en-IN</language>
    <copyright>© ${new Date().getFullYear()} Team Tropical Coders. All rights reserved.</copyright>
    <generator>Next.js RSS 2.0 Engine</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${items[0]?.pubDate || lastBuildDate}</pubDate>
    <atom:link href="https://tatva.teamdatanexus.xyz/rss.xml" rel="self" type="application/rss+xml" />
    <docs>https://github.com/Megh2005/Tatva-Agro-System</docs>
    ${items
      .map((item) => {
        return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <category>${escapeXml(item.category)}</category>
      <author>${escapeXml(item.author)}</author>
      <description><![CDATA[${item.description}]]></description>
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;

    // Return response with Content-Type 'application/rss+xml'
    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        // Cache feed for 1 hour in CDN, and background revalidate
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("RSS generation error:", error);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>Error</title><description>Failed to generate RSS feed: ${escapeXml(error.message || "unknown")}</description></channel></rss>`, {
      status: 500,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    });
  }
}
