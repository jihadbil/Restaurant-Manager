import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod, getGetPaymentMethodsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const paymentMethodSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(50),
  isTaxFree: z.boolean().default(false),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export default function PaymentMethods() {
  const { data: methods, isLoading } = useGetPaymentMethods();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<{id: number, name: string, isTaxFree: boolean} | null>(null);

  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { name: "", isTaxFree: false },
  });

  const editForm = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { name: "", isTaxFree: false },
  });

  const handleCreate = (data: PaymentMethodFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPaymentMethodsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء طريقة الدفع بنجاح" });
      },
      onError: () => toast({ title: "فشل إنشاء طريقة الدفع", variant: "destructive" })
    });
  };

  const handleEdit = (data: PaymentMethodFormValues) => {
    if (!editingMethod) return;
    updateMutation.mutate({ id: editingMethod.id, data: { id: editingMethod.id, ...data } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPaymentMethodsQueryKey() });
        setEditingMethod(null);
        toast({ title: "تم تحديث طريقة الدفع بنجاح" });
      },
      onError: () => toast({ title: "فشل تحديث طريقة الدفع", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف طريقة الدفع هذه؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPaymentMethodsQueryKey() });
          toast({ title: "تم حذف طريقة الدفع بنجاح" });
        },
        onError: () => toast({ title: "فشل حذف طريقة الدفع", variant: "destructive" })
      });
    }
  };

  const openEditDialog = (method: any) => {
    setEditingMethod({ id: method.id, name: method.name || "", isTaxFree: method.isTaxFree || false });
    editForm.reset({ name: method.name || "", isTaxFree: method.isTaxFree || false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">طرق الدفع</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ms-2 h-4 w-4" /> إضافة طريقة دفع</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء طريقة دفع جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input placeholder="مثل: نقدي، بطاقة ائتمان" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isTaxFree" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none ps-3">
                      <FormLabel>معفى من الضريبة</FormLabel>
                      <FormDescription>الطلبات التي تستخدم طريقة الدفع هذه لن يُطبَّق عليها ضريبة.</FormDescription>
                    </div>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                    إنشاء
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم</TableHead>
              <TableHead className="w-full">الاسم</TableHead>
              <TableHead>الخصائص</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">جارٍ تحميل طرق الدفع...</TableCell></TableRow>
            ) : methods?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد طرق دفع</TableCell></TableRow>
            ) : (
              methods?.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>{method.id}</TableCell>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                    {method.isTaxFree && <Badge variant="secondary">معفى من الضريبة</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(method)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(method.id!)}>
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

      <Dialog open={!!editingMethod} onOpenChange={(open) => !open && setEditingMethod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل طريقة الدفع</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl><Input placeholder="اسم طريقة الدفع" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="isTaxFree" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none ps-3">
                    <FormLabel>معفى من الضريبة</FormLabel>
                    <FormDescription>الطلبات التي تستخدم طريقة الدفع هذه لن يُطبَّق عليها ضريبة.</FormDescription>
                  </div>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
