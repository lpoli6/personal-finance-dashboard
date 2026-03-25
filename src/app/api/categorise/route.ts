import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/utils/anthropic";

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json() as {
      transactions: { index: number; description: string; amountPence: number; direction: string }[];
    };

    if (!transactions?.length) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all categories
    const { data: categories } = await supabase
      .from("transaction_categories")
      .select("id, name, parent_category_id, type")
      .order("name");

    if (!categories?.length) {
      return NextResponse.json({ error: "No categories found" }, { status: 500 });
    }

    // Build category list for prompt
    const parentCats = categories.filter((c) => !c.parent_category_id);
    const categoryList = parentCats
      .map((p) => {
        const children = categories.filter((c) => c.parent_category_id === p.id);
        if (children.length > 0) {
          const childList = children.map((c) => `    - ${c.name} (${c.id})`).join("\n");
          return `  - ${p.name} (${p.id}) [${p.type}]\n${childList}`;
        }
        return `  - ${p.name} (${p.id}) [${p.type}]`;
      })
      .join("\n");

    const txList = transactions
      .map((t) => `${t.index}. "${t.description}" — £${(t.amountPence / 100).toFixed(2)} (${t.direction})`)
      .join("\n");

    const response = await callClaude(
      "You are a UK personal finance categorisation assistant. Return only valid JSON.",
      `Categorise each transaction into the most appropriate category. Prefer child categories over parent categories when applicable.

CATEGORIES:
${categoryList}

TRANSACTIONS:
${txList}

Return a JSON array:
[{ "index": 0, "categoryId": "uuid", "confidence": 0.95 }]

For each transaction, pick the single best category. Set confidence 0.0-1.0 based on how certain you are.`
    );

    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const mappings = JSON.parse(jsonStr) as Array<{
      index: number;
      categoryId: string;
      confidence: number;
    }>;

    // Attach category names
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const result = mappings.map((m) => ({
      ...m,
      categoryName: catMap.get(m.categoryId) || null,
    }));

    return NextResponse.json({ mappings: result });
  } catch (error: any) {
    console.error("Categorise error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
