export type Role = "user" | "admin";

export interface OidcUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  role: Role;
}

export interface SessionPayload {
  user: OidcUser;
  iat: number;
  exp: number;
}
