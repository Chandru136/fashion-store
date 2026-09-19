import { z } from "zod";

export function couponLocalDate(date: Date) {
  return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}
const localDate = z.string().refine(value => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}:00+05:30`);
  return Number.isFinite(date.getTime()) && couponLocalDate(date) === value;
}, "Enter a valid date and time in IST.").transform(value => new Date(`${value}:00+05:30`));
const money = z.coerce.number().finite().min(0).max(10_000_000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Use at most two decimal places.");
const optionalPositive = z.preprocess(value => value === "" || value == null ? null : value, money.refine(value => value > 0, "Enter a value greater than zero.").nullable());
export const CouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, hyphens or underscores."),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: money.refine(value => value > 0, "Discount must be greater than zero."),
  minimumOrderAmount: money,
  maximumDiscount: optionalPositive,
  usageLimit: z.preprocess(value => value === "" || value == null ? null : value, z.coerce.number().int().min(1).max(2_147_483_647).nullable()),
  perUserLimit: z.coerce.number().int().min(1).max(2_147_483_647),
  startDate: localDate,
  endDate: localDate,
  status: z.enum(["ACTIVE", "INACTIVE"]),
}).superRefine((data, ctx) => {
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage cannot exceed 100%." });
  if (data.endDate <= data.startDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "End time must be after start time." });
  if (data.usageLimit !== null && data.perUserLimit > data.usageLimit) ctx.addIssue({ code: "custom", path: ["perUserLimit"], message: "Per-customer limit cannot exceed the total limit." });
}).transform(data => ({ ...data, maximumDiscount: data.discountType === "PERCENTAGE" ? data.maximumDiscount : null }));
