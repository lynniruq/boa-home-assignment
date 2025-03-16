import { useSessionToken } from '@shopify/ui-extensions-react/checkout';
import { useMutation } from '@tanstack/react-query';

type SaveCartInput = {
  productIds: string | string[]; //Supports single or multiple IDs
  userId: string;
  baseURL: string;
  shop: string;
  token: string;
};

type SaveCartResponse = {
  success: boolean;
  message: string;
};

const useSaveItems = () => {
  return useMutation<SaveCartResponse, Error, SaveCartInput>({
    mutationFn: async ({ productIds, userId, baseURL, shop,token }) => {
      console.log({ baseURL, shop });
      try {
        const idsArray = Array.isArray(productIds) ? productIds : [productIds];
        const response = await fetch(`${baseURL}/apps/my-extension/api/save-cart?shop=${shop}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Shopify-Storefront-Access-Token': 
            // `Bearer ${
              token
            // }`
            ,
          },
          body: JSON.stringify({
            productIds: idsArray,
            userId,
          }),
          credentials:'include',
        });

        if (!response.ok) {
          throw new Error('Failed to save cart');
        }

        return response.json();
      } catch (error) {
        console.log('Network error', error);
        throw error;
      }
    },
  });
};


export default useSaveItems;