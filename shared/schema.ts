import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const consumers = pgTable("consumers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const presences = pgTable("presences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id").notNull().references(() => consumers.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  isPresent: boolean("is_present").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consumptions = pgTable("consumptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id").notNull().references(() => consumers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // 700 or 1000
  date: text("date").notNull(), // Format: YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const consumersRelations = relations(consumers, ({ many }) => ({
  presences: many(presences),
  consumptions: many(consumptions),
}));

export const presencesRelations = relations(presences, ({ one }) => ({
  consumer: one(consumers, {
    fields: [presences.consumerId],
    references: [consumers.id],
  }),
}));

export const consumptionsRelations = relations(consumptions, ({ one }) => ({
  consumer: one(consumers, {
    fields: [consumptions.consumerId],
    references: [consumers.id],
  }),
}));

// Insert schemas
export const insertConsumerSchema = createInsertSchema(consumers).omit({
  id: true,
  createdAt: true,
});

export const insertPresenceSchema = createInsertSchema(presences).omit({
  id: true,
  createdAt: true,
});

export const insertConsumptionSchema = createInsertSchema(consumptions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Consumer = typeof consumers.$inferSelect;
export type InsertConsumer = z.infer<typeof insertConsumerSchema>;
export type Presence = typeof presences.$inferSelect;
export type InsertPresence = z.infer<typeof insertPresenceSchema>;
export type Consumption = typeof consumptions.$inferSelect;
export type InsertConsumption = z.infer<typeof insertConsumptionSchema>;

// Extended types for frontend
export type ConsumerWithPresence = Consumer & {
  isPresent?: boolean;
};

export type ConsumptionWithConsumer = Consumption & {
  consumer: Consumer;
};
