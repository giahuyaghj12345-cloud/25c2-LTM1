import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  type!: string;

  @Column({ type: "nvarchar", length: 500 })
  message!: string;

  @Column({ nullable: true })
  actorName?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
