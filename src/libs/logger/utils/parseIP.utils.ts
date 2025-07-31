import * as ipaddr from 'ipaddr.js';

export function parseIPUtils(ip: string | null | undefined) {
  if (!ip) {
    return;
  }
  if (ip === '::1') {
    return '127.0.0.1';
  }
  if (!ipaddr.isValid(ip)) {
    return;
  }
  const address = ipaddr.parse(ip);
  try {
    return (address as ipaddr.IPv6).toIPv4Address().toString();
  } catch {
    return address.toString();
  }
}
