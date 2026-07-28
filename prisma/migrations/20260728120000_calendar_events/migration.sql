-- Calendar: events, recurrence exceptions, reminders, in-app notifications

CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "rrule" TEXT,
    "rruleUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "externalSource" TEXT,
    "externalId" TEXT,
    "etag" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEventException" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "originalStartsAt" TIMESTAMP(3) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "allDay" BOOLEAN,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "eventId" TEXT,
    "remindAt" TIMESTAMP(3),
    "offsetMinutes" INTEGER,
    "rrule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_userId_startsAt_idx" ON "CalendarEvent"("userId", "startsAt");
CREATE INDEX "CalendarEvent_userId_rruleUntil_idx" ON "CalendarEvent"("userId", "rruleUntil");
CREATE INDEX "CalendarEvent_userId_deletedAt_idx" ON "CalendarEvent"("userId", "deletedAt");
CREATE INDEX "CalendarEvent_userId_externalSource_externalId_idx" ON "CalendarEvent"("userId", "externalSource", "externalId");

CREATE UNIQUE INDEX "CalendarEventException_eventId_originalStartsAt_key" ON "CalendarEventException"("eventId", "originalStartsAt");
CREATE INDEX "CalendarEventException_eventId_idx" ON "CalendarEventException"("eventId");

CREATE INDEX "Reminder_userId_remindAt_idx" ON "Reminder"("userId", "remindAt");
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");
CREATE INDEX "Reminder_eventId_idx" ON "Reminder"("eventId");

CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");
CREATE INDEX "Notification_userId_readAt_dueAt_idx" ON "Notification"("userId", "readAt", "dueAt");
CREATE INDEX "Notification_userId_dueAt_idx" ON "Notification"("userId", "dueAt");

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventException" ADD CONSTRAINT "CalendarEventException_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
