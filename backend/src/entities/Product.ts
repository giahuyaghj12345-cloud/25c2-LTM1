import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { ProductPrice } from "./ProductPrice";

@Entity("dmsp")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "ma_sp", unique: true, length: 20 })
  code!: string;

  @Column({ name: "part_no", nullable: true, length: 20 })
  partNo?: string;

  @Column({ name: "ma_tra_cuu", nullable: true, length: 50 })
  searchCode?: string;

  @Column({ name: "ten_sp", length: 255 })
  name!: string;

  @Column({ name: "ten_sp2", nullable: true, length: 255 })
  name2?: string;

  @Column({ name: "dvt", default: "", length: 32 })
  unit!: string;

  @Column({ name: "nhieu_dvt", default: false })
  multiUnit!: boolean;

  @Column({ name: "vt_ke", default: false })
  trackShelf!: boolean;

  @Column({ name: "vt_ton_kho", default: true })
  keepStock!: boolean;

  @Column({ name: "lot_yn", default: false })
  trackLot!: boolean;

  @Column({ name: "gia_ton", type: "int", default: 1 })
  costMethod!: number;

  @Column({ name: "sua_tk_vt", type: "int", default: 0 })
  editStockAccount!: number;

  @Column({ name: "loai_vt", nullable: true, length: 2 })
  kind?: string;

  @Column({ name: "tk_vt", nullable: true, length: 20 })
  stockAccount?: string;

  @Column({ name: "thue_suat", type: "decimal", precision: 10, scale: 2, default: 0 })
  taxRate!: number;

  @Column({ name: "tk_dt", nullable: true, length: 20 })
  revenueAccount?: string;

  @Column({ name: "tk_tl", nullable: true, length: 20 })
  returnAccount?: string;

  @Column({ name: "tk_dtnb", nullable: true, length: 20 })
  internalRevenueAccount?: string;

  @Column({ name: "tk_cl_vt", nullable: true, length: 20 })
  varianceAccount?: string;

  @Column({ name: "tk_gv", nullable: true, length: 20 })
  cogsAccount?: string;

  @Column({ name: "tk_spdd", nullable: true, length: 20 })
  wipAccount?: string;

  @Column({ name: "nh_vt1", nullable: true, length: 20 })
  groupCode?: string;

  @Column({ name: "nh_vt2", nullable: true, length: 20 })
  groupCode2?: string;

  @Column({ name: "nh_vt3", nullable: true, length: 20 })
  groupCode3?: string;

  @Column("decimal", { name: "sl_min", precision: 15, scale: 4, default: 0 })
  minQty!: number;

  @Column("decimal", { name: "sl_max", precision: 15, scale: 4, default: 0 })
  maxQty!: number;

  @Column("decimal", { name: "sl_ton", precision: 18, scale: 4, default: 0 })
  stockQty!: number;

  @Column({ name: "ma_nganh", nullable: true, length: 20 })
  industryCode?: string;

  @Column({ name: "thue_gtgt", type: "decimal", precision: 10, scale: 2, default: 0 })
  vatRate!: number;

  @Column({ name: "thue_bvmt", type: "decimal", precision: 10, scale: 2, default: 0 })
  envTax!: number;

  @Column({ name: "ma_ck", nullable: true, length: 20 })
  discountCode?: string;

  @Column({ name: "loai_ma", nullable: true, length: 20 })
  typeCode?: string;

  @Column({ name: "ma_hs", nullable: true, length: 20 })
  hsCode?: string;

  @Column({ name: "hang_sx", nullable: true, length: 255 })
  manufacturer?: string;

  @Column({ name: "thuong_hieu", nullable: true, length: 200 })
  brand?: string;

  @Column({ name: "gia_dinh_sp", nullable: true, length: 200 })
  family?: string;

  @Column({ name: "mau_sac", nullable: true, length: 50 })
  color?: string;

  @Column({ name: "mau_xe", nullable: true, length: 100 })
  carModel?: string;

  @Column({ name: "nam_sx", nullable: true, length: 20 })
  modelYear?: string;

  @Column({ name: "nuoc_xx", nullable: true, length: 50 })
  origin?: string;

  @Column({ name: "quy_cach_ten", nullable: true, length: 500 })
  spec?: string;

  @Column({ name: "ghi_chu", nullable: true, length: 1000 })
  note?: string;

  @Column({ default: "1", length: 1 })
  status!: string;

  @OneToMany(() => ProductPrice, (price) => price.product, { cascade: true })
  prices!: ProductPrice[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
