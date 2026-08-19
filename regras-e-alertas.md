# Regras do sistema de validação de documentos

Quando um documento é enviado para conferência, o sistema compara o que foi
declarado com o que está escrito na nota fiscal, na ordem de carregamento e
no ticket de balança. Dependendo do resultado, isso gera um **bloqueio** ou
apenas um **alerta**.

## 🚫 Bloqueia

- **Contrato diferente**: o número do contrato da nota fiscal não bate com o
  contrato informado.
- **Destinatário diferente**: o CNPJ/CPF de quem recebe a mercadoria na nota
  fiscal não bate com o destinatário informado (ou nenhuma nota fiscal
  correspondente foi encontrada), mesmo que o nome pareça parecido.
- **Remetente diferente**: o CNPJ/CPF de quem emitiu a nota fiscal não bate
  com o remetente informado (mesmo que o nome pareça parecido, se o
  documento for diferente, bloqueia).
- **Placa não confirmada**: a confiança de que a placa é a mesma em todos os
  documentos ficou abaixo de 90%.

## ⚠️ Só avisa (não bloqueia)

Quando algum desses dados não bate exatamente com o que está nos documentos,
o cliente recebe um aviso para corrigir o cadastro, mas a carga segue
normalmente:

- Peso (bruto, tara ou líquido)
- Número da ordem de carregamento
- Chave de acesso da nota fiscal
- Nome ou CPF do motorista
- Valor total ou valor unitário da nota fiscal

## ℹ️ Informativo

- Grau de semelhança entre o nome do destinatário/remetente declarado e o da
  nota fiscal (ajuda a identificar erro de digitação, mas não decide nada
  sozinho).

## Antes mesmo de validar

Se algum dado obrigatório não for enviado no cadastro, o sistema recusa a
solicitação de cara e nem chega a rodar essas conferências.
