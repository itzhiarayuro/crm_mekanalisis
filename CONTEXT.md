# Contexto de dominio

## Cliente

Registro canónico almacenado en `Bd_clientes.public.clientes`. Puede ser prospecto o cliente activo y conserva sus datos comerciales (`tipo`, `estado` y `canal_origen`). Es la única fuente de clientes para el CRM de contratos.

## Contratante

Cliente que figura y firma un contrato. En esta primera versión es el mismo registro de Cliente: se usa su nombre y correo, sin un firmante alterno.

## Cotización

Propuesta comercial almacenada en `Bd_clientes.public.cotizaciones` y vinculada a un Cliente. Un Contrato puede referenciar una Cotización, pero no es un requisito: también se permiten contratos acordados directamente.

## Contrato

Documento contractual asociado a un Contratante y, opcionalmente, a una Cotización. Su ciclo de firma y la evidencia de auditoría se administran en las tablas contractuales del mismo proyecto `Bd_clientes`.
