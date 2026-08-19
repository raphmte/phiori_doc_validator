//tudo certo
curl -X POST http://localhost:3000/doc-validations \
 -H "x-api-key: token" \
 -F "document=@/home/lopes/Documentos/OCR/Validacao/ADM/ADM 1.pdf;type=application/pdf" \
 -F "plate=QBQ2697" \
 -F "grossWeightKg=73820" \
 -F "tareWeightKg=26220" \
 -F "netWeightKg=47600" \
 -F "loadingOrder=12001331" \
 -F "contract=7876P60467S" \
 -F "accessKey=51260852275517000197550010000000991215752671" \
 -F "driverName=SIDNEI ALBERTO SEMINOTTI" \
 -F "driverDocument=34546871953" \
 -F "driverPhone=66992179767" \
 -F "invoiceRecipientName=ADM DO BRASIL LTDA" \
 -F "invoiceRecipientDocument=02.003.402/0025-42" \
 -F "invoiceSenderName=AGROPECUARIA BOM PROGRESSO LTDA" \
 -F "invoiceSenderDocument=52275517000197" \
 -F "invoiceDate=2026-08-11" \
 -F "invoiceUnitValue=2.10" \
 -F "invoiceTotalValue=99960.00"

//bloqueante - contrato divergente do declarado na nota fiscal (CONTRACT_MISMATCH)
curl -X POST http://localhost:3000/doc-validations \
 -H "x-api-key: token" \
 -F "document=@/home/lopes/Documentos/OCR/Validacao/ADM/ADM 1.pdf;type=application/pdf" \
 -F "plate=QBQ2697" \
 -F "grossWeightKg=73820" \
 -F "tareWeightKg=26220" \
 -F "netWeightKg=47600" \
 -F "loadingOrder=12001331" \
 -F "contract=CONTRATO-ERRADO-123" \
 -F "accessKey=51260852275517000197550010000000991215752671" \
 -F "driverName=SIDNEI ALBERTO SEMINOTTI" \
 -F "driverDocument=34546871953" \
 -F "driverPhone=66992179767" \
 -F "invoiceRecipientName=ADM DO BRASIL LTDA" \
 -F "invoiceRecipientDocument=02.003.402/0025-42" \
 -F "invoiceSenderName=AGROPECUARIA BOM PROGRESSO LTDA" \
 -F "invoiceSenderDocument=52275517000197" \
 -F "invoiceDate=2026-08-11" \
 -F "invoiceUnitValue=2.10" \
 -F "invoiceTotalValue=99960.00"

//bloqueante - CNPJ do destinatário diferente do da nota fiscal (RECIPIENT_MISMATCH)
curl -X POST http://localhost:3000/doc-validations \
 -H "x-api-key: token" \
 -F "document=@/home/lopes/Documentos/OCR/Validacao/ADM/ADM 1.pdf;type=application/pdf" \
 -F "plate=QBQ2697" \
 -F "grossWeightKg=73820" \
 -F "tareWeightKg=26220" \
 -F "netWeightKg=47600" \
 -F "loadingOrder=12001331" \
 -F "contract=7876P60467S" \
 -F "accessKey=51260852275517000197550010000000991215752671" \
 -F "driverName=SIDNEI ALBERTO SEMINOTTI" \
 -F "driverDocument=34546871953" \
 -F "driverPhone=66992179767" \
 -F "invoiceRecipientName=ADM DO BRASIL LTDA" \
 -F "invoiceRecipientDocument=11.222.333/0001-44" \
 -F "invoiceSenderName=AGROPECUARIA BOM PROGRESSO LTDA" \
 -F "invoiceSenderDocument=52275517000197" \
 -F "invoiceDate=2026-08-11" \
 -F "invoiceUnitValue=2.10" \
 -F "invoiceTotalValue=99960.00"

//bloqueante - placa declarada diferente da placa nos documentos (PLATE_LOW_CONFIDENCE)
curl -X POST http://localhost:3000/doc-validations \
 -H "x-api-key: token" \
 -F "document=@/home/lopes/Documentos/OCR/Validacao/ADM/ADM 1.pdf;type=application/pdf" \
 -F "plate=ZZZ9999" \
 -F "grossWeightKg=73820" \
 -F "tareWeightKg=26220" \
 -F "netWeightKg=47600" \
 -F "loadingOrder=12001331" \
 -F "contract=7876P60467S" \
 -F "accessKey=51260852275517000197550010000000991215752671" \
 -F "driverName=SIDNEI ALBERTO SEMINOTTI" \
 -F "driverDocument=34546871953" \
 -F "driverPhone=66992179767" \
 -F "invoiceRecipientName=ADM DO BRASIL LTDA" \
 -F "invoiceRecipientDocument=02.003.402/0025-42" \
 -F "invoiceSenderName=AGROPECUARIA BOM PROGRESSO LTDA" \
 -F "invoiceSenderDocument=52275517000197" \
 -F "invoiceDate=2026-08-11" \
 -F "invoiceUnitValue=2.10" \
 -F "invoiceTotalValue=99960.00"

//alerta - pesos e ordem de carregamento divergentes, mas sem bloquear (needsUpdate nos pesos/loadingOrder)
curl -X POST http://localhost:3000/doc-validations \
 -H "x-api-key: token" \
 -F "document=@/home/lopes/Documentos/OCR/Validacao/ADM/ADM 1.pdf;type=application/pdf" \
 -F "plate=QBQ2697" \
 -F "grossWeightKg=70000" \
 -F "tareWeightKg=25000" \
 -F "netWeightKg=45000" \
 -F "loadingOrder=99999999" \
 -F "contract=7876P60467S" \
 -F "accessKey=51260852275517000197550010000000991215752671" \
 -F "driverName=SIDNEI ALBERTO SEMINOTTI" \
 -F "driverDocument=34546871953" \
 -F "driverPhone=66992179767" \
 -F "invoiceRecipientName=ADM DO BRASIL LTDA" \
 -F "invoiceRecipientDocument=02.003.402/0025-42" \
 -F "invoiceSenderName=AGROPECUARIA BOM PROGRESSO LTDA" \
 -F "invoiceSenderDocument=52275517000197" \
 -F "invoiceDate=2026-08-11" \
 -F "invoiceUnitValue=2.10" \
 -F "invoiceTotalValue=99960.00"
