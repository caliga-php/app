// Wildcard-aware permission check. WISECP scopes are "Group/Action"; a key can
// also hold "Group/*" or "*". UI hides or disables what the key cannot do.

export function hasPermission(permissions: string[], needed: string): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(needed)) return true;
  const group = needed.split("/")[0];
  return permissions.includes(`${group}/*`);
}

export function hasAnyPermission(permissions: string[], needed: string[]): boolean {
  return needed.some((n) => hasPermission(permissions, n));
}
