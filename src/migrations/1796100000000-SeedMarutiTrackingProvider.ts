import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMarutiTrackingProvider1796100000000
  implements MigrationInterface
{
  name = 'SeedMarutiTrackingProvider1796100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Shree Maruti Courier',
        'https://shreemaruti.com/',
        'MARUTI',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Shree Maruti Courier')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'MARUTI',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://shreemaruti.com/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Maruti Courier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "courier_companies"
      SET "trackingProvider" = NULL
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Maruti Courier')
        AND "trackingProvider" = 'MARUTI'
    `);
  }
}
