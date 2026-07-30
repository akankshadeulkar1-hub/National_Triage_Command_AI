import { NextResponse } from 'next/server';

type TriageResult = {
    triageColor: 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
    summary: string;
    requiredSpecialty: string;
    urgencyScore: number;
};

function analyzeTriageText(text: string): TriageResult {
    const normalizedText = text.toLowerCase();

    const contains = (keywords: string[]) => keywords.some((keyword) => normalizedText.includes(keyword));

    const fireRelated = contains(['fire', 'house fire', 'building fire', 'burning', 'flames', 'explosion', 'smoke inhalation', 'carbon monoxide']);
    const severeBurns = contains(['third degree', 'third-degree', 'full thickness', 'major burns', 'severe burns', 'deep burns', 'extensive burns']);
    const minorBurns = contains(['minor burn', 'superficial burn', 'small burn', 'first degree', 'first-degree', 'scald']);
    const airwayIssue = contains(['blocked airway', 'airway', 'difficulty breathing', 'shortness of breath', 'choking', 'respiratory distress']);
    const criticalTrauma = contains(['unconscious', 'passed out', 'no pulse', 'chest pain', 'shock', 'severe trauma', 'head injury']);
    const severeBleeding = contains(['severe bleeding', 'heavy bleeding', 'massive bleeding']);
    const fracture = contains(['fracture', 'broken bone', 'broken leg', 'broken arm', 'crushed limb']);
    const deepCut = contains(['deep cut', 'laceration', 'gash', 'stab wound']);
    const minorInjury = contains(['minor cut', 'small cut', 'sprain', 'abrasion', 'walking wounded']);
    const deceased = contains(['deceased', 'dead', 'no signs of life', 'rigor mortis', 'decapitated']);

    if (deceased) {
        return {
            triageColor: 'BLACK',
            summary: 'Non-survivable injuries detected.',
            requiredSpecialty: 'Morgue',
            urgencyScore: 0
        };
    }

    if (airwayIssue || severeBleeding || criticalTrauma || (fireRelated && (severeBurns || airwayIssue || criticalTrauma || contains(['trapped', 'explosion', 'carbon monoxide'])))) {
        return {
            triageColor: 'RED',
            summary: 'Life-threatening condition detected, including possible airway compromise, severe trauma, or major fire-related injury.',
            requiredSpecialty: 'Trauma / Resuscitation',
            urgencyScore: 9
        };
    }

    if (severeBurns || (fireRelated && (contains(['burns', 'burn']) || minorBurns)) || fracture || deepCut) {
        return {
            triageColor: 'YELLOW',
            summary: 'Serious but stable injury requiring urgent evaluation.',
            requiredSpecialty: fracture ? 'Orthopedics' : deepCut ? 'Surgery / Wound Care' : 'Burn / Urgent Care',
            urgencyScore: 6
        };
    }

    if (minorInjury) {
        return {
            triageColor: 'GREEN',
            summary: 'Minor injury with stable presentation.',
            requiredSpecialty: 'General ER',
            urgencyScore: 2
        };
    }

    return {
        triageColor: 'GREEN',
        summary: 'Condition appears stable based on the available details.',
        requiredSpecialty: 'General ER',
        urgencyScore: 3
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const vitalsText = body.vitalsText;

        if (!vitalsText) {
            return NextResponse.json({ error: 'No vitals provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            try {
                const prompt = `
You are an expert Emergency Room Triage AI.
Analyze the following paramedic transcript and assign a triage color based on standard protocols.

Colors to use:
- RED: Immediate, life-threatening, blocked airway, severe trauma, major burns, smoke inhalation, fire incidents with airway compromise
- YELLOW: Serious but stable, broken bones, deep cuts, moderate burns, non-critical but urgent injuries
- GREEN: Minor, walking wounded, stable vitals
- BLACK: Deceased, unsalvageable

Important: Do not default to YELLOW for fire-related incidents. If the transcript describes fire exposure, smoke inhalation, trapped victims, explosion, or major burns, prioritize RED unless the patient is clearly stable and only has minor superficial injury.

Paramedic Transcript: "${vitalsText}"

Return ONLY a valid JSON object in this exact format. Do not include markdown tags like \`\`\`json.
{
  "triageColor": "RED",
  "summary": "Short 1-sentence medical summary of the condition",
  "requiredSpecialty": "e.g., Trauma Center, Orthopedics, General ER",
  "urgencyScore": 9
}
`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1,
                            responseMimeType: 'application/json'
                        }
                    })
                });

                const data = await response.json();

                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const aiResponseText = data.candidates[0].content.parts[0].text;
                    const triageResult = JSON.parse(aiResponseText);

                    return NextResponse.json({
                        success: true,
                        data: triageResult,
                        engine: 'gemini-ai'
                    });
                }
            } catch (aiError) {
                console.error('AI API failed, falling back to rule-based:', aiError);
            }
        }

        const triageResult = analyzeTriageText(vitalsText);

        await new Promise((resolve) => setTimeout(resolve, 800));

        return NextResponse.json({
            success: true,
            data: triageResult,
            engine: 'rule-based-fallback'
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Triage processing failed' }, { status: 500 });
    }
}