import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Serial } from "./Serial";

@Entity("dm_serial_log")
export class SerialLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Serial, (serial) => serial.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "serialId" })
  serial!: Serial;

  @Column({ name: "so_serial", length: 20 })
  serialNo!: string;

  @Column({ name: "tinh_trang", length: 100 })
  situation!: string;

  @Column({ name: "ghi_chu", nullable: true, length: 500 })
  note?: string;

  @Column({ type: "datetime" })
  changedAt!: Date;

  @Column({ nullable: true, length: 100 })
  changedBy?: string;
}
