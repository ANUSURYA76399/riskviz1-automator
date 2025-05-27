-- CreateTable
CREATE TABLE "RiskRecord" (
    "id" SERIAL NOT NULL,
    "respondentType" TEXT NOT NULL,
    "hotspot" TEXT NOT NULL,
    "aoLocation" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "rpScore" DOUBLE PRECISION NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "severity" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskRecord_pkey" PRIMARY KEY ("id")
);
