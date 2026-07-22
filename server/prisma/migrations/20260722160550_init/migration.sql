/*
  Warnings:

  - The primary key for the `Station` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code` on the `Station` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Station` table. All the data in the column will be lost.
  - You are about to drop the `Arrival` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Departure` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[crs]` on the table `Station` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `crs` to the `Station` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Station` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Arrival" DROP CONSTRAINT "Arrival_stationId_fkey";

-- DropForeignKey
ALTER TABLE "Departure" DROP CONSTRAINT "Departure_stationId_fkey";

-- DropIndex
DROP INDEX "Station_code_key";

-- AlterTable
ALTER TABLE "Station" DROP CONSTRAINT "Station_pkey",
DROP COLUMN "code",
DROP COLUMN "createdAt",
ADD COLUMN     "crs" VARCHAR(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Station_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Arrival";

-- DropTable
DROP TABLE "Departure";

-- CreateTable
CREATE TABLE "DepartureBoard" (
    "id" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "stationId" UUID NOT NULL,

    CONSTRAINT "DepartureBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "trainUid" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "departureInfo" TIMESTAMP(3) NOT NULL,
    "operatorId" UUID NOT NULL,
    "statusId" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "platform" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceStop" (
    "id" UUID NOT NULL,
    "serviceId" TEXT NOT NULL,
    "stationId" UUID NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "estimatedTime" TIMESTAMP(3),

    CONSTRAINT "ServiceStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartureBoard_generatedAt_idx" ON "DepartureBoard"("generatedAt");

-- CreateIndex
CREATE INDEX "Service_departureInfo_idx" ON "Service"("departureInfo");

-- CreateIndex
CREATE INDEX "Service_operatorId_idx" ON "Service"("operatorId");

-- CreateIndex
CREATE INDEX "Service_statusId_idx" ON "Service"("statusId");

-- CreateIndex
CREATE INDEX "ServiceStop_serviceId_stopOrder_idx" ON "ServiceStop"("serviceId", "stopOrder");

-- CreateIndex
CREATE INDEX "ServiceStop_stationId_idx" ON "ServiceStop"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_code_key" ON "Operator"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Station_crs_key" ON "Station"("crs");

-- CreateIndex
CREATE INDEX "Station_crs_idx" ON "Station"("crs");

-- AddForeignKey
ALTER TABLE "DepartureBoard" ADD CONSTRAINT "DepartureBoard_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "DepartureBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceStop" ADD CONSTRAINT "ServiceStop_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceStop" ADD CONSTRAINT "ServiceStop_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
