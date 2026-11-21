import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitUserConfigFromUserInfo1795600000000
  implements MigrationInterface
{
  name = 'SplitUserConfigFromUserInfo1795600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_config" (
        "id" BIGSERIAL NOT NULL,
        "userId" bigint NOT NULL,
        "sgstPercent" numeric(8,2) NOT NULL DEFAULT '9',
        "cgstPercent" numeric(8,2) NOT NULL DEFAULT '9',
        "igstPercent" numeric(8,2) NOT NULL DEFAULT '0',
        "bookingTabConfig" jsonb,
        "termsAndConditions" jsonb,
        "insurancePercent" numeric(8,2) NOT NULL DEFAULT '2',
        "paymentDays" integer NOT NULL DEFAULT '10',
        "volumetricDivisor" integer NOT NULL DEFAULT '5000',
        "ewayBillThreshold" numeric(14,2) NOT NULL DEFAULT '50000',
        "cargoPrintTemplate" character varying(32) NOT NULL DEFAULT 'CLASSIC_GRID',
        "smtpHost" character varying,
        "smtpPort" integer DEFAULT '587',
        "smtpSecure" boolean NOT NULL DEFAULT false,
        "smtpUser" character varying,
        "smtpPasswordEnc" text,
        "smtpFromEmail" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_config_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_user_config" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_config_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "user_config" (
        "userId",
        "sgstPercent",
        "cgstPercent",
        "igstPercent",
        "bookingTabConfig",
        "termsAndConditions",
        "insurancePercent",
        "paymentDays",
        "volumetricDivisor",
        "ewayBillThreshold",
        "cargoPrintTemplate",
        "smtpHost",
        "smtpPort",
        "smtpSecure",
        "smtpUser",
        "smtpPasswordEnc",
        "smtpFromEmail",
        "createdAt",
        "updatedAt"
      )
      SELECT
        "userId",
        COALESCE("sgstPercent", 9),
        COALESCE("cgstPercent", 9),
        COALESCE("igstPercent", 0),
        "bookingTabConfig",
        "termsAndConditions",
        COALESCE("insurancePercent", 2),
        COALESCE("paymentDays", 10),
        COALESCE("volumetricDivisor", 5000),
        COALESCE("ewayBillThreshold", 50000),
        COALESCE("cargoPrintTemplate", 'CLASSIC_GRID'),
        "smtpHost",
        "smtpPort",
        COALESCE("smtpSecure", false),
        "smtpUser",
        "smtpPasswordEnc",
        "smtpFromEmail",
        COALESCE("createdAt", now()),
        COALESCE("updatedAt", now())
      FROM "user_info"
    `);

    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "sgstPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "cgstPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "igstPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "bookingTabConfig"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "termsAndConditions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "insurancePercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "paymentDays"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "volumetricDivisor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "ewayBillThreshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "cargoPrintTemplate"`,
    );
    await queryRunner.query(`ALTER TABLE "user_info" DROP COLUMN "smtpHost"`);
    await queryRunner.query(`ALTER TABLE "user_info" DROP COLUMN "smtpPort"`);
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "smtpSecure"`,
    );
    await queryRunner.query(`ALTER TABLE "user_info" DROP COLUMN "smtpUser"`);
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "smtpPasswordEnc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "smtpFromEmail"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "sgstPercent" numeric(8,2) NOT NULL DEFAULT '9'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "cgstPercent" numeric(8,2) NOT NULL DEFAULT '9'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "igstPercent" numeric(8,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "bookingTabConfig" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "termsAndConditions" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "insurancePercent" numeric(8,2) NOT NULL DEFAULT '2'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "paymentDays" integer NOT NULL DEFAULT '10'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "volumetricDivisor" integer NOT NULL DEFAULT '5000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "ewayBillThreshold" numeric(14,2) NOT NULL DEFAULT '50000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "cargoPrintTemplate" character varying(32) NOT NULL DEFAULT 'CLASSIC_GRID'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpHost" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpPort" integer DEFAULT '587'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpSecure" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpUser" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpPasswordEnc" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "smtpFromEmail" character varying`,
    );

    await queryRunner.query(`
      UPDATE "user_info" ui SET
        "sgstPercent" = c."sgstPercent",
        "cgstPercent" = c."cgstPercent",
        "igstPercent" = c."igstPercent",
        "bookingTabConfig" = c."bookingTabConfig",
        "termsAndConditions" = c."termsAndConditions",
        "insurancePercent" = c."insurancePercent",
        "paymentDays" = c."paymentDays",
        "volumetricDivisor" = c."volumetricDivisor",
        "ewayBillThreshold" = c."ewayBillThreshold",
        "cargoPrintTemplate" = c."cargoPrintTemplate",
        "smtpHost" = c."smtpHost",
        "smtpPort" = c."smtpPort",
        "smtpSecure" = c."smtpSecure",
        "smtpUser" = c."smtpUser",
        "smtpPasswordEnc" = c."smtpPasswordEnc",
        "smtpFromEmail" = c."smtpFromEmail"
      FROM "user_config" c
      WHERE c."userId" = ui."userId"
    `);

    await queryRunner.query(`DROP TABLE "user_config"`);
  }
}
