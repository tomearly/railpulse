-- CreateTable
CREATE TABLE "Arrival" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "platform" TEXT,
    "status" TEXT NOT NULL,
    "delayMins" INTEGER,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arrival_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Arrival" ADD CONSTRAINT "Arrival_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
