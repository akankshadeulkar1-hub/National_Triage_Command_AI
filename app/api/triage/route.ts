import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {

        const body = await req.json();
        const vitalsText = body.vitalsText;

        // Agar frontend se koi data nahi aaya
        if (!vitalsText) {
            return NextResponse.json({ error: "No vitals provided" }, { status: 400 });
        }

        // Aapko apni .env.local file me GEMINI_API_KEY dalni hogi isko chalane ke liye
        const apiKey = process.env.GEMINI_API_KEY;

        // Agar API Key available hai, toh hum ASLI AI ka use karenge
        if (apiKey) {
            try {
                const prompt = `
          You are an expert Emergency Room Triage AI. 
          Analyze the following paramedic voice transcript and assign a triage color based on standard medical protocols.
          
          Colors to use: 
          - RED (Immediate, life-threatening, blocked airway, severe trauma)
          - YELLOW (Delayed, serious but stable, broken bones, deep cuts)
          - GREEN (Minor, walking wounded, stable vitals)
          - BLACK (Deceased, unsalvageable)
          
          Paramedic Transcript: "${vitalsText}"
          
          Return ONLY a valid JSON object in this exact format. Do not include markdown tags like \`\`\`json.
          {
            "triageColor": "RED", 
            "summary": "Short 1-sentence medical summary of the condition",
            "requiredSpecialty": "e.g., Trauma Center, Orthopedics, General ER",
            "urgencyScore": 9
          }
        `;

                // Direct fetch to Gemini API (No external SDK needed)
                // Yahan 'gemini-2.5-flash' ki jagah 'gemini-1.5-flash' kar diya hai
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1, // Low temperature for strict, factual medical logic
                            responseMimeType: "application/json" // Force JSON output
                        }
                    })
                });

                const data = await response.json();

                // Extracting AI's JSON response
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    const aiResponseText = data.candidates[0].content.parts[0].text;
                    const triageResult = JSON.parse(aiResponseText);

                    // Return the SMART AI response
                    return NextResponse.json({
                        success: true,
                        data: triageResult,
                        engine: "gemini-ai"
                    });
                }
            } catch (aiError) {
                console.error("AI API failed, falling back to rule-based:", aiError);
              
            }
        }

        // Yeh purana logic hai. Yeh tabhi chalega jab aapke paas API key nahi hogi.
        const textToAnalyze = vitalsText.toLowerCase();

        let triageResult = {
            triageColor: 'GREEN',
            summary: 'Patient appears stable based on limited data.',
            requiredSpecialty: 'General ER',
            urgencyScore: 2
        };

        if (textToAnalyze.includes('unconscious') ||
            textToAnalyze.includes('passed out') ||
            textToAnalyze.includes('severe bleeding') ||
            textToAnalyze.includes('chest pain') ||
            textToAnalyze.includes('no pulse') ||
            textToAnalyze.includes('blocked airway')) {
            triageResult = {
                triageColor: 'RED',
                summary: 'Critical condition detected (Rule-based match).',
                requiredSpecialty: 'Trauma / Resuscitation',
                urgencyScore: 9
            };
        }
        else if (textToAnalyze.includes('broken bone') ||
            textToAnalyze.includes('fracture') ||
            textToAnalyze.includes('deep cut') ||
            textToAnalyze.includes('burn')) {
            triageResult = {
                triageColor: 'YELLOW',
                summary: 'Serious but stable condition (Rule-based match).',
                requiredSpecialty: 'Orthopedics / Urgent Care',
                urgencyScore: 6
            };
        }
        else if (textToAnalyze.includes('decapitated') ||
            textToAnalyze.includes('rigor mortis')) {
            triageResult = {
                triageColor: 'BLACK',
                summary: 'Non-survivable injuries (Rule-based match).',
                requiredSpecialty: 'Morgue',
                urgencyScore: 0
            };
        }

        // Fake delay to simulate thinking for the fallback
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return NextResponse.json({
            success: true,
            data: triageResult,
            engine: "rule-based-fallback"
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: "Triage processing failed" }, { status: 500 });
    }
}