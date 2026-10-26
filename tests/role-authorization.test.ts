import { describe, it, expect } from "vitest";
import { requireRole } from "../src/lib/session";
import { Role, User } from "@prisma/client";

describe("Server-Side Role Authorization", () => {
  const dummyFarmerUser: User = {
    id: "usr-farmer-01",
    email: "farmer@demo.local",
    name: "Farmer Mallesham",
    phone: null,
    role: Role.FARMER,
    isDemo: true,
    avatarUrl: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dummyAdminUser: User = {
    id: "usr-admin-01",
    email: "admin@demo.local",
    name: "Admin Rajeev",
    phone: null,
    role: Role.ADMIN,
    isDemo: true,
    avatarUrl: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("throws UNAUTHORIZED when role is not in allowed roles", () => {
    expect(() => {
      requireRole(dummyFarmerUser, [Role.ADMIN, Role.FRANCHISE_OPERATOR]);
    }).toThrow(/UNAUTHORIZED/);
  });

  it("throws UNAUTHENTICATED when user is null", () => {
    expect(() => {
      requireRole(null, [Role.ADMIN]);
    }).toThrow(/UNAUTHENTICATED/);
  });

  it("allows execution when user role matches allowed roles", () => {
    expect(() => {
      requireRole(dummyAdminUser, [Role.ADMIN, Role.FRANCHISE_OPERATOR]);
    }).not.toThrow();

    expect(() => {
      requireRole(dummyFarmerUser, [Role.FARMER]);
    }).not.toThrow();
  });
});
