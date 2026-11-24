// 1288 -> "Rs. 1,288", 9.5 -> "Rs. 9.50"
export const formatPrice = (value) => {
  const number = Number(value);
  const hasCents = !Number.isInteger(number);
  return `Rs. ${number.toLocaleString("en-IN", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};
