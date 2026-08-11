import { z } from 'zod';
const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  phone: z.string().trim().min(5, "Phone number is too short").max(20, "Phone number is too long").optional(),
  merchantProfile: z.object({
    businessName: z.string().trim().min(1, "Business name is required").optional(),
    address: z.string().trim().min(1, "Address is required").optional(),
    phone: z.string().trim().min(5, "Phone number is too short").optional()
  }).optional()
});

try {
  updateProfileSchema.parse({ merchantProfile: { businessName: 'Malkudi', address: 'Kovilpatti', phone: '9345502563' } });
  console.log("SUCCESS");
} catch (e) {
  console.log(e.errors);
}
