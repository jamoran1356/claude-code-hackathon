import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyJWT } from '@/lib/auth/jwt';
import { executeBlockchainTrade } from '@/lib/blockchain/marketplace';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { logAudit } from '@/lib/utils/logger';

const tradeSchema = z.object({
  promptId: z.string().uuid(),
  action: z.enum(['buy', 'sell']),
  amount: z.number().min(1).max(100),
  price: z.number().min(0.01),
});

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/trades', 50);

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    const userId = searchParams.get('userId');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = Math.min(parseInt(searchParams.get('take') || '20'), 100);

    const where = {
      ...(promptId && { promptId }),
      ...(userId && { traderId: userId }),
    };

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          prompt: { select: { title: true } },
          trader: { select: { username: true } },
        },
      }),
      prisma.trade.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: trades,
        pagination: { skip, take, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/v1/trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/trades', 20);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { promptId, action, amount, price } = parsed.data;

    // Verify prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Calculate total and fees
    const total = amount * price;
    const creatorFee = total * 0.5;
    const protocolFee = total * 0.4;
    const validatorFee = total * 0.1;

    // Execute blockchain trade
    const txHash = await executeBlockchainTrade({
      promptId,
      trader: decoded.userId,
      action,
      amount,
      price,
    });

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        promptId,
        traderId: decoded.userId,
        action,
        amount,
        price,
        total,
        creatorFee,
        protocolFee,
        validatorFee,
        txHash,
        status: 'confirmed',
      },
      include: {
        prompt: { select: { title: true, creator: true } },
      },
    });

    // Update prompt stats
    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        totalUsage: { increment: 1 },
        totalRevenue: { increment: total },
      },
    });

    // Audit log
    await logAudit(
      `TRADE_${action.toUpperCase()}`,
      decoded.userId,
      promptId,
      clientIp,
      { amount, price, txHash }
    );

    return NextResponse.json(
      {
        success: true,
        data: trade,
        txHash,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/trades error:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    );
  }
}
