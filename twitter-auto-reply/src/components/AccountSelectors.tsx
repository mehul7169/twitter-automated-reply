import { useState } from "react";
import { ACCOUNTS_TO_ACCESS_TOKENS } from "../utils/constants";

type Account = keyof typeof ACCOUNTS_TO_ACCESS_TOKENS;

interface AccountSelectorProps {
  onAccountSelect: (account: Account) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  onAccountSelect,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<Account>("bot");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as Account;
    setSelectedAccount(selected);
    onAccountSelect(selected);
  };

  return (
    <div className="mb-4">
      <label
        htmlFor="account-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Account
      </label>
      <select
        id="account-select"
        value={selectedAccount}
        onChange={handleChange}
        className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        {Object.entries(ACCOUNTS_TO_ACCESS_TOKENS).map(([key, value]) => (
          <option key={key} value={key}>
            {value.userHandle}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AccountSelector;
