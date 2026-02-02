import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyJWT } from '@/lib/auth/jwt';
import { evaluatePromptWithClaude } from '@/lib/services/claude';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { logAudit } from '@/lib/utils/logger';

const createPromptSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(100),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/prompts', 100);

    // Get query params
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = Math.min(parseInt(searchParams.get('take') || '20'), 100);
    const category = searchParams.get('category');

    // Build filter
    const where = category ? { category } : {};

    // Fetch prompts
    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        skip,
        take,
        orderBy: { qualityScore: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          qualityScore: true,
          tokenPrice: true,
          totalUsage: true,
          createdAt: true,
          creator: { select: { username: true, walletAddress: true } },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: prompts,
        pagination: { skip, take, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/v1/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/prompts', 10);

    // Verify JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = createPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, category } = parsed.data;

    // Evaluate with Claude
    const evaluation = await evaluatePromptWithClaude(title, description);

    // Create prompt in DB
    const prompt = await prisma.prompt.create({
      data: {
        title,
        description,
        category,
        creatorId: decoded.userId,
        qualityScore: evaluation.score,
        tokenPrice: (evaluation.score / 10).toFixed(2),
      },
      include: {
        creator: { select: { username: true, walletAddress: true } },
      },
    });

    // Audit log
    await logAudit('PROMPT_CREATED', decoded.userId, prompt.id, clientIp);

    return NextResponse.json(
      {
        success: true,
        data: prompt,
        evaluation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
