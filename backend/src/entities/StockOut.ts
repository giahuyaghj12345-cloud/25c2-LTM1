import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { StockOutLine } from "./StockOutLine";

@Entity("stock_outs")
export class StockOut {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  number!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ nullable: true })
  receiver?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ default: "sale", length: 30 })
  kind!: string;

  @Column({ nullable: true, length: 50 })
  customerCode?: string;

  @Column({ nullable: true, length: 200 })
  customerName?: string;

  @Column({ nullable: true, length: 255 })
  customerAddress?: string;

  @Column({ nullable: true, length: 50 })
  customerPhone?: string;

  @Column({ nullable: true, length: 100 })
  customerEmail?: string;

  @Column({ default: "dealer", length: 20 })
  customerGroup!: string;

  @Column({ nullable: true, length: 50 })
  orderNumber?: string;

  @Column({ name: "orderDate", type: "date", nullable: true })
  orderDate?: string;

  @Column({ name: "postingDate", type: "date", nullable: true })
  postingDate?: string;

  @Column({ nullable: true, length: 30 })
  bookNumber?: string;

  @Column({ default: "VND", length: 10 })
  currency!: string;

  @Column("decimal", { precision: 18, scale: 4, default: 1 })
  exchangeRate!: number;

  @Column({ nullable: true, length: 100 })
  salesStaff?: string;

  @Column({ nullable: true, length: 100 })
  deliveryStaff?: string;

  @Column({ nullable: true, length: 255 })
  deliveryAddress?: string;

  @Column({ nullable: true, length: 500 })
  remark?: string;

  @Column({ default: false })
  serialCreated!: boolean;

  @Column({ default: false })
  serialLocked!: boolean;

  @Column({ default: "draft" })
  status!: string;

  @Column({ nullable: true })
  createdBy?: string;

  @OneToMany(() => StockOutLine, (line) => line.stockOut, { cascade: true, eager: true })
  lines!: StockOutLine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
