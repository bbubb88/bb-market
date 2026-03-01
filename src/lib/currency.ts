// Currency exchange rates
export const exchangeRates = {
  USDT: 1,
  TWD: 32.5,  // 1 USDT = 32.5 TWD
  KRW: 1350,  // 1 USDT = 1350 KRW
};

export const currencies = [
  { id: 'USDT', symbol: '$', name: 'USDT', nameTw: 'USDT', nameKo: 'USDT' },
  { id: 'TWD', symbol: 'NT$', name: '台币', nameTw: '台币', nameKo: '대만$' },
  { id: 'KRW', symbol: '₩', name: '韩元', nameTw: '韩元', nameKo: '원' },
];

export function convertPrice(usdtPrice: number, currency: string): string {
  const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
  const converted = usdtPrice * rate;
  
  if (currency === 'USDT') {
    return `$${converted.toFixed(2)}`;
  } else if (currency === 'TWD') {
    return `NT$${converted.toFixed(0)}`;
  } else if (currency === 'KRW') {
    return `₩${converted.toFixed(0)}`;
  }
  return `$${converted.toFixed(2)}`;
}

export function formatPrice(usdtPrice: number, currency: string = 'USDT'): string {
  const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
  const converted = usdtPrice * rate;
  
  if (currency === 'USDT') {
    return `$${converted.toFixed(2)} USDT`;
  } else if (currency === 'TWD') {
    return `NT$${Math.round(converted).toLocaleString()}`;
  } else if (currency === 'KRW') {
    return `₩${Math.round(converted).toLocaleString()}`;
  }
  return `$${converted.toFixed(2)}`;
}
