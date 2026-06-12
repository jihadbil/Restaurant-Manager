import { useState, useMemo } from "react";
import {
  useGetProducts,
  useGetCategories,
  useGetPaymentMethods,
  useCreateOrder,
  getGetOrdersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Minus, Trash2, ShoppingCart, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CartItem = {
  productId: number;
  name: string;
  unitSalePrice: number;
  unitCostPrice: number;
  quantity: number;
  unitDiscount: number;
};

export default function PosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: categories = [] } = useGetCategories();
  const { data: paymentMethods = [] } = useGetPaymentMethods();
  const createOrder = useCreateOrder();

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState("1001");
  const [orderType, setOrderType] = useState("DineIn");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [globalDiscount, setGlobalDiscount] = useState<string>("0");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.categoryId?.toString() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitSalePrice: product.salePrice || 0,
          unitCostPrice: product.costPrice || 0,
          quantity: 1,
          unitDiscount: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitSalePrice * item.quantity, 0);
  const discountAmount = parseFloat(globalDiscount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!paymentMethodId) {
      toast({ title: "Select a payment method", variant: "destructive" });
      return;
    }

    const userData = localStorage.getItem("restaurant_user");
    let userId = "";
    if (userData) {
      try {
        userId = JSON.parse(userData).id;
      } catch (e) {}
    }

    createOrder.mutate(
      {
        data: {
          orderNumber: parseInt(orderNumber, 10),
          paymentMethodId: parseInt(paymentMethodId, 10),
          userId,
          orderType: orderType === "DineIn" ? 0 : orderType === "Takeout" ? 1 : 2,
          discount: discountAmount,
          orderItems: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitSalePrice: item.unitSalePrice,
            unitCostPrice: item.unitCostPrice,
            unitDiscount: item.unitDiscount,
          })),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Order placed successfully!" });
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          setCart([]);
          setOrderNumber((prev) => (parseInt(prev, 10) + 1).toString());
        },
        onError: () => {
          toast({ title: "Failed to place order", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] -m-6 md:-m-8 bg-background">
      {/* LEFT PANEL */}
      <div className="w-[60%] flex flex-col border-r bg-muted/20">
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-2">
              <Button
                variant={activeCategory === "All" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveCategory("All")}
              >
                All
              </Button>
              {categories.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id?.toString() ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setActiveCategory(cat.id?.toString())}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: any) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col group"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-muted-foreground opacity-20">
                      {product.name?.charAt(0)}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardContent className="p-3 flex flex-col flex-1 justify-between">
                  <div className="font-medium text-sm line-clamp-2 mb-1">{product.name}</div>
                  <div className="font-bold text-primary">${product.salePrice?.toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-20" />
              <p>No products found</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[40%] flex flex-col bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> Current Order
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-muted-foreground h-8">
            Clear
          </Button>
        </div>

        <div className="p-4 border-b space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Order No.</Label>
              <Input 
                value={orderNumber} 
                onChange={(e) => setOrderNumber(e.target.value)} 
                className="h-9"
              />
            </div>
            <div className="flex-[2] space-y-1">
              <Label className="text-xs">Type</Label>
              <div className="flex bg-muted rounded-md p-1">
                {["DineIn", "Takeout", "Delivery"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${
                      orderType === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:bg-background/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-10" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex flex-col border rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm line-clamp-1 pr-2">{item.name}</span>
                    <span className="font-bold text-sm whitespace-nowrap">
                      ${(item.unitSalePrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="text-sm text-muted-foreground">
                      ${item.unitSalePrice.toFixed(2)} each
                    </div>
                    <div className="flex items-center space-x-2 bg-muted/50 rounded-md">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1"></div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/10 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  value={globalDiscount} 
                  onChange={(e) => setGlobalDiscount(e.target.value)}
                  className="h-7 w-16 text-right px-2"
                />
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm: any) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              className="w-full h-14 text-lg" 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || createOrder.isPending}
            >
              {createOrder.isPending ? "Processing..." : (
                <>
                  <Check className="mr-2 h-5 w-5" /> Place Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
