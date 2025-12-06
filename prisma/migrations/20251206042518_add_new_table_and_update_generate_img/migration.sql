-- AlterTable
ALTER TABLE "GeneratedStyle" ADD COLUMN     "technicalDescription" TEXT;

-- AlterTable
ALTER TABLE "QueueTicket" ADD COLUMN     "targetStyleId" TEXT;

-- CreateTable
CREATE TABLE "SavedHairstyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "styleName" TEXT NOT NULL,
    "englishName" TEXT,
    "imageUrl" TEXT NOT NULL,
    "technicalDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedHairstyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedHairstyle_styleName_idx" ON "SavedHairstyle"("styleName");

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_targetStyleId_fkey" FOREIGN KEY ("targetStyleId") REFERENCES "SavedHairstyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedHairstyle" ADD CONSTRAINT "SavedHairstyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
