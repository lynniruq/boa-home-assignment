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
  origin: ['https://extensions.shopifycdn.com'],  // Allow requests only from this origin
  methods: ['GET', 'POST'], // Allow only specific methods if needed
  vary:'Origin',
  allowedHeaders: ['Content-Type', 'Authorization', 'Shopify-Storefront-Access-Token'],  // Shopify specific headers
};

// // Use CORS middleware
app.use(cors(corsOptions));


// Handle OPTIONS requests for all routes
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://extensions.shopifycdn.com');
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, shopify-storefront-access-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control','no-cache');
  res.status(204).end(); // No content for OPTIONS requests
});
app.use(express.json());

// Your existing routes
app.post('/apps/my-extension/api/save-cart', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://extensions.shopifycdn.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control','no-cache');
  res.json({ success: true, message: 'Cart saved successfully' });
});

const router = express.Router();

app.use(router);

// ✅ Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// ✅ All endpoints after this point require authentication
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
app.use((req,res,next)=>{
  console.log({req})
  next();
})
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);