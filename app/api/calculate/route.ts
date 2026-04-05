// app/api/calculate/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { img, list_of_var }: any = await request.json();

        // Remove base64 prefix if present
        let base64Img = img;
        if (img.startsWith('data:image/')) {
            base64Img = img.split(',')[1];
        }

        const prompt = `
        You are an expert math problem solver with access to handwritten mathematical content. Your goal is to:
        1. CAREFULLY extract the mathematical expression/equation from the handwriting
        2. VALIDATE that extracted text makes mathematical sense
        3. SOLVE the problem correctly using precise calculations
        4. Return results in STRICT JSON format

        CRITICAL VALIDATION RULES:
        - First, identify what you see clearly and note any ambiguous characters
        - For ambiguous digits/symbols (like 0 vs O, 1 vs l, + vs ×), use context clues
        - If handwriting is too illegible, explicitly state the ambiguity in your response
        - ALWAYS verify your calculation twice before returning the result
        - Check for common handwriting misreadings (e.g., 8 might look like 3, 9 might look like 4)

        CALCULATION RULES (PEMDAS - Parentheses, Exponents, Multiplication/Division, Addition/Subtraction):
        - Solve left to right for same-priority operations
        - Example: 2 + 3 * 4 = 2 + 12 = 14 (multiply first)
        - Example: 8 / 2 * 4 = 4 * 4 = 16 (left to right for equal priority)
        - DOUBLE CHECK every calculation result

        FIVE CASE TYPES:

        1. SIMPLE EXPRESSIONS (2 + 2, 5 * 3, etc.):
           Return: [{"expr": "EXACT_EXTRACTED_EXPRESSION", "result": NUMERIC_ANSWER}]

        2. EQUATIONS WITH VARIABLES (x^2 + 2x + 1 = 0, 3x + 5 = 17):
           Solve for ALL variables. Return as comma-separated list:
           [{"expr": "x", "result": SOLUTION_VALUE, "assign": true}, {"expr": "y", "result": SOLUTION_VALUE, "assign": true}]

        3. VARIABLE ASSIGNMENTS (x = 4, y = 5):
           Return: [{"expr": "VARIABLE_NAME", "result": VALUE, "assign": true}]

        4. GRAPHICAL/WORD PROBLEMS (drawings with calculations):
           PAY ATTENTION TO COLORS, SIZES, and visual relationships
           Return: [{"expr": "EXPRESSION_DERIVED_FROM_PROBLEM", "result": ANSWER}]

        5. ABSTRACT CONCEPTS (drawings representing concepts):
           Return: [{"expr": "EXPLANATION_OF_CONCEPT", "result": "CONCEPT_NAME"}]

        CONTEXT VARIABLES (use these if they appear in the expression):
        ${JSON.stringify(list_of_var)}

        MANDATORY FORMAT REQUIREMENTS:
        - Output ONLY valid JSON
        - NO markdown, backticks, or code blocks
        - NO explanations outside JSON
        - ALWAYS properly quote JSON keys and string values
        - Use escape sequences: \\\\n, \\\\f, \\\\t for special characters
        - Return the "expr" field exactly as you determined it from the handwriting

        VERIFICATION STEP (before returning):
        1. Is the JSON valid? (Can be parsed by JSON.parse)
        2. Are all calculations verified to be correct?
        3. Are the result values appropriate types (numbers for math, strings for concepts)?
        4. Does the format match one of the five cases above?

        Now analyze this image and return your answer:
        `;

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY in environment variables');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Img, mimeType: "image/png" } },
                    ],
                },
            ],
        });

        const text = response.text;

        console.log("Gemini response:", JSON.stringify(text));

        return NextResponse.json({ text });

    } catch (error: any) {
        console.log("Couldn't generate response from backend:", error?.message, error);
        return NextResponse.json({
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}