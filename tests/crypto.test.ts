import assert from "node:assert/strict";
import test from "node:test";
import { createOtp, hashOtp, randomToken, safeEqual, sha256 } from "../src/lib/crypto";

test("genera tokens de 256 bits en hexadecimal", () => {
  const token = randomToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(token, randomToken());
});

test("genera OTP de seis dígitos", () => assert.match(createOtp(), /^\d{6}$/));

test("hash y comparación no aceptan valores distintos", () => {
  process.env.SESSION_SECRET = "test-secret-long-enough";
  const hash = hashOtp("123456", "contract-1");
  assert.equal(safeEqual(hash, hashOtp("123456", "contract-1")), true);
  assert.equal(safeEqual(hash, hashOtp("654321", "contract-1")), false);
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
