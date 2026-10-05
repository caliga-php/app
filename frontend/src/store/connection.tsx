// Connection + lock state for the whole app. Holds panel profiles, the active
// profile's permissions, and the biometric/PIN lock. The API key lives only in
// the Keychain (secureSet) and in the in-memory session; never in general KV.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { pingPanel, whoami } from "@/src/api/client";
import { normalizeBaseUrl, setSession } from "@/src/api/session";
import { hasPermission as hasPerm } from "@/src/lib/permissions";
import { storage } from "@/src/utils/storage";

export interface PanelProfile {
  id: string;
  name: string;
  baseUrl: string; // normalized, ends with /api/v1/admin
}

type Status = "loading" | "disconnected" | "connected";

interface AuthContextValue {
  status: Status;
  profiles: PanelProfile[];
  activeProfile: PanelProfile | null;
  permissions: string[];
  adminName: string | null;
  locked: boolean;
  lockEnabled: boolean;
  connect: (rawUrl: string, key: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setLockEnabled: (enabled: boolean) => Promise<void>;
  lockNow: () => void;
  unlock: () => void;
  can: (permission: string) => boolean;
}

const PROFILES_KEY = "wisecp.profiles";
const ACTIVE_KEY = "wisecp.activeProfileId";
const LOCK_KEY = "wisecp.lockEnabled";
const keyStore = (id: string) => `wisecp.key.${id}`;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<Status>("loading");
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PanelProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockEnabled, setLockEnabledState] = useState(false);
  const appState = useRef(AppState.currentState);

  // Bootstrap from storage.
  useEffect(() => {
    (async () => {
      const saved = (await storage.getItem<PanelProfile[]>(PROFILES_KEY, [])) ?? [];
      const activeId = await storage.getItem<string>(ACTIVE_KEY, "");
      const lock = (await storage.getItem<boolean>(LOCK_KEY, false)) ?? false;
      setProfiles(saved);
      setLockEnabledState(lock);

      const active = saved.find((p) => p.id === activeId) ?? saved[0] ?? null;
      if (active) {
        const key = await storage.secureGet<string>(keyStore(active.id), "");
        if (key) {
          setSession(active.baseUrl, key);
          setActiveProfile(active);
          setLocked(lock);
          // Refresh permissions in the background; keep working if offline.
          try {
            const me = await whoami(active.baseUrl, key);
            setPermissions(me.permissions ?? []);
            setAdminName(me.name ?? null);
          } catch {
            // ignore — cached session still usable for reads
          }
          setStatus("connected");
          return;
        }
      }
      setStatus("disconnected");
    })();
  }, []);

  // Re-lock when returning from background.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/active/) && next.match(/inactive|background/) && lockEnabled && activeProfile) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [lockEnabled, activeProfile]);

  async function persistProfiles(next: PanelProfile[]) {
    setProfiles(next);
    await storage.setItem(PROFILES_KEY, next);
  }

  async function connect(rawUrl: string, key: string) {
    const baseUrl = normalizeBaseUrl(rawUrl);
    // 1) Verify the address is reachable (no key).
    await pingPanel(rawUrl);
    // 2) Verify the key + read its permissions (no retry on 401 inside).
    const me = await whoami(rawUrl, key);

    const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/api\/v1\/admin$/, "");
    const existing = profiles.find((p) => p.baseUrl === baseUrl);
    const id = existing?.id ?? `${Date.now().toString(36)}`;
    const profile: PanelProfile = { id, name: me.name ? `${me.name} · ${host}` : host, baseUrl };

    await storage.secureSet(keyStore(id), key);
    const next = existing ? profiles.map((p) => (p.id === id ? profile : p)) : [...profiles, profile];
    await persistProfiles(next);
    await storage.setItem(ACTIVE_KEY, id);

    setSession(baseUrl, key);
    setActiveProfile(profile);
    setPermissions(me.permissions ?? []);
    setAdminName(me.name ?? null);
    setLocked(false);
    setStatus("connected");
  }

  async function switchProfile(id: string) {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    const key = await storage.secureGet<string>(keyStore(id), "");
    if (!key) return;
    setSession(profile.baseUrl, key);
    setActiveProfile(profile);
    await storage.setItem(ACTIVE_KEY, id);
    setPermissions([]);
    try {
      const me = await whoami(profile.baseUrl, key);
      setPermissions(me.permissions ?? []);
      setAdminName(me.name ?? null);
    } catch {
      // keep going; cached reads may still work
    }
  }

  async function removeProfile(id: string) {
    await storage.secureRemove(keyStore(id));
    const next = profiles.filter((p) => p.id !== id);
    await persistProfiles(next);
    if (activeProfile?.id === id) {
      const fallback = next[0] ?? null;
      if (fallback) {
        await switchProfile(fallback.id);
      } else {
        setSession(null, null);
        setActiveProfile(null);
        setPermissions([]);
        setAdminName(null);
        await storage.removeItem(ACTIVE_KEY);
        setStatus("disconnected");
      }
    }
  }

  async function disconnect() {
    if (activeProfile) await storage.secureRemove(keyStore(activeProfile.id));
    const next = profiles.filter((p) => p.id !== activeProfile?.id);
    await persistProfiles(next);
    await storage.removeItem(ACTIVE_KEY);
    setSession(null, null);
    setActiveProfile(null);
    setPermissions([]);
    setAdminName(null);
    setStatus(next.length ? "disconnected" : "disconnected");
  }

  async function setLockEnabled(enabled: boolean) {
    setLockEnabledState(enabled);
    await storage.setItem(LOCK_KEY, enabled);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profiles,
      activeProfile,
      permissions,
      adminName,
      locked,
      lockEnabled,
      connect,
      switchProfile,
      removeProfile,
      disconnect,
      setLockEnabled,
      lockNow: () => setLocked(true),
      unlock: () => setLocked(false),
      can: (p: string) => hasPerm(permissions, p),
    }),
    [status, profiles, activeProfile, permissions, adminName, locked, lockEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
