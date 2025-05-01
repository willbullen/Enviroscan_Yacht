# Prompt for Replit: Add Ledger Tab to Financial Management

**Objective:** Implement a new "Ledger" tab within the existing Financial Management section (`/financial-management`) of the application.

**Context:** The Financial Management section currently uses a tabbed interface (Accounts, Deposits, Banking, etc.). Previous testing revealed issues with several existing tabs being non-functional (not clickable). Ensure the new Ledger tab is implemented correctly and avoids these issues.

**Requirements:**

1.  **Add New "Ledger" Tab:**
    *   Introduce a new tab labeled "Ledger" within the horizontal tab group (alongside Accounts, Deposits, Banking, etc.).
    *   **Crucially:** Ensure this new tab, and ideally *all* tabs in this group, are correctly implemented as clickable elements that reliably switch the content displayed below them. Verify that clicking the "Ledger" tab displays the Ledger view and clicking other tabs switches away correctly.

2.  **Ledger View Content:** When the "Ledger" tab is active, display the following components:
    *   **Title:** e.g., "Account Ledger"
    *   **Filter Controls:**
        *   **Account Selector (Dropdown):**
            *   Label: "Select Account:"
            *   Populate this dropdown with the list of available accounts from the Chart of Accounts (fetch account names and IDs).
            *   Include an option for "All Accounts" if feasible, otherwise default to the first account in the list.
            *   Selecting an account should trigger a data refresh for the table below.
        *   **Date Range Selector:**
            *   Label: "Select Period:"
            *   Provide options for selecting a date range (e.g., using a date range picker component).
            *   Include common presets like "Last 30 Days", "This Month", "Last Month", "Year to Date", and a "Custom Range" option.
            *   Selecting a date range should trigger a data refresh for the table below.
    *   **Paginated Data Table:**
        *   Display transactions for the selected account(s) within the selected date range.
        *   **Columns:** Implement the table with the following columns:
            1.  `Date`: Date of the transaction.
            2.  `Category`: Transaction category (if applicable).
            3.  `Vendor`: Vendor associated with the transaction (if applicable).
            4.  `Deposit (€)`: Amount of deposit/income. Display 0 or empty if it's an expense.
            5.  `Expense (€)`: Amount of expense/payment. Display 0 or empty if it's a deposit.
            6.  `Balance (€)`: Running balance of the selected account after each transaction.
        *   **Data Fetching:** Implement logic to fetch relevant transactions (e.g., expenses, deposits, journal entries affecting the selected account) based on the selected account ID and date range.
        *   **Balance Calculation:** Calculate the running balance accurately. This requires fetching the account balance *before* the start date of the selected period and then applying each transaction's effect row by row.
        *   **Sorting:** Allow sorting the table by the `Date` column (ascending/descending).
        *   **Pagination:** Implement pagination controls (e.g., "Previous", "Next", page numbers) to handle potentially large numbers of transactions.
    *   **Empty State:** If no transactions are found for the selected criteria, display a clear message like "No transactions found for the selected account and period."
    *   **Loading State:** Display a loading indicator (e.g., spinner) while data is being fetched after changing the account or date range.

**Implementation Notes:**

*   Use existing UI components (from shadcn/ui, Tailwind CSS) for consistency where possible (dropdowns, date pickers, tables, buttons, pagination).
*   Ensure data fetching is efficient and handles potential errors gracefully.
*   Pay close attention to the correct implementation of the tab navigation and ensure the new Ledger tab functions reliably.
*   Test thoroughly, especially the running balance calculation and pagination.

