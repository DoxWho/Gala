export const permissions = {
  admin: [
    "users.create",
    "users.update",
    "users.delete",
    "events.create",
    "events.update",
    "events.delete",
    "guests.*",
    "pledges.*",
    "auction.*",
    "raffle.*",
    "reports.*",
    "settings.*",
  ],
  volunteer: [
    "guests.read",
    "guests.checkIn",
    "guests.create",
    "pledges.create",
    "pledges.update",
    "auction.read",
    "auction.update",
    "raffle.create",
    "reports.read",
  ],
} as const;

export function hasPermission(
  role: "admin" | "volunteer",
  permission: string
): boolean {
  const userPermissions = permissions[role];
  return userPermissions.some((p) => {
    if (p.endsWith(".*")) {
      return permission.startsWith(p.replace(".*", ""));
    }
    return p === permission;
  });
}
