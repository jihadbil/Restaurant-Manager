import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPrinters, useCreatePrinter, useUpdatePrinter, useDeletePrinter, useGetPrintStations, getGetPrintersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const printerSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
  printerName: z.string().min(1, "اسم الطابعة في النظام مطلوب").max(150),
  printerType: z.coerce.number(),
  printStationId: z.coerce.number().min(1, "محطة الطباعة مطلوبة"),
});

type PrinterFormValues = z.infer<typeof printerSchema>;

export default function Printers() {
  const { data: printers, isLoading } = useGetPrinters();
  const { data: stations } = useGetPrintStations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any | null>(null);

  const createMutation = useCreatePrinter();
  const updateMutation = useUpdatePrinter();
  const deleteMutation = useDeletePrinter();

  const form = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: { name: "", printerName: "", printerType: 0, printStationId: 0 },
  });

  const editForm = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: { name: "", printerName: "", printerType: 0, printStationId: 0 },
  });

  const handleCreate = (data: PrinterFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintersQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء الطابعة بنجاح" });
      },
      onError: () => toast({ title: "فشل إنشاء الطابعة", variant: "destructive" })
    });
  };

  const handleEdit = (data: PrinterFormValues) => {
    if (!editingPrinter) return;
    updateMutation.mutate({ id: editingPrinter.id, data: { id: editingPrinter.id, ...data } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintersQueryKey() });
        setEditingPrinter(null);
        toast({ title: "تم تحديث الطابعة بنجاح" });
      },
      onError: () => toast({ title: "فشل تحديث الطابعة", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الطابعة؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPrintersQueryKey() });
          toast({ title: "تم حذف الطابعة بنجاح" });
        },
        onError: () => toast({ title: "فشل حذف الطابعة", variant: "destructive" })
      });
    }
  };

  const openEditDialog = (printer: any) => {
    setEditingPrinter(printer);
    editForm.reset({ 
      name: printer.name || "", 
      printerName: printer.printerName || "",
      printerType: printer.printerType || 0,
      printStationId: printer.printStationId || 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">الطابعات</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ms-2 h-4 w-4" /> إضافة طابعة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء طابعة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم المعروض</FormLabel>
                    <FormControl><Input placeholder="مثل: محطة السخان 1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الطابعة في النظام / IP</FormLabel>
                    <FormControl><Input placeholder="مثل: \\Server\EpsonTM" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printerType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">وصل</SelectItem>
                        <SelectItem value="1">مطبخ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printStationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المحطة</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر المحطة" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stations?.map(s => <SelectItem key={s.id} value={s.id!.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
              <TableHead>الاسم المعروض</TableHead>
              <TableHead>الاسم في النظام</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>المحطة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">جارٍ تحميل الطابعات...</TableCell></TableRow>
            ) : printers?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد طابعات</TableCell></TableRow>
            ) : (
              printers?.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell className="font-medium">{printer.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{printer.printerName}</TableCell>
                  <TableCell>
                    {printer.printerType === 0 ? (
                      <Badge variant="outline">وصل</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">مطبخ</Badge>
                    )}
                  </TableCell>
                  <TableCell>{printer.printStationName || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(printer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(printer.id!)}>
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

      <Dialog open={!!editingPrinter} onOpenChange={(open) => !open && setEditingPrinter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الطابعة</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم المعروض</FormLabel>
                  <FormControl><Input placeholder="مثل: محطة السخان 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الطابعة في النظام / IP</FormLabel>
                  <FormControl><Input placeholder="مثل: \\Server\EpsonTM" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>النوع</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">وصل</SelectItem>
                      <SelectItem value="1">مطبخ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printStationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>المحطة</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر المحطة" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations?.map(s => <SelectItem key={s.id} value={s.id!.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
