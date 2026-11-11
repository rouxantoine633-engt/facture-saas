import { describe, expect, it, vi } from "vitest";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { minimizedAdapter } from "./auth-adapter";

describe("minimizedAdapter", () => {
  it("n'enregistre ni jetons OAuth ni photo de profil, mais garde le reste", async () => {
    const createUser = vi.fn(async (u: AdapterUser) => u);
    const linkAccount = vi.fn(async (a: AdapterAccount) => a);
    const getUser = vi.fn();
    const adapter = minimizedAdapter({ createUser, linkAccount, getUser } as unknown as Adapter);

    await adapter.createUser!({ id: "u1", email: "a@b.fr", name: "A", image: "https://photo", emailVerified: null });
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.fr", name: "A", image: null }));

    await adapter.linkAccount!({
      userId: "u1",
      type: "oidc",
      provider: "google",
      providerAccountId: "123",
      access_token: "secret-access",
      refresh_token: "secret-refresh",
      id_token: "secret-id",
      expires_at: 1,
      scope: "openid email",
    });
    const stored = linkAccount.mock.calls[0]![0];
    expect(stored).toMatchObject({ provider: "google", providerAccountId: "123", scope: "openid email" });
    expect(stored.access_token).toBeUndefined();
    expect(stored.refresh_token).toBeUndefined();
    expect(stored.id_token).toBeUndefined();

    expect(adapter.getUser).toBe(getUser); // les autres méthodes restent inchangées
  });
});
