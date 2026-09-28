import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { StockOut } from "./StockOut";
import { Product } from "./Product";

@Entity("stock_out_lines")
export class StockOutLine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => StockOut, (stockOut) => stockOut.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "stockOutId" })
  stockOut!: StockOut;

  @ManyToOne(() => Product, { eager: true, nullable: true })
  @JoinColumn({ name: "materialId" })
  product?: Product;

  @Column({ nullable: true })
  materialName?: string;

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  quantity!: number;

  @Column({ nullable: true, length: 32 })
  unit?: string;

  @Column({ nullable: true, length: 20 })
  warehouseCode?: string;

  @Column({ nullable: true, length: 50 })
  lotCode?: string;

  @Column({ nullable: true, length: 50 })
  batchNo?: string;

  @Column({ nullable: true, length: 20 })
  shelfCode?: string;

  @Column({ nullable: true, length: 20 })
  hsCode?: string;

  @Column({ nullable: true })
  note?: string;
}
