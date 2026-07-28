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

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      name: input.name.trim(),
      passwordHash,
      isEmailVerified: true,
    },
    select: { id: true, email: true, name: true },
  });

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
): Promise<Pick<User, 'id' | 'email' | 'name'> | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  return user;
}
