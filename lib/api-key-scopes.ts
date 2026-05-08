/** All valid scopes that can be assigned to an API key */
export const VALID_SCOPES = [
  "admin:full",
  "tools:read",
  "tools:write",
  "submissions:manage",
  "analytics:read",
  "alternatives:read",
  "alternatives:write",
  "comparisons:read",
  "comparisons:write",
  "blog:read",
  "blog:write",
  "categories:read",
  "categories:write",
  "cron:manage",
  "settings:read",
] as const

export type ApiKeyScope = (typeof VALID_SCOPES)[number]

/**
 * Validate that all provided scopes are recognized valid scopes.
 *
 * @param scopes - Array of scope strings to validate
 * @returns True if all scopes are valid
 */
export function validateScopes(scopes: string[]): scopes is ApiKeyScope[] {
  return scopes.every(scope => (VALID_SCOPES as readonly string[]).includes(scope))
}

/**
 * Check if a set of required scopes are all present in the key's granted scopes.
 * The "admin:full" scope is a wildcard that grants access to everything.
 *
 * @param grantedScopes - Scopes assigned to the API key
 * @param requiredScopes - Scopes required by the endpoint
 * @returns True if all required scopes are granted
 */
export function hasRequiredScopes(grantedScopes: string[], requiredScopes: string[]): boolean {
  // admin:full is a wildcard — grants access to all endpoints
  if (grantedScopes.includes("admin:full")) {
    return true
  }

  return requiredScopes.every(scope => grantedScopes.includes(scope))
}
