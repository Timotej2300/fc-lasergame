import { z } from "zod";

export const playerNameSchema = z.string().trim().min(1, "Meno je povinné").max(60);

export const createGroupSchema = z
  .object({
    eventId: z.string().uuid(),
    slotId: z.string().uuid(),
    contactName: z.string().trim().min(2, "Zadaj meno").max(120),
    contactEmail: z.string().trim().email("Neplatný email"),
    contactPhone: z.string().trim().max(30).optional().nullable(),
    mode: z.enum(["SOLO", "TEAMS"]),
    source: z.enum(["ONLINE", "KIOSK"]),
    players: z.array(playerNameSchema).min(1),
    teams: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(60),
          playerNames: z.array(playerNameSchema).min(1)
        })
      )
      .optional()
  })
  .refine(
    (data) => {
      if (data.mode === "TEAMS") {
        return !!data.teams && data.teams.length >= 2;
      }
      return true;
    },
    { message: "TÍMY vyžadujú aspoň 2 tímy", path: ["teams"] }
  );

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const eventSchema = z.object({
  name: z.string().trim().min(2).max(120),
  eventDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  gameDurationMinutes: z.number().int().min(1).max(120),
  breakDurationMinutes: z.number().int().min(0).max(60),
  minPlayers: z.number().int().min(1).max(50),
  maxPlayers: z.number().int().min(1).max(50),
  countdownSeconds: z.number().int().min(0).max(30),
  countdownEnabled: z.boolean(),
  depositAmountCents: z.number().int().min(0).max(100000)
});

export const adminLoginSchema = z.object({
  code: z.string().trim().min(4).max(40)
});
