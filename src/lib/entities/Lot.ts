import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Piece } from "@/lib/entities/Piece";

@Entity({ name: "lots" })
export class Lot {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "lot_code", type: "varchar", length: 64, unique: true })
  lotCode!: string;

  @Column({ name: "piece_count", type: "int", default: 0 })
  pieceCount!: number;

  @Column({ name: "download_count", type: "int", default: 0 })
  downloadCount!: number;

  @CreateDateColumn({ name: "created_date" })
  createdDate!: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updatedDate!: Date;

  @OneToMany(() => Piece, (piece) => piece.lot)
  pieces!: Piece[];
}
