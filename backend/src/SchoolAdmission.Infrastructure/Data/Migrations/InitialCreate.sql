CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261109041431_InitialCreate') THEN
    CREATE TABLE admission_classes (
        id uuid NOT NULL,
        name character varying(150) NOT NULL,
        total_seats integer NOT NULL,
        created_at_utc timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "PK_admission_classes" PRIMARY KEY (id),
        CONSTRAINT "CK_admission_classes_total_seats_positive" CHECK (total_seats > 0)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261109041431_InitialCreate') THEN
    CREATE TABLE admission_holds (
        id uuid NOT NULL,
        class_id uuid NOT NULL,
        student_id character varying(17) NOT NULL,
        status character varying(20) NOT NULL,
        created_at_utc timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        expires_at_utc timestamp with time zone NOT NULL,
        confirmed_at_utc timestamp with time zone,
        cancelled_at_utc timestamp with time zone,
        CONSTRAINT "PK_admission_holds" PRIMARY KEY (id),
        CONSTRAINT "CK_admission_holds_status_valid" CHECK (status IN ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
        CONSTRAINT "CK_admission_holds_student_id_17_digits" CHECK (length(student_id) = 17),
        CONSTRAINT "FK_admission_holds_admission_classes_class_id" FOREIGN KEY (class_id) REFERENCES admission_classes (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261109041431_InitialCreate') THEN
    CREATE INDEX idx_holds_class_status_expiry ON admission_holds (class_id, status, expires_at_utc);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261109041431_InitialCreate') THEN
    CREATE INDEX idx_holds_student_created ON admission_holds (student_id, created_at_utc);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261109041431_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261109041431_InitialCreate', '8.0.11');
    END IF;
END $EF$;
COMMIT;

