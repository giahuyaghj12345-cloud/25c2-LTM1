import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("labor_costs")
export class LaborCost {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  amount!: number;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
