import { join } from "path";
import express from "express";
import { readFileSync } from "fs";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import shopify from "./shopify.js";
import { prisma } from './libs/prisma/index.ts';
import cors from "cors" ;

dotenv.config();

const backendPort = process.env.BACKEND_PORT as string;
const envPort = process.env.PORT as string;
const PORT = parseInt(backendPort || envPort, 10);

const app = express();

const corsOptions = {
  origin: ['https://extensions.shopifycdn.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Shopify-Storefront-Access-Token'],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://extensions.shopifycdn.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Shopify-Storefront-Access-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(204).end();
});

app.use(express.json());

const router = express.Router();

router.post('/api/my-extension/save-cart', async (req, res) => {
  console.log('✅ API route hit. Request body:', req.body);
  console.log('✅ Query params:', req.query);

  try {
    const { productIds, userId } = req.body;
    const shop = req.query.shop;

    if (!productIds || !userId || !shop) {
      console.error('❌ Missing productIds, userId, or shop');
      res.status(400).json({ error: 'Invalid request data' });
      return;
    }

    if (!shop.endsWith('.myshopify.com')) {
      console.error('❌ Invalid shop domain:', shop);
      res.status(400).json({ error: 'Invalid shop domain' });
      return;
    }

    const idsArray = Array.isArray(productIds) ? productIds : [productIds];

    const savedCart = await prisma.itemsSaved.createMany({
      data: idsArray.map((productId) => ({ productId, userId })),
      skipDuplicates: true,
    });

    console.log('✅ Saved Cart:', savedCart);

    res.json({
      success: true,
      message: `Cart saved successfully for shop: ${shop}`,
      savedCart,
    });
  } catch (error) {
    console.error('❌ Error saving cart:', error);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

app.use(router);

// Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), shopify.redirectToShopifyOrAppRoot());

app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers: {} }));

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(serveStatic(`${process.cwd()}/frontend/`, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  const htmlContent = readFileSync(
    join(`${process.cwd()}/frontend/`, "index.html"),
    "utf-8"
  );
  const transformedHtml = htmlContent.replace(
    /%SHOPIFY_API_KEY%/g,
    process.env.SHOPIFY_API_KEY || ""
  );

  res.status(200).set("Content-Type", "text/html").send(transformedHtml);
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);