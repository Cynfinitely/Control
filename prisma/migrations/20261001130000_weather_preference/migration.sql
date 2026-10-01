-- Weather: per-user forecast location and units

CREATE TABLE "WeatherPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "region" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "units" TEXT NOT NULL DEFAULT 'metric',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeatherPreference_userId_key" ON "WeatherPreference"("userId");

ALTER TABLE "WeatherPreference" ADD CONSTRAINT "WeatherPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
