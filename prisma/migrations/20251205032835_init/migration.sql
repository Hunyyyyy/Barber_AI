-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'BARBER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('WAITING', 'CALLING', 'SERVING', 'PROCESSING', 'FINISHING', 'COMPLETED', 'PAID', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "FaceShape" AS ENUM ('OVAL', 'ROUND', 'SQUARE', 'DIAMOND', 'HEART', 'OBLONG', 'TRIANGLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "faceShape" "FaceShape",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSetting" (
    "id" TEXT NOT NULL DEFAULT '1',
    "morningOpen" TEXT NOT NULL DEFAULT '08:00',
    "morningClose" TEXT NOT NULL DEFAULT '11:00',
    "afternoonOpen" TEXT NOT NULL DEFAULT '13:30',
    "afternoonClose" TEXT NOT NULL DEFAULT '18:00',
    "maxDailyTickets" INTEGER NOT NULL DEFAULT 50,
    "isShopOpen" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationWork" INTEGER NOT NULL,
    "durationWait" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBusy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Barber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_DATE,
    "userId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'WAITING',
    "barberId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedStartTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "isPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketService" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,

    CONSTRAINT "TicketService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HairAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalImageUrl" TEXT NOT NULL,
    "analysisResult" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HairAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedStyle" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "styleName" TEXT NOT NULL,
    "generatedImageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "QueueTicket_date_status_idx" ON "QueueTicket"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_date_ticketNumber_key" ON "QueueTicket"("date", "ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TicketService_ticketId_serviceId_key" ON "TicketService"("ticketId", "serviceId");

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketService" ADD CONSTRAINT "TicketService_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "QueueTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketService" ADD CONSTRAINT "TicketService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HairAnalysis" ADD CONSTRAINT "HairAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedStyle" ADD CONSTRAINT "GeneratedStyle_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "HairAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
