import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyJWT } from '@/lib/auth/jwt';
import { breedPromptsOnChain } from '@/lib/blockchain/breeding';
import { evaluatePromptWithClaude } from '@/lib/services/claude';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { logAudit } from '@/lib/utils/logger';

const breedSchema = z.object({
  parent1Id: z.string().uuid(),
  parent2Id: z.string().uuid(),
  childName: z.string().min(3).max(255),
  childSymbol: z.string().min(1).max(20),
});

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/breeding', 50);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = Math.min(parseInt(searchParams.get('take') || '20'), 100);

    const where = userId ? { breederId: userId } : {};

    const [breedings, total] = await Promise.all([
      prisma.breedingEvent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          breeder: { select: { username: true } },
        },
      }),
      prisma.breedingEvent.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: breedings,
        pagination: { skip, take, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/v1/breeding error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breedings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimit(clientIp, '/api/v1/breeding', 10);

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
    const parsed = breedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { parent1Id, parent2Id, childName, childSymbol } = parsed.data;

    // Validate parents exist and are different
    if (parent1Id === parent2Id) {
      return NextResponse.json(
        { error: 'Cannot breed with same parent' },
        { status: 400 }
      );
    }

    const [parent1, parent2] = await Promise.all([
      prisma.prompt.findUnique({ where: { id: parent1Id } }),
      prisma.prompt.findUnique({ where: { id: parent2Id } }),
    ]);

    if (!parent1 || !parent2) {
      return NextResponse.json(
        { error: 'One or both parents not found' },
        { status: 404 }
      );
    }

    // Check quality requirements (both must be >= 60)
    if (parent1.qualityScore < 60 || parent2.qualityScore < 60) {
      return NextResponse.json(
        { error: 'Parent quality must be >= 60' },
        { status: 400 }
      );
    }

    // Check breeding cooldown (24 hours)
    const lastBreeding = await prisma.breedingEvent.findFirst({
      where: { breederId: decoded.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastBreeding) {
      const cooldownUntil = new Date(lastBreeding.createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() < cooldownUntil) {
        return NextResponse.json(
          { error: `Breeding cooldown active until ${cooldownUntil.toISOString()}` },
          { status: 429 }
        );
      }
    }

    // Generate child prompt description using Claude
    const childEvaluation = await evaluatePromptWithClaude(
      childName,
      `Hybrid of: ${parent1.title} (${parent1.qualityScore}/100) and ${parent2.title} (${parent2.qualityScore}/100)`
    );

    // Average quality of parents
    const childQuality = Math.round((parent1.qualityScore + parent2.qualityScore) / 2);

    // Execute breeding on blockchain
    const childTokenAddress = await breedPromptsOnChain({
      parent1: parent1.contractAddress || '',
      parent2: parent2.contractAddress || '',
      childName,
      childSymbol,
    });

    // Create breeding event
    const breeding = await prisma.breedingEvent.create({
      data: {
        parent1Id,
        parent2Id,
        breederId: decoded.userId,
        childTitle: childName,
        childDescription: `Hybrid of ${parent1.title} and ${parent2.title}`,
        childQuality,
        txHash: childTokenAddress,
        status: 'confirmed',
      },
    });

    // Create child prompt
    const childPrompt = await prisma.prompt.create({
      data: {
        title: childName,
        description: `Hybrid of ${parent1.title} and ${parent2.title}. Parent 1 quality: ${parent1.qualityScore}, Parent 2 quality: ${parent2.qualityScore}`,
        category: 'hybrid',
        creatorId: decoded.userId,
        qualityScore: childQuality,
        tokenPrice: ((childQuality / 10).toFixed(2)),
        contractAddress: childTokenAddress,
        isHybrid: true,
        parentId1: parent1Id,
        parentId2: parent2Id,
      },
    });

    // Update breeding event with child prompt ID
    await prisma.breedingEvent.update({
      where: { id: breeding.id },
      data: { childPromptId: childPrompt.id },
    });

    // Audit log
    await logAudit(
      'BREEDING_EXECUTED',
      decoded.userId,
      breeding.id,
      clientIp,
      { parent1Id, parent2Id, childQuality }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          breeding,
          childPrompt,
          evaluation: childEvaluation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/breeding error:', error);
    return NextResponse.json(
      { error: 'Failed to execute breeding' },
      { status: 500 }
    );
  }
}
