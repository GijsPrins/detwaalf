import { describe, expect, it } from "vitest";
import { isPublicIpAddress } from "~/utils/networkAddress";

describe("isPublicIpAddress", () => {
  it.each(["93.184.215.14", "185.199.108.153", "2606:4700:4700::1111", "[2a00:1450::1]"])(
    "allows public address %s",
    (address) => {
      expect(isPublicIpAddress(address)).toBe(true);
    },
  );

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::a00:1",
    "not-an-ip",
    "256.1.1.1",
  ])("blocks %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false);
  });
});
