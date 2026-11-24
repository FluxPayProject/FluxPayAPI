const draftAmount = /^[0-9]{0,13}(?:\.[0-9]{0,2})?$/;

export function updateEuroAmount(field: HTMLInputElement, previousValue: string): string {
  if (draftAmount.test(field.value)) return field.value;

  field.value = previousValue;
  return previousValue;
}

export function parseEuroAmount(value: string): number | null {
  const amount = Number(value);
  return draftAmount.test(value) && amount > 0 ? amount : null;
}
