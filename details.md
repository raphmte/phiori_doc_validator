dvrData atual

```json
{
  "matchedInvoice": {
    "found": true,
    "accessKeys": ["51260852275517000197550010000000991215752671"],
    "recipientDocumentMatch": true,
    "recipientNameSimilarityPercent": 100
  },
  "plate": {
    "declared": "QBQ2697",
    "invoice": "QBQ2697",
    "loadingOrder": "QBQ2697",
    "weighingTicket": "QBQ2697",
    "confidencePercent": 100
  },
  "grossWeightKg": {
    "value": 73820,
    "needsUpdate": false,
    "message": null
  },
  "tareWeightKg": {
    "value": 26220,
    "needsUpdate": false,
    "message": null
  },
  "netWeightKg": {
    "value": 47600,
    "needsUpdate": false,
    "message": null
  },
  "loadingOrder": {
    "value": "12001331",
    "needsUpdate": false,
    "message": null
  },
  "accessKey": {
    "value": "51260852275517000197550010000000991215752671",
    "needsUpdate": false,
    "message": null
  },
  "driverName": {
    "value": "SIDNEI ALBERTO SEMINOTTI",
    "needsUpdate": false,
    "message": null
  },
  "driverDocument": {
    "value": "34546871953",
    "needsUpdate": false,
    "message": null
  },
  "invoices": [
    {
      "accessKey": "51260852275517000197550010000000991215752671",
      "invoiceDate": {
        "value": "2026-08-11",
        "needsUpdate": false,
        "message": null
      },
      "invoiceUnitValue": {
        "value": 2.1,
        "needsUpdate": false,
        "message": null
      }
    }
  ],
  "invoiceTotalValue": {
    "value": 99960,
    "needsUpdate": false,
    "message": null
  },
  "contract": {
    "declared": "7876P60467S",
    "invoice": "7876P60467S",
    "match": true
  },
  "sender": {
    "declaredName": "AGROPECUARIA BOM PROGRESSO LTDA",
    "declaredDocument": "52275517000197",
    "invoiceName": "AGROPECUARIA BOM PROGRESSO LTDA",
    "invoiceDocument": "52275517000197",
    "match": true
  }
}
```

como deveria ser:

````json
```json
{
 "matchedInvoice": {
  "found": true,
  "accessKeys": [
   "51260852275517000197550010000000991215752671"
  ],
  "recipientDocumentMatch": true,
  "recipientNameSimilarityPercent": 100
 },
 "plate": {
  "declared": "QBQ2697",
  "invoice": "QBQ2697",
  "loadingOrder": "QBQ2697",
  "weighingTicket": "QBQ2697",
  "confidencePercent": 100
 },
 "contract": {
  "declared": "7876P60467S",
  "invoice": "7876P60467S",
  "match": true
 },
 "sender": {
  "declaredName": "AGROPECUARIA BOM PROGRESSO LTDA",
  "declaredDocument": "52275517000197",
  "invoiceName": "AGROPECUARIA BOM PROGRESSO LTDA",
  "invoiceDocument": "52275517000197",
  "documentMatch": true,
  "nameSimilarityPercent": 100
 }
}
````

`ddvPayload`: atual

```json
{
  "plate": "QBQ2697",
  "grossWeightKg": 73820,
  "tareWeightKg": 26220,
  "netWeightKg": 47600,
  "loadingOrder": 12001331,
  "contract": "7876P60467S",
  "accessKey": "51260852275517000197550010000000991215752671",
  "driverName": "SIDNEI ALBERTO SEMINOTTI",
  "driverDocument": "34546871953",
  "driverPhone": "66992179767",
  "invoiceRecipientName": "ADM DO BRASIL LTDA",
  "invoiceRecipientDocument": "02003402002542",
  "invoiceSenderName": "AGROPECUARIA BOM PROGRESSO LTDA",
  "invoiceSenderDocument": "52275517000197",
  "invoiceDate": "2026-08-11",
  "invoiceUnitValue": 2.1,
  "invoiceTotalValue": 99960
}
```

como deveria ser:

```json
{
  "plate": "QBQ2697",
  "grossWeightKg": {
    "value": 73820.0,
    "needsUpdate": false,
    "message": null
  },
  "tareWeightKg": {
    "value": 26220.0,
    "needsUpdate": false,
    "message": null
  }
  //demais campos
}
```
