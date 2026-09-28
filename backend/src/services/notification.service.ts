import { AppDataSource } from "../config/database";
import { Notification } from "../entities/Notification";

export async function addNotification(type: string, message: string, actorName?: string) {
  const repo = AppDataSource.getRepository(Notification);
  const item = repo.create({ type, message, actorName });
  await repo.save(item);
}
