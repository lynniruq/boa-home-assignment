import {
  reactExtension,
  Banner,
  BlockStack,
  useApi,
  ChoiceList,
  Choice,
  Checkbox,
  Button,
} from "@shopify/ui-extensions-react/checkout";
import { useCallback, useState } from "react";
import useSaveItems from "./hooks/useSaveItems";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

export default reactExtension("purchase.checkout.block.render", () => (
  <QueryClientProvider client={queryClient}>
  <Extension />
  </QueryClientProvider>
));

function Extension() {
  const { lines,buyerIdentity,shop,extension,sessionToken } = useApi(); // Get checkout lines
  const cartLines = lines.current || [];
  const [selected, setSelected] = useState<string[]>([]);
  const {mutate,isPending, isError, data,status } = useSaveItems();
  // const {buyerIdentity} = useApi();
  
  
  const handleSubmit = useCallback(async () => {
    const token = await sessionToken.get();
    console.log('sessionToken.get()', token);
    const userId = buyerIdentity?.email.current || 'guest';
    if (selected.length === 0) {
      alert("Please select at least one item.");
      return;
    }
  
    mutate({
      productIds: selected.length === 1 ? selected[0] : selected, 
      userId: userId,
      baseURL: new URL(extension.scriptUrl).origin,
      shop:shop.name,
      token:String(token),

    });
    console.log({selected,userId,status})
  },[selected]);

  const handleChange = (value: string | string[]) => {
    console.log("email",buyerIdentity?.email.current)
    const selectedValues = Array.isArray(value) ? value : [value];
    setSelected(selectedValues);
  };

  return (
    
    // <BlockStack border={"dotted"} padding={"tight"}>
    //   <Banner title="save-cart-for-later">Good luck with your assignment!</Banner>
    // </BlockStack>

    <BlockStack border="base" padding="extraLoose" spacing="loose" cornerRadius="base" background={'subdued'}>
      <Banner title="Save your cart" status="info"  ></Banner>
        <ChoiceList
          name="products"
          onChange={handleChange}
          value={selected}
        >
          {cartLines.map((line) => {
            const productTitle = 
              (line.merchandise as { product?: { title?: string } })?.product?.title || 
              line.merchandise?.title || 
              "No title";

            return (
              <Choice key={line.id} id={String(line.id)}>
                {productTitle}
              </Choice>
            );
          })}
        </ChoiceList>

        <Button kind="primary" onPress={handleSubmit}  
        disabled={isPending}
        >
         {isPending? "Saving..": "Save"}
        </Button>
            {isError &&<Banner status="critical">Failed to save cart</Banner>}
            {data?.success &&<Banner status="success"> {data.message}</Banner>}
    </BlockStack>



  );
}
