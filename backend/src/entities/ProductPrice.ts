import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./Product";

@Entity("dmsp_gia")
export class ProductPrice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Product, (product) => product.prices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column({ name: "ngay_hl", type: "date", nullable: true })
  effectiveDate?: string | null;

  @Column("decimal", { name: "gia", precision: 18, scale: 4, default: 0 })
  price!: number;

  @Column("decimal", { name: "gia_vat", precision: 18, scale: 4, default: 0 })
  priceVat!: number;

  @Column({ name: "nh_kh", nullable: true, length: 20 })
  customerGroup?: string;

  @Column({ name: "ma_kh", nullable: true, length: 50 })
  customerCode?: string;
}
