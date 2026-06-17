import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetOrderById, useUpdateOrder, getGetOrderByIdQueryKey, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, FileText, CheckCircle2, Clock, XCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { printReceipt } from "@/lib/print-receipt";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = parseInt(params?.id || "0", 10);
  
  const { data: order, isLoading } = useGetOrderById(id, { query: { enabled: !!id, queryKey: getGetOrderByIdQueryKey(id) } });
  const updateMutation = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  };

  const getStatusBadge = (status?: number | null) => {
    switch (status) {
      case 0: return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">معلّق</Badge>;
      case 1: return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">جارٍ</Badge>;
      case 2: return <Badge className="bg-green-500 hover:bg-green-600 text-white">مكتمل</Badge>;
      case 3: return <Badge className="bg-red-500 hover:bg-red-600 text-white">ملغى</Badge>;
      default: return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getTypeBadge = (type?: number | null) => {
    switch (type) {
      case 0: return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">داخل المطعم</Badge>;
      case 1: return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">للخارج</Badge>;
      case 2: return <Badge className="bg-teal-500 hover:bg-teal-600 text-white">توصيل</Badge>;
      default: return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const updateStatus = (status: number) => {
    if (!order) return;
    updateMutation.mutate({
      id,
      data: {
        id,
        paymentMethodId: order.paymentMethodId!,
        orderStatus: status
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderByIdQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        toast({ title: "تم تحديث حالة الطلب" });
      },
      onError: () => toast({ title: "فشل تحديث حالة الطلب", variant: "destructive" })
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="text-center p-8 text-muted-foreground">الطلب غير موجود</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/orders">
            <Button variant="outline" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">طلب #{order.orderNumber}</h1>
          {getStatusBadge(order.orderStatus)}
          {getTypeBadge(order.orderType)}
        </div>
        
        <div className="flex space-x-2">
          {order.orderStatus === 0 && (
            <Button variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => updateStatus(1)}>
              <Clock className="ms-2 h-4 w-4" /> بدء التحضير
            </Button>
          )}
          {(order.orderStatus === 0 || order.orderStatus === 1) && (
            <Button variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(2)}>
              <CheckCircle2 className="ms-2 h-4 w-4" /> اكتمل
            </Button>
          )}
          {order.orderStatus !== 3 && order.orderStatus !== 2 && (
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatus(3)}>
              <XCircle className="ms-2 h-4 w-4" /> إلغاء
            </Button>
          )}
          <Button variant="outline" onClick={() => printReceipt(order, 'customer')}>
            <FileText className="ms-2 h-4 w-4" /> وصل العميل
          </Button>
          <Button variant="outline" onClick={() => printReceipt(order, 'kitchen')}>
            <Printer className="ms-2 h-4 w-4" /> تذكرة المطبخ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>عناصر الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productName}
                        {item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitSalePrice || 0)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {(!order.orderItems || order.orderItems.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center py-4">لم تتم إضافة عناصر بعد. اختر منتجاً أعلاه.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">التاريخ</span>
                <span>{order.date ? format(new Date(order.date), "MMM d, yyyy h:mm a") : "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">أمين الصندوق</span>
                <span>{order.userName || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">طريقة الدفع</span>
                <span>{order.paymentMethodName || "-"}</span>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الجزئي</span>
                  <span>{formatCurrency((order.total || 0) + (order.discount || 0))}</span>
                </div>
                {order.discount! > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>الخصم</span>
                    <span>-{formatCurrency(order.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(order.total || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
