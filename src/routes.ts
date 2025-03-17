import express, { Request, Response } from 'express';
import { prisma } from './libs/prisma/index.ts';

const router = express.Router();

/**
 * POST /api/save-cart
 *
 * Saves the user's selected cart items to the database.
 *
 * @param {string | string[]} productIds - The IDs of the products to save.
 * @param {string} userId - The ID of the user saving the cart.
 * @param {string} shop - The Shopify store domain (for validation only).
 * @returns {object} - The saved cart data.
 *
 * Example:
 * POST /api/save-cart?shop=my-store.myshopify.com
 * {
 *   "productIds": ["12345", "67890"],
 *   "userId": "user_1"
 * }
 */
router.post(
  '/api/my-extension/save-cart',
  async (
    req: Request<
      {}, 
      {}, 
      { productIds: string | string[]; userId: string }, 
      { shop?: string }
    >,
    res: Response
  ): Promise<void> => {
    console.log('✅ API route hit. Request body:', req.body);
    console.log('✅ Query params:', req.query);

    try {
      const { productIds, userId } = req.body;
      const shop = req.query.shop;

      // ✅ Validate input and `shop`
      if (!productIds || !userId || !shop) {
        console.error('❌ Missing productIds, userId, or shop');
        res.status(400).json({ error: 'Invalid request data (missing productIds, userId, or shop)' });
        return;
      }

      if (!shop.endsWith('.myshopify.com')) {
        console.error('❌ Invalid shop domain:', shop);
        res.status(400).json({ error: 'Invalid shop domain' });
        return;
      }

      const idsArray = Array.isArray(productIds) ? productIds : [productIds];

      // ✅ Save to database (WITHOUT saving shop)
      const savedCart = await prisma.itemsSaved.createMany({
        data: idsArray.map((productId) => ({
          productId,
          userId,
        })),
        skipDuplicates: true, // ✅ Avoid duplicate entries
      });

      console.log('✅ Saved Cart:', savedCart);

      res.json({
        success: true,
        message: `Cart saved successfully for shop: ${shop}`, // ✅ Mention shop in response only
        savedCart,
      });
    } catch (error) {
      console.error('❌ Error saving cart:', error);
      res.status(500).json({ error: 'Failed to save cart' });
    }
  }
);

export default router;