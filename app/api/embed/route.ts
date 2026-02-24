import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    // Simple robust chunking for RAG
    const chunkSize = 1000;
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [word];
        currentLength = word.length;
      } else {
        currentChunk.push(word);
        currentLength += word.length + 1;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }

    // Embed all chunks (Limit to 30 chunks to respect fast API rate limits)
    const chunkEmbeddings = await Promise.all(
      chunks.slice(0, 30).map(async (chunk) => {
        try {
          const result = await model.embedContent(chunk);
          return {
            text: chunk,
            embedding: result.embedding.values,
          };
        } catch (err) {
          console.error("Embedding chunk failed", err);
          return null;
        }
      })
    );

    const validChunks = chunkEmbeddings.filter(c => c !== null);

    return NextResponse.json({ chunks: validChunks });
  } catch (error: any) {
    console.error("Embedding generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
