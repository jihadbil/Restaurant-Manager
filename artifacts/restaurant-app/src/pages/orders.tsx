import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetOrders, useDeleteOrder, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Orders() {
  const { data: orders, isLoading } = useGetOrders();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useDeleteOrder();

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          toast({ title: "تم حذف الطلب بنجاح" });
        },
        onError: () => toast({ title: "فشل حذف الطلب", variant: "destructive" })
      });
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
        <Link href="/orders/new">
          <Button><Plus className="ms-2 h-4 w-4" /> إنشاء طلب</Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>طلب #</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الدفع</TableHead>
              <TableHead className="text-right">الإجمالي</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ تحميل الطلبات...</TableCell></TableRow>
            ) : orders?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>{order.date ? format(new Date(order.date), "MMM d, yyyy h:mm a") : "-"}</TableCell>
                  <TableCell>{getTypeBadge(order.orderType)}</TableCell>
                  <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                  <TableCell>{order.paymentMethodName || "-"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.total || 0)}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(order.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
