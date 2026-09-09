import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 첫 마이그레이션 — 지금까지는 dev의 synchronize에만 기대고 있었다.
 * 프로덕션은 synchronize가 꺼져 있어 컬럼이 안 생긴다.
 * dev DB는 synchronize가 이미 만들어 뒀을 수 있으므로 IF NOT EXISTS.
 */
export class PartyVisibility1788912000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "party" ADD COLUMN IF NOT EXISTS "visibility" character varying NOT NULL DEFAULT 'public'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "party" DROP COLUMN "visibility"`);
  }
}
