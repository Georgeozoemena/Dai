import { useEffect } from "react";

import { ExpenseScreen } from "./src/features/transactions/screens/ExpenseScreen";

import { getProfile, createProfile } from "./src/features/onboarding/services/profileService";

import { getAccounts, createAccount, deleteAccount } from "./src/features/accounts/services/accountService";

import { selectAccount } from "./src/features/accounts/services/accountSelectionService";

import { useAccountStore } from "./src/store/account/accountStore";
import { TransactionsScreen } from "./src/features/transactions/screens/TransactionsScreen";
import { AccountCard } from "./src/features/transactions/components/AccountCard";
import { AccountsScreen } from "./src/features/transactions/screens/AccountsScreen";
import { IncomeScreen } from "./src/features/transactions/screens/IncomeScreen";
import { DashboardScreen } from "./src/features/dashboard/screens/DashboardScreen";
import { TransactionDetailScreen } from "./src/features/transactions/screens/TransactionDetailScreen";
import { EditTransactionScreen } from "./src/features/transactions/screens/EditTransactionScreen";

export default function App() {
  useEffect(() => {
    async function setupTestAccount() {
      try {
        console.log("========== TEST START ==========");

        // -----------------------------------
        // 1. Get or create profile
        // -----------------------------------

        let profile = await getProfile();

        console.log("PROFILE:", profile);

        if (!profile) {
          console.log("No profile found. Creating test profile...");
          
          profile = await createProfile({
            id: "profile-123",
            name: "Test User",
            currencyCode: "NGN",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          console.log("PROFILE CREATED:", profile);
        }

        console.log(
          "PROFILE ID:",
          profile.id
        );

        // -----------------------------------
        // 2. Get or create accounts
        // -----------------------------------

        let accounts = await getAccounts(
          profile.id
        );

        console.log(
          "ACCOUNTS:",
          accounts
        );

        console.log(
          "NUMBER OF ACCOUNTS:",
          accounts.length
        );

        if (accounts.length === 0) {
          console.log("No accounts found. Creating test accounts...");
          
          const ngnAccount = await createAccount({
            id: "account-123",
            profileId: profile.id,
            name: "Naira Account",
            currencyCode: "NGN",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          const usdAccount = await createAccount({
            id: "account-456",
            profileId: profile.id,
            name: "Dollar Account",
            currencyCode: "USD",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          accounts = [ngnAccount, usdAccount];
          console.log("ACCOUNTS CREATED:", accounts);
        } else if (accounts.length === 1) {
          console.log("Only one account found. Adding Dollar account...");
          
          const usdAccount = await createAccount({
            id: "account-456",
            profileId: profile.id,
            name: "Dollar Account",
            currencyCode: "USD",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          accounts = [...accounts, usdAccount];
          console.log("DOLLAR ACCOUNT ADDED:", usdAccount);
        }

        // -----------------------------------
        // 3. Select first account
        // -----------------------------------

        const testAccount = accounts[0];

        console.log(
          "TEST ACCOUNT:",
          testAccount
        );

        selectAccount(testAccount);

        // -----------------------------------
        // 4. Verify Zustand
        // -----------------------------------

        const selectedAccountId =
          useAccountStore.getState()
            .currentAccountId;

        console.log(
          "SELECTED ACCOUNT ID:",
          selectedAccountId
        );

        // -----------------------------------
        // 5. Verify it matches
        // -----------------------------------

        if (
          selectedAccountId ===
          testAccount.id
        ) {
          console.log(
            "SUCCESS: Account selected correctly."
          );
        } else {
          console.log(
            "TEST ERROR: Account selection failed."
          );
        }

        console.log(
          "========== TEST END =========="
        );
      } catch (error) {
        console.error(
          "TEST FAILED:",
          error
        );
      }
    }

    setupTestAccount();
  }, []);

  // return <ExpenseScreen />;
  // return <AccountsScreen />;
  // return <IncomeScreen />;
  return <TransactionsScreen />;
  // return <DashboardScreen />;
  // return <EditTransactionScreen transactionId="4d6cee35-e715-4b23-b1be-4653a70f2c7b" />
  // return <TransactionDetailScreen transactionId="d78abbe3-85a0-45d5-9e1c-3e6739d77898" />;
}