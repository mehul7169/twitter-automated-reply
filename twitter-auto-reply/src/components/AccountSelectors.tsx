import {
  ACCOUNTS_TO_ACCESS_TOKENS,
  YASHRAJ_ACCOUNT_ACCESS_TOKENS,
} from "../utils/constants";

interface AccountSelectorProps {
  onAccountSelect: (
    account:
      | keyof typeof ACCOUNTS_TO_ACCESS_TOKENS
      | keyof typeof YASHRAJ_ACCOUNT_ACCESS_TOKENS
  ) => void;
}

export default function AccountSelector({
  onAccountSelect,
}: AccountSelectorProps) {
  return (
    <div className="max-w-xs">
      <label
        htmlFor="account"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Account:
      </label>
      <select
        id="account"
        onChange={(e) => onAccountSelect(e.target.value as any)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <optgroup label="Main Accounts">
          {Object.entries(ACCOUNTS_TO_ACCESS_TOKENS).map(([key, account]) => (
            <option key={key} value={key}>
              {account.userHandle}
            </option>
          ))}
        </optgroup>

        <optgroup label="Yashraj Accounts">
          {Object.entries(YASHRAJ_ACCOUNT_ACCESS_TOKENS).map(
            ([key, account]) => (
              <option key={key} value={key}>
                {account.userHandle}
              </option>
            )
          )}
        </optgroup>
      </select>
    </div>
  );
}
