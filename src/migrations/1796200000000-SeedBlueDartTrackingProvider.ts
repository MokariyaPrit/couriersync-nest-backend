import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBlueDartTrackingProvider1796200000000
  implements MigrationInterface
{
  name = 'SeedBlueDartTrackingProvider1796200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Blue Dart',
        'https://www.bluedart.com/',
        'BLUEDART',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Blue Dart')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'BLUEDART',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://www.bluedart.com/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Blue Dart')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "courier_companies"
      SET "trackingProvider" = NULL
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Blue Dart')
        AND "trackingProvider" = 'BLUEDART'
    `);
  }
}
