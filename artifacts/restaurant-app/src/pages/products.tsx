import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useGetCategories, getGetProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(150),
  categoryId: z.coerce.number().min(1, "الفئة مطلوبة"),
  costPrice: z.coerce.number().min(0.01, "سعر التكلفة يجب أن يكون أكبر من 0"),
  salePrice: z.coerce.number().min(0.01, "سعر البيع يجب أن يكون أكبر من 0"),
  barCode: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Products() {
  const { data: products, isLoading } = useGetProducts();
  const { data: categories } = useGetCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", categoryId: 0, costPrice: 0, salePrice: 0, barCode: "", description: "", imageUrl: "" },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", categoryId: 0, costPrice: 0, salePrice: 0, barCode: "", description: "", imageUrl: "" },
  });

  const handleCreate = (data: ProductFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء المنتج بنجاح" });
      },
      onError: () => toast({ title: "فشلت العملية على المنتج", variant: "destructive" })
    });
  };

  const handleEdit = (data: ProductFormValues) => {
    if (!editingProduct) return;
    updateMutation.mutate({ id: editingProduct.id, data: { id: editingProduct.id, ...data } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        setEditingProduct(null);
        toast({ title: "تم تحديث المنتج بنجاح" });
      },
      onError: () => toast({ title: "فشلت العملية على المنتج", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          toast({ title: "تم حذف المنتج بنجاح" });
        },
        onError: () => toast({ title: "فشلت العملية على المنتج", variant: "destructive" })
      });
    }
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    editForm.reset({ 
      name: product.name || "", 
      categoryId: product.categoryId || 0,
      costPrice: product.costPrice || 0,
      salePrice: product.salePrice || 0,
      barCode: product.barCode || "",
      description: product.description || "",
      imageUrl: product.imageUrl || ""
    });
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">المنتجات</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ms-2 h-4 w-4" /> إضافة منتج</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء منتج جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl><Input placeholder="اسم المنتج" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(c => <SelectItem key={c.id} value={c.id!.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="salePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر البيع</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="costPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر التكلفة</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="barCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الباركود / الرمز (اختياري)</FormLabel>
                      <FormControl><Input placeholder="SKU" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الصورة (اختياري)</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>الوصف (اختياري)</FormLabel>
                      <FormControl><Textarea placeholder="التفاصيل..." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
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
              <TableHead className="w-16">الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead className="text-right">التكلفة</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">جارٍ تحميل المنتجات...</TableCell></TableRow>
            ) : products?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد منتجات</TableCell></TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}
                    {product.barCode && <div className="text-xs text-muted-foreground font-mono">{product.barCode}</div>}
                  </TableCell>
                  <TableCell>{product.categoryName || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.costPrice || 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(product.salePrice || 0)}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(product.id!)}>
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

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input placeholder="اسم المنتج" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id!.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="salePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="costPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر التكلفة</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="barCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الباركود / الرمز (اختياري)</FormLabel>
                    <FormControl><Input placeholder="SKU" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الصورة (اختياري)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl><Textarea placeholder="التفاصيل..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
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
