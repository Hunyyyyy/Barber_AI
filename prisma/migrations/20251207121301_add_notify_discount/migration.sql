-- AlterTable
ALTER TABLE "ShopSetting" ADD COLUMN     "announcementText" TEXT,
ADD COLUMN     "isAnnouncementShow" BOOLEAN NOT NULL DEFAULT true;
