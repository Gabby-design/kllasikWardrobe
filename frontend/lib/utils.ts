export const formatPrice = (amount: number | string): string => {
  return `₦${Number(amount).toLocaleString()}`;
};
