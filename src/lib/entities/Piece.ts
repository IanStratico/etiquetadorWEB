import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Lot } from "@/lib/entities/Lot";

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

  @Column({ name: "cod_articulo", type: "varchar", length: 100 })
  codArticulo!: string;

  @Column({ type: "text" })
  color!: string;

  @Column({ type: "text" })
  measure!: string;

  @Column({ name: "color_web_id", type: "text" })
  idColorWeb!: string;

  @Column({ type: "json", nullable: true })
  data!: unknown;

  @ManyToOne(() => Lot, (lot) => lot.pieces, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lot_id" })
  lot!: Lot;

  @CreateDateColumn({ name: "created_date" })
  createdDate!: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updatedDate!: Date;

  @DeleteDateColumn({ name: "deleted_date", nullable: true })
  deletedDate?: Date | null;
}
