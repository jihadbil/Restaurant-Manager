import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetProducts, 
  useGetPaymentMethods, 
  useCreateOrder, 
  getGetOrdersQueryKey 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface OrderItemDraft {
  productId: number;
  quantity: number;
  unitSalePrice: number;
  unitCostPrice: number;
}

export default function OrderNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useGetProducts();
  const { data: paymentMethods } = useGetPaymentMethods();
  const createMutation = useCreateOrder();

  const [orderNumber, setOrderNumber] = useState<number>(Math.floor(Math.random() * 10000));
  const [orderType, setOrderType] = useState<string>("0");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<OrderItemDraft[]>([]);

  const handleAddItem = (productIdStr: string) => {
    const productId = parseInt(productIdStr, 10);
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existingItemIndex = items.findIndex(i => i.productId === productId);
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: product.id!,
          quantity: 1,
          unitSalePrice: product.salePrice || 0,
          unitCostPrice: product.costPrice || 0,
        }
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unitSalePrice * item.quantity), 0);
  const total = subtotal - discount;

  const handleSubmit = () => {
    if (!paymentMethodId) {
      toast({ title: "Please select a payment method", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        orderNumber,
        orderType: parseInt(orderType, 10),
        orderStatus: 0, // Pending
        paymentMethodId: parseInt(paymentMethodId, 10),
        userId: user?.id || "",
        notes: notes || null,
        discount: discount || 0,
        orderItems: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitSalePrice: item.unitSalePrice,
          unitCostPrice: item.unitCostPrice,
        }))
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        toast({ title: "Order created successfully" });
        setLocation("/orders");
      },
      onError: () => toast({ title: "Failed to create order", variant: "destructive" })
    });
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select onValueChange={handleAddItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id!.toString()}>{p.name} - {formatCurrency(p.salePrice || 0)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="rounded-md border mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const product = products?.find(p => p.id === item.productId);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{product?.name}</TableCell>
                            <TableCell>{formatCurrency(item.unitSalePrice)}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1" 
                                value={item.quantity} 
                                onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.unitSalePrice * item.quantity)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
                  No items added yet. Select a product above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order Number</Label>
                <Input 
                  type="number" 
                  value={orderNumber} 
                  onChange={(e) => setOrderNumber(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Dine In</SelectItem>
                    <SelectItem value="1">Takeout</SelectItem>
                    <SelectItem value="2">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map(pm => (
                      <SelectItem key={pm.id} value={pm.id!.toString()}>{pm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Kitchen notes, customer requests..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount</span>
                <div className="w-24">
                  <Input 
                    type="number" 
                    min="0" 
                    value={discount} 
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 text-right"
                  />
                </div>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubmit}
                disabled={createMutation.isPending || items.length === 0 || !paymentMethodId}
              >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Complete Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
