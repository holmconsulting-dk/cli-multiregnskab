import type { ApiClient, RegistrableOperation } from './types.js'
import { listCompaniesOp } from './companies.js'
import { listCustomersOp, createCustomerOp } from './customers.js'
import { listBankAccountsOp, getBankBalancesOp, getBankPostingsOp } from './bank.js'
import { listProductsOp, listProductTypesOp, listUnitsOfMeasureOp } from './products.js'
import { createInvoiceOp } from './invoices.js'

const allOps = [
  listCompaniesOp,
  listCustomersOp,
  createCustomerOp,
  listBankAccountsOp,
  getBankBalancesOp,
  getBankPostingsOp,
  listProductsOp,
  listProductTypesOp,
  listUnitsOfMeasureOp,
  createInvoiceOp,
]

export function createOperations(client: ApiClient): RegistrableOperation[] {
  return allOps.map((op) => ({
    name: op.name,
    description: op.description,
    inputSchema: op.inputSchema as RegistrableOperation['inputSchema'],
    execute: (input: Record<string, unknown>) => op.execute(input as never, client),
  }))
}

export { listCompaniesOp } from './companies.js'
export { listCustomersOp, createCustomerOp } from './customers.js'
export type { CreateCustomerInput } from './customers.js'
export { listBankAccountsOp, getBankBalancesOp, getBankPostingsOp } from './bank.js'
export { listProductsOp, listProductTypesOp, listUnitsOfMeasureOp } from './products.js'
export { createInvoiceOp } from './invoices.js'
export type { CreateInvoiceInput, InvoiceLine } from './invoices.js'
export type { ApiClient, RegistrableOperation } from './types.js'
