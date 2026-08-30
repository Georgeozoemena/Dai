import { useState, useEffect } from "react";
import { useAccountStore } from "../store/account/accountStore";
import { getAccount } from "../features/accounts/services/accountService";

/**
 * Hook to get the current account's currency code
 * Returns "NGN" as default if no account is selected
 */
export function useAccountCurrency(): string {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const [currencyCode, setCurrencyCode] = useState<string>("NGN");

  useEffect(() => {
    const loadCurrency = async () => {
      if (!currentAccountId) {
        setCurrencyCode("NGN");
        return;
      }

      try {
        const account = await getAccount(currentAccountId);
        if (account) {
          setCurrencyCode(account.currencyCode);
        }
      } catch (error) {
        console.error("Failed to load account currency:", error);
        setCurrencyCode("NGN");
      }
    };

    loadCurrency();
  }, [currentAccountId]);

  return currencyCode;
}
