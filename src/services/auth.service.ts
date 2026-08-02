import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

const BCRYPT_SALT_ROUNDS = 10;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ success: true; user: Pick<User, 'id' | 'email' | 'name'> } | { success: false; error: string }> {
  const normalizedEmail = normalizeEmail(input.email);

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const emailVerificationToken = crypto.randomUUID();

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      name: input.name.trim(),
      passwordHash,
      isEmailVerified: false,
      emailVerificationToken,
    },
    select: { id: true, email: true, name: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(
    `[DEV EMAIL VERIFICATION LINK]: ${appUrl}/api/auth/verify-email?token=${emailVerificationToken}`,
  );

  return { success: true, user };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ success: true; user: Pick<User, 'id' | 'email' | 'name'> } | { success: false; error: string }> {
  const normalizedEmail = normalizeEmail(input.email);

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return {
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function getUserById(
  id: string
): Promise<Pick<User, 'id' | 'email' | 'name' | 'isEmailVerified'> | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, isEmailVerified: true },
  });
  return user;
}

export async function verifyEmail(input: {
  token: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await db.user.findUnique({
    where: { emailVerificationToken: input.token },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: 'Invalid or expired verification link.' };
  }

  await db.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerificationToken: null },
  });

  return { success: true };
}
