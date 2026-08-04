import { z } from 'zod'
import type { ApiClient } from './types.js'

export type InvoiceLine = {
  lineText: string
  amount: string
  productTypeXid: number
  lineNote?: string
  numberOfUnits?: string
  unitOfMeasureCode?: string
  priceEach?: string
  productXid?: number
}

export type CreateInvoiceInput = {
  companyXid: number
  customerXid: number
  date: string
  lines: InvoiceLine[]
  title?: string
  creditNote?: boolean
  offer?: boolean
  reverseCharge?: boolean
  linesHaveProductId?: boolean
  linesHaveNumberAndPriceEach?: boolean
}

const invoiceLineSchema = z.object({
  lineText: z.string().describe('Line description'),
  amount: z.string().describe('Line total amount (always required, even when priceEach × numberOfUnits covers it)'),
  productTypeXid: z.number().describe('Product type ID — use list_product_types to find. Note: productXid does not replace productTypeXid'),
  lineNote: z.string().optional().describe('Additional line note'),
  numberOfUnits: z.string().optional().describe('Number of units'),
  unitOfMeasureCode: z.string().optional().describe('Unit of measure code'),
  priceEach: z.string().optional().describe('Price per unit'),
  productXid: z.number().optional().describe('Product ID'),
})

export const createInvoiceOp = {
  name: 'create_invoice',
  description: 'Create a new invoice or credit note for a customer',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
    customerXid: z.number().describe('Customer ID'),
    date: z.string().describe('Invoice date in YYYY-MM-DD format'),
    lines: z.array(invoiceLineSchema).min(1).describe('Invoice lines — must be a non-empty array'),
    title: z.string().optional().describe('Invoice title'),
    creditNote: z.boolean().optional().describe('Create as credit note instead of invoice'),
    offer: z.boolean().optional().describe('Create as offer instead of invoice'),
    reverseCharge: z.boolean().optional().describe('Show reverse charge on the invoice'),
    linesHaveProductId: z.boolean().optional().describe('Show product ID column on invoice lines'),
    linesHaveNumberAndPriceEach: z.boolean().optional().describe('Show quantity and unit price columns on invoice lines'),
  },
  execute: async (input: CreateInvoiceInput, client: ApiClient) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new Error(`Invalid date format: ${input.date}. Expected YYYY-MM-DD.`)
    }
    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new Error('lines must be a non-empty array')
    }
    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i]
      if (!line.lineText) throw new Error(`Line ${i}: missing required field "lineText"`)
      if (!line.amount) throw new Error(`Line ${i}: missing required field "amount"`)
      if (!line.productTypeXid) throw new Error(`Line ${i}: missing required field "productTypeXid". Note: productXid does not replace productTypeXid`)
    }
    const { data, error } = await client.POST('/invoices', {
      body: {
        companyXid: input.companyXid,
        invoiceXid: 0,
        customerXid: input.customerXid,
        date: input.date,
        creditNote: input.creditNote ?? false,
        offer: input.offer ?? false,
        reverseCharge: input.reverseCharge ?? false,
        linesHaveProductId: input.linesHaveProductId ?? false,
        linesHaveNumberAndPriceEach: input.linesHaveNumberAndPriceEach ?? false,
        lines: input.lines.map((line, index) => ({
          lineNo: index,
          lineText: line.lineText,
          amount: line.amount,
          productTypeXid: line.productTypeXid,
          ...(line.lineNote && { lineNote: line.lineNote }),
          ...(line.numberOfUnits && { numberOfUnits: line.numberOfUnits }),
          ...(line.unitOfMeasureCode && { unitOfMeasureCode: line.unitOfMeasureCode }),
          ...(line.priceEach && { priceEach: line.priceEach }),
          ...(line.productXid && { productXid: line.productXid }),
        })),
        ...(input.title && { title: input.title }),
      },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return { xid: data.xid }
  },
}
