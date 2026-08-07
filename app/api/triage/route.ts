import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type TriageResult = {
    triageColor: 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
    summary: string;
    requiredSpecialty: string;
    urgencyScore: number;
    first_aid_steps: string[];
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
            urgencyScore: 0,
            first_aid_steps: [
                'Verify absence of pulse and spontaneous respiration.',
                'Keep incident scene secure and undisturbed for emergency responders.',
                'Cover patient respectfully until medical examiner or coroner arrives.'
            ]
        };
    }

    if (airwayIssue || severeBleeding || criticalTrauma || (fireRelated && (severeBurns || airwayIssue || criticalTrauma || contains(['trapped', 'explosion', 'carbon monoxide'])))) {
        return {
            triageColor: 'RED',
            summary: 'Life-threatening condition detected, including possible airway compromise, severe trauma, or major fire-related injury.',
            requiredSpecialty: 'Trauma / Resuscitation',
            urgencyScore: 9,
            first_aid_steps: [
                'Maintain open airway and position patient on their side if vomiting.',
                'Apply firm, continuous direct pressure to active bleeding sites with clean cloth.',
                'Keep patient warm, still, and flat to treat for impending clinical shock.',
                'Do not give anything by mouth until paramedic arrival.'
            ]
        };
    }

    if (severeBurns || (fireRelated && (contains(['burns', 'burn']) || minorBurns)) || fracture || deepCut) {
        return {
            triageColor: 'YELLOW',
            summary: 'Serious but stable injury requiring urgent evaluation.',
            requiredSpecialty: fracture ? 'Orthopedics' : deepCut ? 'Surgery / Wound Care' : 'Burn / Urgent Care',
            urgencyScore: 6,
            first_aid_steps: [
                'Immobilize injured limb using rigid splint or padding without forcing alignment.',
                'Cool thermal burn areas under cool running water for at least 10 minutes.',
                'Apply sterile, non-adherent dressing or clean cloth over open wounds.',
                'Monitor vital signs closely and keep patient calm until transport arrives.'
            ]
        };
    }

    if (minorInjury) {
        return {
            triageColor: 'GREEN',
            summary: 'Minor injury with stable presentation.',
            requiredSpecialty: 'General ER',
            urgencyScore: 2,
            first_aid_steps: [
                'Clean wound gently with clean water or saline.',
                'Apply sterile bandage or adhesive dressing.',
                'Rest and elevate affected area to reduce discomfort.'
            ]
        };
    }

    return {
        triageColor: 'GREEN',
        summary: 'Condition appears stable based on the available details.',
        requiredSpecialty: 'General ER',
        urgencyScore: 3,
        first_aid_steps: [
            'Keep patient comfortable in a safe, seated position.',
            'Monitor breathing and consciousness levels.',
            'Re-evaluate immediately if symptoms worsen before paramedic arrival.'
        ]
    };
}

export async function POST(req: Request) {
    try {
        let vitalsText = '';
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            vitalsText = (formData.get('transcript') as string) || (formData.get('vitalsText') as string) || '';
        } else {
            const body = await req.json();
            vitalsText = body.vitalsText || body.transcript || '';
        }

        if (!vitalsText.trim()) {
            vitalsText = 'Patient assessment submitted for emergency triage evaluation.';
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

Based on the clinical summary and paramedic transcript, provide 3 to 5 immediate, actionable first-aid steps for a dispatcher to read over the phone. Return ONLY valid JSON matching the schema.

Paramedic Transcript: "${vitalsText}"

Return ONLY a valid JSON object in this exact format. Do not include markdown tags like \`\`\`json.
{
  "triageColor": "RED",
  "summary": "Short 1-sentence medical summary of the condition",
  "requiredSpecialty": "e.g., Trauma Center, Orthopedics, General ER",
  "urgencyScore": 9,
  "first_aid_steps": [
    "Maintain open airway and check breathing continuously.",
    "Apply firm direct pressure to active bleeding sites with clean cloth.",
    "Keep patient warm and still to prevent shock."
  ]
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
                    const parsed = JSON.parse(aiResponseText);

                    const fallbackResult = analyzeTriageText(vitalsText);

                    return NextResponse.json({
                        priority: parsed.triageColor || fallbackResult.triageColor,
                        category: parsed.requiredSpecialty || fallbackResult.requiredSpecialty,
                        summary: parsed.summary || fallbackResult.summary,
                        confidence_score: 0.95,
                        transcript: vitalsText,
                        urgencyScore: parsed.urgencyScore || fallbackResult.urgencyScore,
                        first_aid_steps: (parsed.first_aid_steps && Array.isArray(parsed.first_aid_steps) && parsed.first_aid_steps.length > 0)
                            ? parsed.first_aid_steps
                            : fallbackResult.first_aid_steps
                    });
                }
            } catch (aiError) {
                console.error('AI API failed, falling back to rule-based:', aiError);
            }
        }

        const triageResult = analyzeTriageText(vitalsText);

        return NextResponse.json({
            priority: triageResult.triageColor,
            category: triageResult.requiredSpecialty,
            summary: triageResult.summary,
            confidence_score: 0.88,
            transcript: vitalsText,
            urgencyScore: triageResult.urgencyScore,
            first_aid_steps: triageResult.first_aid_steps
        });
    } catch (error) {
        return NextResponse.json({ error: 'Triage processing failed' }, { status: 500 });
    }
}