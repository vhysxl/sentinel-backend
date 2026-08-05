import { db } from '../db/client.js';
import { vendors } from '../db/schema/vendors.js';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const createVendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').max(100),
  bank_account: z.string().min(1, 'Bank account is required').max(50),
  status: z.enum(['active', 'inactive']).optional()
});

const updateVendorSchema = z.object({
  vendor_name: z.string().min(1).max(100).optional(),
  bank_account: z.string().min(1).max(50).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const createVendor = async (req, res) => {
  try {
    const parseResult = createVendorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: parseResult.error.errors
      });
    }

    const data = parseResult.data;

    const [vendor] = await db.insert(vendors).values({
      vendor_name: data.vendor_name,
      bank_account: data.bank_account,
      status: data.status || 'active'
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('createVendor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getVendors = async (req, res) => {
  try {
    const results = await db
      .select()
      .from(vendors)
      .orderBy(desc(vendors.join_date));

    res.status(200).json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: {
        vendors: results
      }
    });
  } catch (error) {
    console.error('getVendors error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, Number(id)))
      .limit(1);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor retrieved successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('getVendorById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(vendors).where(eq(vendors.id, Number(id))).limit(1);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const parseResult = updateVendorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: parseResult.error.errors
      });
    }

    const data = parseResult.data;
    const updateData = {};
    if (data.vendor_name) updateData.vendor_name = data.vendor_name;
    if (data.bank_account) updateData.bank_account = data.bank_account;
    if (data.status) updateData.status = data.status;

    const [updated] = await db
      .update(vendors)
      .set(updateData)
      .where(eq(vendors.id, Number(id)))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: { vendor: updated }
    });
  } catch (error) {
    console.error('updateVendor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
