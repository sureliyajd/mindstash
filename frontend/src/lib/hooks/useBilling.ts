'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billing } from "@/lib/api";

export interface BillingStatus {
  plan: string;
  subscription_status: string | null;
  plan_expires_at: string | null;
  subscription_canceled_at: string | null;
  usage: {
    items_this_month: number;
    items_limit: number | null;
    chat_messages_this_month: number;
    chat_messages_limit: number | null;
  };
  features: {
    semantic_search: boolean;
    telegram: boolean;
    daily_briefing: boolean;
    weekly_digest: boolean;
  };
  payments_configured: boolean;
  variant_ids: {
    starter_monthly: string | null;
    starter_annual: string | null;
    pro_monthly: string | null;
    pro_annual: string | null;
  } | null;
}

export function useBillingStatus() {
  return useQuery<BillingStatus>({
    queryKey: ["billing", "status"],
    queryFn: () => billing.getStatus(),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useUpgrade() {
  return useMutation({
    mutationFn: async (variantId: string) => {
      const data = await billing.createCheckout(variantId);
      window.location.href = data.checkout_url;
      return data;
    },
  });
}

export function useOpenPortal() {
  return useMutation({
    mutationFn: async () => {
      const data = await billing.openPortal();
      window.location.href = data.portal_url;
      return data;
    },
  });
}

export function useCancelSubscription() {
  return useMutation({
    mutationFn: () => billing.cancelSubscription(),
  });
}

export function useSyncSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billing.syncSubscription(),
    onSuccess: () => {
      // Force refetch billing status after sync so UI reflects new plan
      queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}
