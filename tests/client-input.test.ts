import test from "node:test";
import assert from "node:assert/strict";
import { clientInputSchema } from "../src/lib/client-input";

test("client statuses match the Bd_clientes constraint", () => {
  for (const status of ["prospecto", "tibia", "caliente", "cliente_activo", "cliente_inactivo"]) {
    assert.equal(clientInputSchema.safeParse({ name: "Cliente de prueba", status }).success, true);
  }
  assert.equal(clientInputSchema.safeParse({ name: "Cliente de prueba", status: "activo" }).success, false);
  assert.equal(clientInputSchema.safeParse({ name: "Cliente de prueba", status: "inactivo" }).success, false);
});
