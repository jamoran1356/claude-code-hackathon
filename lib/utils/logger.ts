import { prisma } from '@/lib/db/client';

/**
 * Log audit event
 */
export async function logAudit(
  action: string,
  userId: string | null,
  resource: string | null,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || undefined,
        resource,
        details: details || {},
        ipAddress,
        userAgent: 'API',
        success: true,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

/**
 * Log error event
 */
export async function logError(
  action: string,
  userId: string | null,
  resource: string | null,
  ipAddress: string,
  error: Error
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || undefined,
        resource,
        details: { error: error.message },
        ipAddress,
        userAgent: 'API',
        success: false,
        errorMessage: error.message,
      },
    });
  } catch (err) {
    console.error('Error log failed:', err);
  }
}

/**
 * Console log with timestamp
 */
export function log(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * Console error with timestamp
 */
export function logErr(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error || '');
}
