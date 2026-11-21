import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAnjaniTrackingProvider1795800000000
  implements MigrationInterface
{
  name = 'SeedAnjaniTrackingProvider1795800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Shree Anjani Courier',
        'https://shreeanjani.co.in/',
        'ANJANI',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Shree Anjani Courier')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'ANJANI',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://shreeanjani.co.in/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Anjani Courier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "courier_companies"
      SET "trackingProvider" = NULL
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Anjani Courier')
        AND "trackingProvider" = 'ANJANI'
    `);
  }
}
