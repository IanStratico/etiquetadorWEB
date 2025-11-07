import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type PieceSource = "CLADD" | "IMPORTADO";

@Entity({ name: "pieces" })
export class Piece {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "piece_id", type: "varchar", length: 191 })
  pieceId!: string;

  @Column({ type: "varchar", length: 50 })
  source!: PieceSource;

  @Column({ type: "text" })
  article!: string;

  @Column({ type: "text" })
  color!: string;

  @Column({ type: "text" })
  measure!: string;

  @Column({ type: "json", nullable: true })
  data!: unknown;

  @CreateDateColumn({ name: "created_date" })
  createdDate!: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updatedDate!: Date;

  @DeleteDateColumn({ name: "deleted_date", nullable: true })
  deletedDate?: Date | null;
}
