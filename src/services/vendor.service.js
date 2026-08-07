import { VendorsQuery } from '../db/queries/vendors.query.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export class VendorService {
  static async list() {
    return await VendorsQuery.findAll();
  }

  static async getById(id) {
    const vendor = await VendorsQuery.findById(id);
    if (!vendor) {
      throw createError(ERROR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return vendor;
  }

  static async create({ vendor_name, bank_account, status }) {
    const vendor = await VendorsQuery.create({ vendor_name, bank_account, status });
    console.log(`[VENDORS][create] vendor ${vendor.id} created (${vendor.vendor_name})`);
    return vendor;
  }

  static async update(id, data) {
    const existing = await VendorsQuery.findById(id);
    if (!existing) {
      throw createError(ERROR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updated = await VendorsQuery.update(id, data);
    console.log(`[VENDORS][update] vendor ${id} updated`);
    return updated;
  }
}
