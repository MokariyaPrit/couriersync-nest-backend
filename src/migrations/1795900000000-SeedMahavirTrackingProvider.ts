import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMahavirTrackingProvider1795900000000
  implements MigrationInterface
{
  name = 'SeedMahavirTrackingProvider1795900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Shree Mahavir Courier',
        'https://shreemahavircourier.com/',
        'MAHAVIR',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Shree Mahavir Courier')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'MAHAVIR',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://shreemahavircourier.com/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Mahavir Courier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "courier_companies"
      SET "trackingProvider" = NULL
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Mahavir Courier')
        AND "trackingProvider" = 'MAHAVIR'
    `);
  }
}
