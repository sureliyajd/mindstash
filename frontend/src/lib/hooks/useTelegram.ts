'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegram } from '../api';
import type { TelegramLinkCode } from '../types/telegram';

const TELEGRAM_STATUS_KEY = ['telegram-status'];

export function useTelegram() {
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState<TelegramLinkCode | null>(null);

  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    queryKey: TELEGRAM_STATUS_KEY,
    queryFn: telegram.getStatus,
    // Poll every 5s while a code is displayed (waiting for user to link)
    refetchInterval: linkCode ? 5000 : false,
  });

  // Clear the code once linking succeeds (detected via polling)
  if (linkCode && status?.linked) {
    setLinkCode(null);
  }

  const generateLink = useMutation({
    mutationFn: telegram.generateLink,
    onSuccess: (data) => {
      setLinkCode(data);
    },
  });

  const unlink = useMutation({
    mutationFn: telegram.unlink,
    onSuccess: () => {
      setLinkCode(null);
      queryClient.invalidateQueries({ queryKey: TELEGRAM_STATUS_KEY });
    },
  });

  const clearCode = () => setLinkCode(null);

  return {
    status: status ?? null,
    isLoading,
    isError,
    linkCode,
    generateLink: generateLink.mutate,
    isGenerating: generateLink.isPending,
    unlink: unlink.mutate,
    isUnlinking: unlink.isPending,
    clearCode,
  };
}
