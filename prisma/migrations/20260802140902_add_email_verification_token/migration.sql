-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerificationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
