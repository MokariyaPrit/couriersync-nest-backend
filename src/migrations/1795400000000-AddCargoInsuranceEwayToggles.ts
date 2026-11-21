import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCargoInsuranceEwayToggles1795400000000
  implements MigrationInterface
{
  name = 'AddCargoInsuranceEwayToggles1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "insuranceEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "insurancePercent" numeric(8,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "ewayBillEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "ewayBillPercent" numeric(8,3)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "ewayBillPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "ewayBillEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "insurancePercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "insuranceEnabled"`,
    );
  }
}
