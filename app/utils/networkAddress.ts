// Used by server routes that fetch admin-supplied URLs, so they cannot be
// pointed at loopback, private-network or cloud-metadata addresses.

function parseIpv4(address: string): number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

function isPublicIpv4(address: string): boolean {
  const octets = parseIpv4(address);
  if (!octets) return false;
  const [a = 0, b = 0, c = 0] = octets;

  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false; // multicast and reserved
  return true;
}

function isPublicIpv6(address: string): boolean {
  const lower = address.toLowerCase();

  const mappedIpv4 = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPublicIpv4(mappedIpv4);

  if (lower === "::" || lower === "::1") return false;
  if (lower.startsWith("::ffff:")) return false; // hex-form mapped IPv4
  if (/^f[cd]/.test(lower)) return false; // unique local
  if (/^fe[89ab]/.test(lower)) return false; // link-local
  if (lower.startsWith("ff")) return false; // multicast
  if (lower.startsWith("2001:db8") || lower.startsWith("2001:0db8")) return false;
  if (lower.startsWith("64:ff9b:")) return false; // NAT64 can reach IPv4 ranges
  return true;
}

export function isPublicIpAddress(address: string): boolean {
  const unbracketed = address.replace(/^\[|\]$/g, "");
  return unbracketed.includes(":")
    ? isPublicIpv6(unbracketed)
    : isPublicIpv4(unbracketed);
}
