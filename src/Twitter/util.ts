import { formatBalance } from "@polkadot/util";

export const parseBalance = (amount: string) => {
  const amountWithUnit = formatBalance(amount, { withUnit: false, decimals: 18 });
  const [price, unit] = amountWithUnit.split(' ');
  return `${parseFloat(price).toFixed(2)}${unit ? ` ${unit}` : ''}`;
}
