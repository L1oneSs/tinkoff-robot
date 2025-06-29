export const quotationToNumber = (quotation: unknown): number => {
    if (typeof quotation === "number") return quotation;
    if (
      quotation &&
      typeof quotation === "object" &&
      "units" in quotation &&
      "nano" in quotation
    ) {
      const obj = quotation as { units: string | number; nano: string | number };
      return Number(obj.units) + Number(obj.nano) / 1_000_000_000;
    }
    return Number(quotation) || 0;
  };