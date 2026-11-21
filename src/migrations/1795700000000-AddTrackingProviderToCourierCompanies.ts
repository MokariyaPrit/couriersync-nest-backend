import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrackingProviderToCourierCompanies1795700000000
  implements MigrationInterface
{
  name = 'AddTrackingProviderToCourierCompanies1795700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courier_companies" ADD "trackingProvider" character varying(32)`,
    );

    // Upsert shared Tirupati company for live tracking
    await queryRunner.query(`
      INSERT INTO "courier_companies" (
        "name", "companyLink", "trackingProvider", "isActive", "isShared", "createdById", "createdAt", "updatedAt"
      )
      SELECT
        'Shree Tirupati Courier',
        'https://www.shreetirupaticourier.net/',
        'TIRUPATI',
        true,
        true,
        NULL,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "courier_companies"
        WHERE "deletedAt" IS NULL
          AND LOWER("name") = LOWER('Shree Tirupati Courier')
      )
    `);

    await queryRunner.query(`
      UPDATE "courier_companies"
      SET
        "trackingProvider" = 'TIRUPATI',
        "companyLink" = COALESCE(NULLIF(TRIM("companyLink"), ''), 'https://www.shreetirupaticourier.net/'),
        "isShared" = true,
        "isActive" = true
      WHERE "deletedAt" IS NULL
        AND LOWER("name") = LOWER('Shree Tirupati Courier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courier_companies" DROP COLUMN "trackingProvider"`,
    );
  }
}
