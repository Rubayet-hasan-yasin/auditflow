import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param plainPassword - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword - The plain text password
 * @param hashedPassword - The hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a salt for bcrypt hashing
 * @param rounds - Number of salt rounds (default: 10)
 * @returns The generated salt
 */
export async function generateSalt(rounds: number = SALT_ROUNDS): Promise<string> {
  return bcrypt.genSalt(rounds);
}

/**
 * Hash a password with a custom salt
 * @param plainPassword - The plain text password
 * @param salt - The salt to use
 * @returns The hashed password
 */
export async function hashWithSalt(
  plainPassword: string,
  salt: string,
): Promise<string> {
  return bcrypt.hash(plainPassword, salt);
}
