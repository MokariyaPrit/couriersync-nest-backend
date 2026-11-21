import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedNandanTrackingProvider1796000000000
  implements MigrationInterface
{
  name = 'SeedNandanTrackingProvider1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Shree Nandan Courier',
        'https://www.shreenandancourier.com/',
        'NANDAN',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Shree Nandan Courier')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'NANDAN',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://www.shreenandancourier.com/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Nandan Courier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "courier_companies"
      SET "trackingProvider" = NULL
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Nandan Courier')
        AND "trackingProvider" = 'NANDAN'
    `);
  }
}
