export interface InstrumentPrice {
	ask: null | number;
	bid: null | number;
	last: null | number;
	lastInSek: null | number;
}

export interface Ticker {
	id: string;
	mic: string;
	isin: string;
	ticker: string;
	currencyCode: string;
	price: InstrumentPrice;
}

export interface TickerMessage {
	tickers: Ticker[];
}

 export const CloudSchema  = { 

        schemaId: 'ticker-v1', 

        avroDefinition: `{
  "type": "record",
  "name": "TickerMessage",
  "namespace": "com.financial.api",
  "doc": "Real-time update containing the latest pricing details of financial instruments.",
  "fields": [
    {
      "name": "tickers",
      "type": {
        "type": "array",
        "items": {
          "type": "record",
          "name": "Ticker",
          "doc": "A real-time update containing the latest pricing details of a financial instrument.",
          "fields": [
            {
              "name": "id",
              "type": "string",
              "doc": "Unique identifier of the instrument. Consists of type followed by the least common denominators making it unique. Example: STOCK-SE0000148884;XSTO;SEK"
            },
            {
              "name": "mic",
              "type": "string",
              "doc": "The Market Identifier Code (MIC), specifying the financial market where the instrument is listed."
            },
            {
              "name": "isin",
              "type": "string",
              "doc": "International Securities Identification Number (ISIN) uniquely identifying the financial instrument."
            },
            {
              "name": "ticker",
              "type": "string",
              "doc": "The stock market symbol or abbreviation used to identify the financial instrument on the exchange."
            },
            {
              "name": "currencyCode",
              "type": "string",
              "doc": "The code representing the currency in which the instrument's price is denominated."
            },
            {
              "name": "price",
              "type": {
                "type": "record",
                "name": "InstrumentPrice",
                "doc": "A representation of the current pricing details for a financial instrument.",
                "fields": [
                  {
                    "name": "ask",
                    "type": ["null", "double"],
                    "doc": "The current ask price. If no ask price is available, this can be null.",
                    "default": null
                  },
                  {
                    "name": "bid",
                    "type": ["null", "double"],
                    "doc": "The current bid price. If no bid price is available, this can be null.",
                    "default": null
                  },
                  {
                    "name": "last",
                    "type": ["null", "double"],
                    "doc": "The last traded price. If there hasn't been any recent trade, this can be null.",
                    "default": null
                  },
                  {
                    "name": "lastInSek",
                    "type": ["null", "double"],
                    "doc": "The last traded price in SEK. If there hasn't been any recent trade, this can be null.",
                    "default": null
                  }
                ]
              }
            }
          ]
        }
      }
    }
  ]
}
` 

    }