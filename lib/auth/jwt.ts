import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EXPIRY = process.env.JWT_EXPIRY || '900'; // 15 minutes

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

/**
 * Create JWT token
 */
export function createJWT(userId: string, walletAddress: string): string {
  return jwt.sign(
    {
      userId,
      walletAddress,
    },
    SECRET,
    {
      expiresIn: parseInt(EXPIRY),
    }
  );
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Decode token without verification (for reading claims)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}
