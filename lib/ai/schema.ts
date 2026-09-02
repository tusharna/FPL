import { z } from "zod";

const confidenceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const riskSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const transferActionSchema = z.enum(["SAVE", "TRANSFER"]);

export const aiReportSchema = z.object({
  title: z.string().min(1),
  executiveSummary: z.string().min(1),
  recommendedXI: z.object({
    formation: z.string().min(1),
    explanation: z.string().min(1),
  }),
  captain: z.object({
    player: z.string().min(1),
    explanation: z.string().min(1),
    confidence: confidenceSchema,
  }),
  viceCaptain: z.object({
    player: z.string().min(1),
    explanation: z.string().min(1),
  }),
  lineupChanges: z.object({
    summary: z.string().min(1),
    changes: z.array(
      z.object({
        playerIn: z.string().min(1),
        playerOut: z.string().min(1),
        explanation: z.string().min(1),
      }),
    ),
  }),
  transfer: z.object({
    action: transferActionSchema,
    explanation: z.string().min(1),
  }),
  bench: z.object({
    explanation: z.string().min(1),
  }),
  risks: z.array(
    z.object({
      player: z.string().min(1),
      risk: riskSchema,
      explanation: z.string().min(1),
    }),
  ),
  shortTerm: z.string().min(1),
  mediumTerm: z.string().min(1),
  finalVerdict: z.string().min(1),
});
