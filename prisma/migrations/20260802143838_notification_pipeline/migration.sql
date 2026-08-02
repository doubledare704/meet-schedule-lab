-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SLOT_STARTING_SOON';

-- CreateIndex
CREATE UNIQUE INDEX "notifications_bookingId_type_key" ON "notifications"("bookingId", "type");
