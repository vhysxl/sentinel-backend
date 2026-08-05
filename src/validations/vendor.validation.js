import { z } from 'zod';

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: 'Vendor id must be a number' }).int().positive()
});

export const createVendorSchema = z.object({
  body: z.object({
    vendor_name: z
      .string({ required_error: 'Vendor name is required' })
      .trim()
      .min(1, 'Vendor name is required')
      .max(100, 'Vendor name must be at most 100 characters'),
    bank_account: z
      .string({ required_error: 'Bank account is required' })
      .trim()
      .min(1, 'Bank account is required')
      .max(50, 'Bank account must be at most 50 characters'),
    status: z.enum(['active', 'inactive']).optional()
  })
});

export const vendorIdSchema = z.object({
  params: idParam
});

export const updateVendorSchema = z.object({
  params: idParam,
  body: z.object({
    vendor_name: z.string().trim().min(1, 'Vendor name is required').max(100).optional(),
    bank_account: z.string().trim().min(1, 'Bank account is required').max(50).optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});
