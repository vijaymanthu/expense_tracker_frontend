export const sanitizeDecimalInput = (value: string, decimalPlaces = 2) => {
  let nextValue = "";
  let hasDecimalPoint = false;
  let decimalCount = 0;

  for (const character of value) {
    if (character >= "0" && character <= "9") {
      if (hasDecimalPoint) {
        if (decimalCount >= decimalPlaces) {
          continue;
        }
        decimalCount += 1;
      }
      nextValue += character;
      continue;
    }

    if (character === "." && !hasDecimalPoint) {
      hasDecimalPoint = true;
      nextValue += nextValue.length === 0 ? "0." : ".";
    }
  }

  return nextValue;
};

export const sanitizeIntegerInput = (value: string) =>
  Array.from(value)
    .filter((character) => character >= "0" && character <= "9")
    .join("");
