import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/utils/anthropic";
import { buildAmexExtractionPrompt } from "@/lib/utils/pdf-prompts";
import type { ParsedTransaction } from "@/types";

// @ts-expect-error pdf-parse has no type definitions
import pdfParse from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const { statementId, bankFormatId } = await request.json();

    if (!statementId || !bankFormatId) {
      return NextResponse.json({ error: "Missing statementId or bankFormatId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch statement record
    const { data: statement, error: stmtErr } = await supabase
      .from("statements")
      .select("*")
      .eq("id", statementId)
      .single();

    if (stmtErr || !statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Download PDF from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("statements")
      .download(statement.file_path);

    if (dlErr || !fileData) {
      return NextResponse.json({ error: `Download failed: ${dlErr?.message}` }, { status: 500 });
    }

    // Extract text with pdf-parse
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text: pdfText } = await pdfParse(buffer);

    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json({ error: "PDF text extraction returned insufficient content" }, { status: 422 });
    }

    // Determine statement year from statement_date or filename
    const statementYear = statement.statement_date
      ? new Date(statement.statement_date).getFullYear()
      : new Date().getFullYear();

    // Call Claude for extraction
    let prompt: string;
    if (bankFormatId === "amex") {
      prompt = buildAmexExtractionPrompt(pdfText, statementYear);
    } else {
      // Generic PDF extraction prompt — can be extended per bank
      prompt = buildAmexExtractionPrompt(pdfText, statementYear);
    }

    const response = await callClaude(
      "You are a precise financial data extraction tool. Return only valid JSON, no markdown fences.",
      prompt,
      { maxTokens: 16384 }
    );

    // Parse JSON from response (handle potential markdown fences)
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const rawTransactions = JSON.parse(jsonStr) as Array<{
      date: string;
      description: string;
      originalDescription: string;
      amountPence: number;
      direction: "debit" | "credit";
      foreignAmount: string | null;
      foreignCurrency: string | null;
    }>;

    // Transform to ParsedTransaction format
    const transactions: ParsedTransaction[] = rawTransactions.map((t) => ({
      date: t.date,
      description: t.description,
      originalDescription: t.originalDescription || t.description,
      amountPence: Math.round(t.amountPence),
      direction: t.direction,
      categoryId: null,
      categoryName: null,
      confidence: null,
      foreignAmount: t.foreignAmount || null,
      foreignCurrency: t.foreignCurrency || null,
      isDuplicate: false,
      duplicateOf: null,
      excluded: false,
    }));

    return NextResponse.json({
      transactions,
      pdfTextLength: pdfText.length,
      rawTransactionCount: rawTransactions.length,
    });
  } catch (error: any) {
    console.error("Parse statement error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
