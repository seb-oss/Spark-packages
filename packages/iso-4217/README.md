# `@sebspark/iso-4217`

ISO-4217 currency codes.

## Updating

The currency list is fetched weekly from [SIX Group](https://www.six-group.com/en/products-services/financial-information/data-standards.html), the ISO 4217 maintenance agency, by the `ISO` workflow, which releases a new minor version when it changes. To update manually:

```
curl -fsSL -o src/lib/specifications/iso4217.xml https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
npm run generate
```
