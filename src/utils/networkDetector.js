/**
 * Detect Nigerian telecom network provider from phone number
 * Supports MTN, Airtel, Glo, and 9mobile
 */
export function detectNetwork(phone) {
  if (!phone) return null;

  // Remove non-digit characters
  let cleanPhone = String(phone).replace(/\D/g, '');

  // Convert +234 or 234 to local format 0...
  if (cleanPhone.startsWith('234') && cleanPhone.length >= 13) {
    cleanPhone = '0' + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith('234')) {
    cleanPhone = '0' + cleanPhone.slice(3);
  }

  if (cleanPhone.length < 4) return null;

  // Check 5-digit prefixes (special MTN prefixes)
  const prefix5 = cleanPhone.slice(0, 5);
  if (prefix5 === '07025' || prefix5 === '07026') {
    return 'MTN';
  }

  const prefix4 = cleanPhone.slice(0, 4);

  // MTN prefixes
  const mtnPrefixes = [
    '0803', '0806', '0810', '0813', '0814', '0816',
    '0703', '0706', '0704', '0903', '0906', '0913', '0916'
  ];

  // Airtel prefixes
  const airtelPrefixes = [
    '0802', '0808', '0812', '0701', '0708',
    '0901', '0902', '0904', '0907', '0911', '0912'
  ];

  // Glo prefixes
  const gloPrefixes = [
    '0805', '0807', '0811', '0815', '0705', '0905', '0915'
  ];

  // 9mobile (formerly Etisalat) prefixes
  const nineMobilePrefixes = [
    '0809', '0817', '0818', '0908', '0909'
  ];

  if (mtnPrefixes.includes(prefix4)) return 'MTN';
  if (airtelPrefixes.includes(prefix4)) return 'Airtel';
  if (gloPrefixes.includes(prefix4)) return 'Glo';
  if (nineMobilePrefixes.includes(prefix4)) return '9mobile';

  return null;
}
