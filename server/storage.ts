import { 
  consumers, 
  presences, 
  consumptions,
  type Consumer, 
  type InsertConsumer,
  type Presence,
  type InsertPresence,
  type Consumption,
  type InsertConsumption,
  type ConsumerWithPresence,
  type ConsumptionWithConsumer
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Consumers
  getConsumers(): Promise<Consumer[]>;
  getConsumer(id: string): Promise<Consumer | undefined>;
  createConsumer(consumer: InsertConsumer): Promise<Consumer>;
  deleteConsumer(id: string): Promise<void>;
  
  // Presences
  getPresencesByDate(date: string): Promise<(Presence & { consumer: Consumer })[]>;
  markPresence(presence: InsertPresence): Promise<Presence>;
  getConsumersWithPresence(date: string): Promise<ConsumerWithPresence[]>;
  
  // Consumptions
  getConsumptionsByDate(date: string): Promise<ConsumptionWithConsumer[]>;
  createConsumption(consumption: InsertConsumption): Promise<Consumption>;
  
  // Statistics
  getDailyStats(date: string): Promise<{
    totalConsumers: number;
    presentToday: number;
    dailyConsumptions: number;
    dailyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getConsumers(): Promise<Consumer[]> {
    return await db.select().from(consumers).orderBy(consumers.name);
  }

  async getConsumer(id: string): Promise<Consumer | undefined> {
    const [consumer] = await db.select().from(consumers).where(eq(consumers.id, id));
    return consumer || undefined;
  }

  async createConsumer(insertConsumer: InsertConsumer): Promise<Consumer> {
    const [consumer] = await db
      .insert(consumers)
      .values(insertConsumer)
      .returning();
    return consumer;
  }

  async deleteConsumer(id: string): Promise<void> {
    await db.delete(consumers).where(eq(consumers.id, id));
  }

  async getPresencesByDate(date: string): Promise<(Presence & { consumer: Consumer })[]> {
    const results = await db
      .select({
        id: presences.id,
        consumerId: presences.consumerId,
        date: presences.date,
        isPresent: presences.isPresent,
        createdAt: presences.createdAt,
        consumer: consumers,
      })
      .from(presences)
      .innerJoin(consumers, eq(presences.consumerId, consumers.id))
      .where(eq(presences.date, date));
    
    return results.map(result => ({
      ...result,
      consumer: result.consumer as Consumer
    }));
  }

  async markPresence(presence: InsertPresence): Promise<Presence> {
    // Check if presence already exists for this consumer and date
    const existing = await db
      .select()
      .from(presences)
      .where(and(
        eq(presences.consumerId, presence.consumerId),
        eq(presences.date, presence.date)
      ));

    if (existing.length > 0) {
      // Update existing presence
      const [updated] = await db
        .update(presences)
        .set({ isPresent: presence.isPresent })
        .where(eq(presences.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new presence
      const [created] = await db
        .insert(presences)
        .values(presence)
        .returning();
      return created;
    }
  }

  async getConsumersWithPresence(date: string): Promise<ConsumerWithPresence[]> {
    const allConsumers = await db.select().from(consumers).orderBy(consumers.name);
    const dayPresences = await db
      .select()
      .from(presences)
      .where(eq(presences.date, date));

    return allConsumers.map(consumer => {
      const presence = dayPresences.find(p => p.consumerId === consumer.id);
      return {
        ...consumer,
        isPresent: presence?.isPresent || false,
      };
    });
  }

  async getConsumptionsByDate(date: string): Promise<ConsumptionWithConsumer[]> {
    const results = await db
      .select({
        id: consumptions.id,
        consumerId: consumptions.consumerId,
        amount: consumptions.amount,
        date: consumptions.date,
        createdAt: consumptions.createdAt,
        consumer: consumers,
      })
      .from(consumptions)
      .innerJoin(consumers, eq(consumptions.consumerId, consumers.id))
      .where(eq(consumptions.date, date))
      .orderBy(desc(consumptions.createdAt));
    
    return results.map(result => ({
      ...result,
      consumer: result.consumer as Consumer
    }));
  }

  async createConsumption(consumption: InsertConsumption): Promise<Consumption> {
    const [created] = await db
      .insert(consumptions)
      .values(consumption)
      .returning();
    return created;
  }

  async getDailyStats(date: string): Promise<{
    totalConsumers: number;
    presentToday: number;
    dailyConsumptions: number;
    dailyRevenue: number;
  }> {
    const [totalConsumersResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(consumers);

    const [presentTodayResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(presences)
      .where(and(
        eq(presences.date, date),
        eq(presences.isPresent, true)
      ));

    const [dailyConsumptionsResult] = await db
      .select({ 
        count: sql`count(*)::int`,
        revenue: sql`sum(amount)::int`
      })
      .from(consumptions)
      .where(eq(consumptions.date, date));

    // Pour les fiches journalières, on compte les consommations uniques (pas les présences)
    const [uniqueConsumersResult] = await db
      .select({ count: sql`count(DISTINCT consumer_id)::int` })
      .from(consumptions)
      .where(eq(consumptions.date, date));

    return {
      totalConsumers: (totalConsumersResult?.count as number) || 0,
      presentToday: (uniqueConsumersResult?.count as number) || 0, // Nombre de consommateurs ayant consommé
      dailyConsumptions: (dailyConsumptionsResult?.count as number) || 0,
      dailyRevenue: (dailyConsumptionsResult?.revenue as number) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
