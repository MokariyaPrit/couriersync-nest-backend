import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCargoFieldsToConsignments1795300000000
  implements MigrationInterface
{
  name = 'AddCargoFieldsToConsignments1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."consignments_shipmentkind_enum" AS ENUM('REGULAR', 'CARGO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "shipmentKind" "public"."consignments_shipmentkind_enum" NOT NULL DEFAULT 'REGULAR'`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "numberOfBoxes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "grossAmt" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "otherChargeLabel" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "otherChargeAmt" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "fuelChargePercent" numeric(8,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "fuelChargeAmt" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "insuranceAmt" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "ewayBillAmt" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "parcelValue" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "heightCm" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "lengthCm" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "widthCm" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ADD "volumetricDivisor" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "volumetricDivisor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "widthCm"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "lengthCm"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "heightCm"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "parcelValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "ewayBillAmt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "insuranceAmt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "fuelChargeAmt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "fuelChargePercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "otherChargeAmt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "otherChargeLabel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "grossAmt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "numberOfBoxes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" DROP COLUMN "shipmentKind"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."consignments_shipmentkind_enum"`,
    );
  }
}
