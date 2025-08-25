var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import session from "express-session";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  consumers: () => consumers,
  consumersRelations: () => consumersRelations,
  consumptions: () => consumptions,
  consumptionsRelations: () => consumptionsRelations,
  insertConsumerSchema: () => insertConsumerSchema,
  insertConsumptionSchema: () => insertConsumptionSchema,
  insertPresenceSchema: () => insertPresenceSchema,
  presences: () => presences,
  presencesRelations: () => presencesRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var consumers = pgTable("consumers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow()
});
var presences = pgTable("presences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id").notNull().references(() => consumers.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // Format: YYYY-MM-DD
  isPresent: boolean("is_present").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var consumptions = pgTable("consumptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumerId: varchar("consumer_id").notNull().references(() => consumers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  // 700 or 1000
  date: text("date").notNull(),
  // Format: YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow()
});
var consumersRelations = relations(consumers, ({ many }) => ({
  presences: many(presences),
  consumptions: many(consumptions)
}));
var presencesRelations = relations(presences, ({ one }) => ({
  consumer: one(consumers, {
    fields: [presences.consumerId],
    references: [consumers.id]
  })
}));
var consumptionsRelations = relations(consumptions, ({ one }) => ({
  consumer: one(consumers, {
    fields: [consumptions.consumerId],
    references: [consumers.id]
  })
}));
var insertConsumerSchema = createInsertSchema(consumers).omit({
  id: true,
  createdAt: true
});
var insertPresenceSchema = createInsertSchema(presences).omit({
  id: true,
  createdAt: true
});
var insertConsumptionSchema = createInsertSchema(consumptions).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getConsumers() {
    return await db.select().from(consumers).orderBy(consumers.name);
  }
  async getConsumer(id) {
    const [consumer] = await db.select().from(consumers).where(eq(consumers.id, id));
    return consumer || void 0;
  }
  async createConsumer(insertConsumer) {
    const [consumer] = await db.insert(consumers).values(insertConsumer).returning();
    return consumer;
  }
  async deleteConsumer(id) {
    await db.delete(consumers).where(eq(consumers.id, id));
  }
  async getPresencesByDate(date) {
    const results = await db.select({
      id: presences.id,
      consumerId: presences.consumerId,
      date: presences.date,
      isPresent: presences.isPresent,
      createdAt: presences.createdAt,
      consumer: consumers
    }).from(presences).innerJoin(consumers, eq(presences.consumerId, consumers.id)).where(eq(presences.date, date));
    return results.map((result) => ({
      ...result,
      consumer: result.consumer
    }));
  }
  async markPresence(presence) {
    const existing = await db.select().from(presences).where(and(
      eq(presences.consumerId, presence.consumerId),
      eq(presences.date, presence.date)
    ));
    if (existing.length > 0) {
      const [updated] = await db.update(presences).set({ isPresent: presence.isPresent }).where(eq(presences.id, existing[0].id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(presences).values(presence).returning();
      return created;
    }
  }
  async getConsumersWithPresence(date) {
    const allConsumers = await db.select().from(consumers).orderBy(consumers.name);
    const dayPresences = await db.select().from(presences).where(eq(presences.date, date));
    return allConsumers.map((consumer) => {
      const presence = dayPresences.find((p) => p.consumerId === consumer.id);
      return {
        ...consumer,
        isPresent: presence?.isPresent || false
      };
    });
  }
  async getConsumptionsByDate(date) {
    const results = await db.select({
      id: consumptions.id,
      consumerId: consumptions.consumerId,
      amount: consumptions.amount,
      date: consumptions.date,
      createdAt: consumptions.createdAt,
      consumer: consumers
    }).from(consumptions).innerJoin(consumers, eq(consumptions.consumerId, consumers.id)).where(eq(consumptions.date, date)).orderBy(desc(consumptions.createdAt));
    return results.map((result) => ({
      ...result,
      consumer: result.consumer
    }));
  }
  async createConsumption(consumption) {
    const [created] = await db.insert(consumptions).values(consumption).returning();
    return created;
  }
  async getDailyStats(date) {
    const [totalConsumersResult] = await db.select({ count: sql2`count(*)::int` }).from(consumers);
    const [presentTodayResult] = await db.select({ count: sql2`count(*)::int` }).from(presences).where(and(
      eq(presences.date, date),
      eq(presences.isPresent, true)
    ));
    const [dailyConsumptionsResult] = await db.select({
      count: sql2`count(*)::int`,
      revenue: sql2`sum(amount)::int`
    }).from(consumptions).where(eq(consumptions.date, date));
    const [uniqueConsumersResult] = await db.select({ count: sql2`count(DISTINCT consumer_id)::int` }).from(consumptions).where(eq(consumptions.date, date));
    return {
      totalConsumers: totalConsumersResult?.count || 0,
      presentToday: uniqueConsumersResult?.count || 0,
      // Nombre de consommateurs ayant consommé
      dailyConsumptions: dailyConsumptionsResult?.count || 0,
      dailyRevenue: dailyConsumptionsResult?.revenue || 0
    };
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType } from "docx";
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  } else {
    return res.status(401).json({ message: "Non autoris\xE9" });
  }
}
async function registerRoutes(app2) {
  app2.use(session({
    secret: "sitab-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 heures
    }
  }));
  const getCurrentDate = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  app2.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin01") {
      req.session.isAuthenticated = true;
      req.session.user = { username: "admin" };
      res.json({ success: true, message: "Connexion r\xE9ussie" });
    } else {
      res.status(401).json({ message: "Identifiants incorrects" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Erreur lors de la d\xE9connexion" });
      } else {
        res.json({ message: "D\xE9connexion r\xE9ussie" });
      }
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    if (req.session?.isAuthenticated) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ message: "Non authentifi\xE9" });
    }
  });
  app2.get("/api/consommateurs", requireAuth, async (req, res) => {
    try {
      const consumers2 = await storage.getConsumers();
      res.json(consumers2);
    } catch (error) {
      console.error("Error fetching consumers:", error);
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des consommateurs" });
    }
  });
  app2.post("/api/consommateurs", requireAuth, async (req, res) => {
    try {
      const validatedData = insertConsumerSchema.parse(req.body);
      const consumer = await storage.createConsumer(validatedData);
      res.status(201).json(consumer);
    } catch (error) {
      console.error("Error creating consumer:", error);
      res.status(400).json({ message: "Donn\xE9es invalides pour cr\xE9er un consommateur" });
    }
  });
  app2.delete("/api/consommateurs/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteConsumer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting consumer:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du consommateur" });
    }
  });
  app2.post("/api/presences", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPresenceSchema.parse(req.body);
      const presence = await storage.markPresence(validatedData);
      res.status(201).json(presence);
    } catch (error) {
      console.error("Error marking presence:", error);
      res.status(400).json({ message: "Erreur lors de l'enregistrement de la pr\xE9sence" });
    }
  });
  app2.get("/api/presences/:date", requireAuth, async (req, res) => {
    try {
      const consumersWithPresence = await storage.getConsumersWithPresence(req.params.date);
      res.json(consumersWithPresence);
    } catch (error) {
      console.error("Error fetching presences:", error);
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des pr\xE9sences" });
    }
  });
  app2.post("/api/consommations", requireAuth, async (req, res) => {
    try {
      const data = {
        ...req.body,
        date: req.body.date || getCurrentDate()
      };
      const validatedData = insertConsumptionSchema.parse(data);
      const consumption = await storage.createConsumption(validatedData);
      res.status(201).json(consumption);
    } catch (error) {
      console.error("Error creating consumption:", error);
      res.status(400).json({ message: "Erreur lors de l'enregistrement de la consommation" });
    }
  });
  app2.get("/api/consommations", requireAuth, async (req, res) => {
    try {
      const date = req.query.date || getCurrentDate();
      const consumptions2 = await storage.getConsumptionsByDate(date);
      res.json(consumptions2);
    } catch (error) {
      console.error("Error fetching consumptions:", error);
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des consommations" });
    }
  });
  app2.get("/api/statistics", requireAuth, async (req, res) => {
    try {
      const date = req.query.date || getCurrentDate();
      const stats = await storage.getDailyStats(date);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des statistiques" });
    }
  });
  app2.get("/api/rapport/journalier", requireAuth, async (req, res) => {
    try {
      const date = req.query.date || getCurrentDate();
      const consumptions2 = await storage.getConsumptionsByDate(date);
      const stats = await storage.getDailyStats(date);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SITAB - Rapport Journalier des Consommations",
                    bold: true,
                    size: 28
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${new Date(date).toLocaleDateString("fr-FR")}`,
                    size: 24
                  })
                ],
                spacing: { after: 400 }
              }),
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE
                },
                rows: [
                  // Header row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "N\xB0", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "NOMS ET PRENOMS", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Consommation", bold: true })] })]
                      })
                    ]
                  }),
                  // Data rows
                  ...consumptions2.map(
                    (consumption, index) => new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })]
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: consumption.consumer.name })] })]
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: `${consumption.amount} FCFA` })] })]
                        })
                      ]
                    })
                  )
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `
Total journalier: ${stats.dailyRevenue} FCFA`,
                    bold: true,
                    size: 24
                  })
                ],
                spacing: { before: 400 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nombre de consommations: ${stats.dailyConsumptions}`,
                    size: 20
                  })
                ]
              })
            ]
          }
        ]
      });
      const buffer = await Packer.toBuffer(doc);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=Rapport_Journalier_${date.replace(/-/g, "_")}.docx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Erreur lors de la g\xE9n\xE9ration du rapport" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
