import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await context.params;
        const id = resolvedParams?.id || 'dispatch-demo-1';
        let body: any = {};
        try {
            body = await req.json();
        } catch (e) {}

        const bedAssigned = body.bedAssigned || `BED-${Math.floor(Math.random() * 8) + 1}`;
        const status = body.status || 'ACCEPTED';

        return NextResponse.json({
            id: id,
            bedAssigned: bedAssigned,
            status: status,
            message: 'Bed successfully reserved in Emergency Department',
            timestamp: Date.now()
        });
    } catch (error) {
        return NextResponse.json({ error: 'Bed assignment failed' }, { status: 500 });
    }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    return POST(req, context);
}
