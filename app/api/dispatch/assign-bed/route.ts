import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const dispatchId = body.id || body.dispatchId || 'dispatch-demo-1';
        const bedAssigned = body.bedAssigned || `BED-${Math.floor(Math.random() * 8) + 1}`;
        const status = body.status || 'ACCEPTED';

        return NextResponse.json({
            id: dispatchId,
            bedAssigned: bedAssigned,
            status: status,
            message: 'Bed successfully reserved in Emergency Department',
            timestamp: Date.now()
        });
    } catch (error) {
        return NextResponse.json({ error: 'Bed assignment failed' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    return POST(req);
}
