import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

export type VerificationStatus = "unverified" | "review" | "verified";

export type IdentityVerificationData = {
  status: VerificationStatus;
  fullName: string;
  document: string; // CPF ou CNPJ
  birthDate: string; // YYYY-MM-DD
  address: string;
  pixKey: string;
  updatedAt: string;
};

const STORAGE_KEY = "nellor.identityVerification";

const schema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo").max(120),
  document: z
    .string()
    .trim()
    .min(11, "Informe CPF ou CNPJ")
    .max(18, "Documento inválido"),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD)"),
  address: z.string().trim().min(8, "Informe seu endereço").max(240),
  pixKey: z.string().trim().min(5, "Informe sua chave Pix").max(120),
});

const defaultState: IdentityVerificationData = {
  status: "unverified",
  fullName: "",
  document: "",
  birthDate: "",
  address: "",
  pixKey: "",
  updatedAt: new Date().toISOString(),
};

/**
 * Frontend-only (placeholder): mantém o estado de verificação no storage local.
 * IMPORTANTE: isso NÃO é uma garantia de segurança; o backend fará a validação real.
 */
export function useIdentityVerification() {
  const [data, setData] = useState<IdentityVerificationData>(defaultState);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setData({ ...defaultState, ...parsed });
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: IdentityVerificationData) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const save = (partial: Omit<IdentityVerificationData, "status" | "updatedAt">) => {
    const result = schema.safeParse(partial);
    if (!result.success) {
      setLastError(result.error.errors[0]?.message ?? "Dados inválidos");
      return false;
    }

    setLastError(null);
    persist({
      ...data,
      ...result.data,
      status: "review",
      updatedAt: new Date().toISOString(),
    });
    return true;
  };

  const setStatus = (status: VerificationStatus) => {
    persist({ ...data, status, updatedAt: new Date().toISOString() });
  };

  // Temporariamente desabilitado para testes — o backend fará a validação real
  const canSell = true;
  const canWithdraw = data.status === "verified";

  const statusLabel = useMemo(() => {
    if (data.status === "verified") return "Verificado";
    if (data.status === "review") return "Em análise";
    return "Não verificado";
  }, [data.status]);

  return {
    data,
    statusLabel,
    canSell,
    canWithdraw,
    lastError,
    save,
    setStatus,
  };
}
