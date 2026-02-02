import { prisma } from '@/lib/db/client';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  '/api/v1/health': 1000,
  '/api/v1/prompts': 100,
  '/api/v1/trades': 20,
  '/api/v1/breeding': 10,
};

/**
 * Check rate limit for endpoint
 */
export async function rateLimit(
  identifier: string, // IP or user ID
  endpoint: string,
  customLimit?: number
): Promise<boolean> {
  const limit = customLimit || RATE_LIMITS[endpoint] || 100;
  const now = new Date();
  const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW * 1000);

  try {
    // Try to find existing rate limit record
    const existing = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint,
        },
      },
    });

    if (existing) {
      // Check if window has expired
      if (existing.resetAt < now) {
        // Reset counter
        await prisma.rateLimit.update({
          where: {
            identifier_endpoint: {
              identifier,
              endpoint,
            },
          },
          data: {
            count: 1,
            resetAt,
          },
        });
        return true;
      }

      // Check if limit exceeded
      if (existing.count >= limit) {
        return false;
      }

      // Increment counter
      await prisma.rateLimit.update({
        where: {
          identifier_endpoint: {
            identifier,
            endpoint,
          },
        },
        data: {
          count: existing.count + 1,
        },
      });

      return true;
    } else {
      // Create new rate limit record
      await prisma.rateLimit.create({
        data: {
          identifier,
          endpoint,
          count: 1,
          resetAt,
        },
      });

      return true;
    }
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request on error to avoid blocking
    return true;
  }
}

/**
 * Get remaining requests for identifier
 */
export async function getRemainingRequests(
  identifier: string,
  endpoint: string,
  customLimit?: number
): Promise<number> {
  const limit = customLimit || RATE_LIMITS[endpoint] || 100;

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint,
        },
      },
    });

    if (!existing) {
      return limit;
    }

    const now = new Date();
    if (existing.resetAt < now) {
      return limit;
    }

    return Math.max(0, limit - existing.count);
  } catch (error) {
    console.error('Get remaining requests failed:', error);
    return limit;
  }
}
