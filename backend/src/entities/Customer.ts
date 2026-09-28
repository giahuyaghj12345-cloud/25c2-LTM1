import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ nullable: true, length: 300 })
  address?: string;

  @Column({ nullable: true, length: 50 })
  phone?: string;

  @Column({ nullable: true, length: 100 })
  email?: string;

  @Column({ nullable: true, length: 30 })
  taxCode?: string;

  @Column({ nullable: true, length: 20 })
  idCard?: string;

  @Column({ default: "dealer", length: 20 })
  customerGroup!: string;

  @Column({ nullable: true, length: 255 })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
