import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Formata um valor em centavos para string BRL "R$ X,XX"
 */
export const formatCurrency = (cents: number): string => {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata um valor decimal (ex: 29.90) para string BRL "R$ 29,90"
 */
export const formatCurrencyFromDecimal = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Converte string de input do usuario para centavos.
 * Remove tudo que nao for digito e interpreta como centavos.
 * Ex: "2000" -> 2000 (= R$ 20,00)
 */
export const parseCurrencyInput = (raw: string): number => {
  return parseInt(raw.replace(/\D/g, '') || '0', 10);
};

/**
 * Converte centavos para valor decimal (para salvar no banco)
 * Ex: 2990 -> 29.90
 */
export const centsToDecimal = (cents: number): number => {
  return cents / 100;
};

/**
 * Converte valor decimal para centavos
 * Ex: 29.90 -> 2990
 */
export const decimalToCents = (value: number): number => {
  return Math.round(value * 100);
};

interface CurrencyInputProps {
  value: number; // valor em centavos
  onChange: (cents: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Input monetário com máscara dinâmica BRL.
 * Internamente trabalha com centavos.
 * Conforme o usuário digita: 2 -> R$ 0,02 / 200 -> R$ 2,00
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  className,
  disabled,
  id,
}) => {
  const formatDisplay = useCallback((cents: number): string => {
    if (cents === 0) return '';
    return formatCurrency(cents);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      const cents = parseInt(raw || '0', 10);
      onChange(cents);
    },
    [onChange]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // On focus, if empty show nothing
    },
    []
  );

  return React.createElement(Input, {
    id,
    type: 'text',
    inputMode: 'numeric',
    value: formatDisplay(value),
    onChange: handleChange,
    onFocus: handleFocus,
    placeholder,
    className,
    disabled,
  });
};
