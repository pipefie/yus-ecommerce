import { prisma } from "@/lib/prisma";
import type { OidcUser, Role } from "@/lib/auth/types";

type UpsertInput = {
  sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

export async function upsertOidcUser(input: UpsertInput): Promise<OidcUser> {
  const { sub, email, name, picture } = input;
  const user = await prisma.user.upsert({
    where: { sub },
    update: {
      email: email ?? undefined,
      name: name ?? undefined,
      picture: picture ?? undefined,
    },
    create: {
      sub,
      email: email ?? undefined,
      name: name ?? undefined,
      picture: picture ?? undefined,
      role: "user",
    },
    select: {
      sub: true,
      email: true,
      name: true,
      picture: true,
      role: true,
    },
  });
  return mapDbUserToOidc(user);
}

export async function getUserBySub(sub: string): Promise<OidcUser | null> {
  const user = await prisma.user.findUnique({
    where: { sub },
    select: {
      sub: true,
      email: true,
      name: true,
      picture: true,
      role: true,
    },
  });
  return user ? mapDbUserToOidc(user) : null;
}

export async function updateUserRole(sub: string, role: Role): Promise<OidcUser | null> {
  const user = await prisma.user.update({
    where: { sub },
    data: { role },
    select: { sub: true, email: true, name: true, picture: true, role: true },
  }).catch(() => null);
  return user ? mapDbUserToOidc(user) : null;
}

function mapDbUserToOidc(user: {
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  role: string;
}): OidcUser {
  return {
    sub: user.sub,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    picture: user.picture ?? undefined,
    role: (user.role as Role) ?? "user",
  };
}
