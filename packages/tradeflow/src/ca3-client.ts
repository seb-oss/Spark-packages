import { TypedClient } from '@sebspark/openapi-client'
import type { CaClient } from './generated/ca3'

export interface Ca3ClientConfig {
  url: string
}

export class Ca3Client {
  private readonly client: CaClient

  constructor({ url }: Ca3ClientConfig) {
    this.client = TypedClient<CaClient>(url)
  }

  async getAccountNumbers(jwt: string) {
    const { data } = await this.client.get('/Private/Get', {
      headers: { 'jwt-assertion': jwt },
      query: {
        exclude_cash_accounts: true,
        exclude_investment_amount_currency: true,
        filter_function_type: ['ViewSecurityOrder'],
      },
    })
    const accounts = data.accounts || []
    const accountNumbers = accounts
      .map((acc) => acc.account_identifier?.identifier)
      .filter(Boolean) as string[]
    return accountNumbers
  }
}
