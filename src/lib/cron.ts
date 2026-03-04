export function cronToHumanReadable(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length < 5) return cron;

  const [min, hour, day, month, dow] = parts;

  if (min === "*" && hour === "*" && day === "*" && month === "*" && dow === "*") {
    return "Every minute";
  }
  if (min === "0" && hour === "*" && day === "*" && month === "*" && dow === "*") {
    return "Every hour";
  }
  if (min === "0" && hour === "0" && day === "*" && month === "*" && dow === "*") {
    return "Every day at midnight";
  }
  if (min === "0" && hour === "0" && day === "*" && month === "*" && dow === "0") {
    return "Every Sunday at midnight";
  }

  return cron;
}

export function getNextRun(cron: string): Date | null {
  return new Date();
}

export function formatDateTime(date: Date): string {
  return date.toISOString();
}
