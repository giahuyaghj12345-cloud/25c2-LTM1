import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { SerialLog } from "./SerialLog";

@Entity("dm_serial")
export class Serial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "so_serial", unique: true, length: 20 })
  serialNo!: string;

  @Column({ name: "ma_kh", nullable: true, length: 50 })
  customerCode?: string;

  @Column({ name: "ten_kh", nullable: true, length: 200 })
  customerName?: string;

  @Column({ name: "so_don_hang", nullable: true, length: 50 })
  orderNumber?: string;

  @Column({ name: "ngay_xuat", type: "date", nullable: true })
  stockOutDate?: string;

  @Column({ name: "so_px", nullable: true, length: 50 })
  stockOutNumber?: string;

  @Column({ nullable: true })
  stockOutId?: string;

  @Column({ nullable: true })
  stockOutLineId?: string;

  @Column({ name: "ma_sp", nullable: true, length: 20 })
  productCode?: string;

  @Column({ name: "ten_sp", nullable: true, length: 255 })
  productName?: string;

  @Column({ name: "dvt", nullable: true, length: 32 })
  unit?: string;

  @Column({ name: "nh_sp", nullable: true, length: 20 })
  productGroup?: string;

  @Column({ name: "ma_kho", nullable: true, length: 20 })
  warehouseCode?: string;

  @Column({ name: "ma_lo", nullable: true, length: 50 })
  lotCode?: string;

  @Column({ name: "so_batch", nullable: true, length: 50 })
  batchNo?: string;

  @Column({ name: "trang_thai", length: 30, default: "Mới tạo" })
  status!: string;

  @Column({ name: "tinh_trang", length: 100, default: "Mới tạo" })
  situation!: string;

  @Column({ name: "ghi_chu", nullable: true, length: 500 })
  note?: string;

  @Column({ name: "ngay_bh_tu", type: "date", nullable: true })
  warrantyFrom?: string;

  @Column({ name: "ngay_bh_den", type: "date", nullable: true })
  warrantyTo?: string;

  @Column({ name: "thoi_gian_bh", nullable: true, length: 50 })
  warrantyNote?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true, length: 100 })
  createdBy?: string;

  @Column({ type: "datetime", nullable: true })
  changedAt?: Date;

  @Column({ nullable: true, length: 100 })
  changedBy?: string;

  @Column({ name: "ngay_kh_bh", type: "date", nullable: true })
  activatedAt?: string;

  @Column({ name: "kh_kich_hoat", nullable: true, length: 200 })
  activatedCustomer?: string;

  @Column({ name: "email_kh_bh", nullable: true, length: 100 })
  activatedEmail?: string;

  @Column({ name: "dt_kh_bh", nullable: true, length: 50 })
  activatedPhone?: string;

  @Column({ name: "ngay_hh_bh_web", type: "date", nullable: true })
  webWarrantyTo?: string;

  @Column({ name: "dai_ly_mua", nullable: true, length: 200 })
  dealerName?: string;

  @Column({ name: "dia_chi_dl", nullable: true, length: 255 })
  dealerAddress?: string;

  @Column({ name: "ngay_mua_dl", type: "date", nullable: true })
  dealerPurchaseDate?: string;

  @Column({ name: "ghi_chu_kh_bh", nullable: true, length: 500 })
  activationNote?: string;

  @OneToMany(() => SerialLog, (log) => log.serial)
  logs?: SerialLog[];
}
