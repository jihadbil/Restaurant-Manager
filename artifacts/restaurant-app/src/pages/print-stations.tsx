import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPrintStations, useCreatePrintStation, useUpdatePrintStation, useDeletePrintStation, getGetPrintStationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const printStationSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
});

type PrintStationFormValues = z.infer<typeof printStationSchema>;

export default function PrintStations() {
  const { data: stations, isLoading } = useGetPrintStations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<{id: number, name: string} | null>(null);

  const createMutation = useCreatePrintStation();
  const updateMutation = useUpdatePrintStation();
  const deleteMutation = useDeletePrintStation();

  const form = useForm<PrintStationFormValues>({
    resolver: zodResolver(printStationSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<PrintStationFormValues>({
    resolver: zodResolver(printStationSchema),
    defaultValues: { name: "" },
  });

  const handleCreate = (data: PrintStationFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintStationsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء محطة الطباعة بنجاح" });
      },
      onError: () => toast({ title: "فشل إنشاء محطة الطباعة", variant: "destructive" })
    });
  };

  const handleEdit = (data: PrintStationFormValues) => {
    if (!editingStation) return;
    updateMutation.mutate({ id: editingStation.id, data: { id: editingStation.id, name: data.name } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintStationsQueryKey() });
        setEditingStation(null);
        toast({ title: "تم تحديث محطة الطباعة بنجاح" });
      },
      onError: () => toast({ title: "فشل تحديث محطة الطباعة", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف محطة الطباعة هذه؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPrintStationsQueryKey() });
          toast({ title: "تم حذف محطة الطباعة بنجاح" });
        },
        onError: () => toast({ title: "فشل حذف محطة الطباعة", variant: "destructive" })
      });
    }
  };

  const openEditDialog = (station: {id: number, name: string}) => {
    setEditingStation(station);
    editForm.reset({ name: station.name });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">محطات الطباعة</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ms-2 h-4 w-4" /> إضافة محطة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء محطة طباعة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input placeholder="مثل: المطبخ، البار، الاستقبال" {...field} /></FormControl>
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
              <TableHead>الرقم</TableHead>
              <TableHead className="w-full">الاسم</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">جارٍ تحميل المحطات...</TableCell></TableRow>
            ) : stations?.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">لا توجد محطات طباعة</TableCell></TableRow>
            ) : (
              stations?.map((station) => (
                <TableRow key={station.id}>
                  <TableCell>{station.id}</TableCell>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog({id: station.id!, name: station.name || ""})}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(station.id!)}>
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

      <Dialog open={!!editingStation} onOpenChange={(open) => !open && setEditingStation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل محطة الطباعة</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl><Input placeholder="اسم المحطة" {...field} /></FormControl>
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
