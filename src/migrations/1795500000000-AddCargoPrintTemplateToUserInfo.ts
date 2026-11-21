import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCargoPrintTemplateToUserInfo1795500000000
  implements MigrationInterface
{
  name = 'AddCargoPrintTemplateToUserInfo1795500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD "cargoPrintTemplate" character varying(32) NOT NULL DEFAULT 'CLASSIC_GRID'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP COLUMN "cargoPrintTemplate"`,
    );
  }
}
