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
  name: z.string().min(1, "Name is required").max(100),
  printerName: z.string().min(1, "System printer name is required").max(150),
  printerType: z.coerce.number(),
  printStationId: z.coerce.number().min(1, "Print station is required"),
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
        toast({ title: "Printer created successfully" });
      },
      onError: () => toast({ title: "Failed to create printer", variant: "destructive" })
    });
  };

  const handleEdit = (data: PrinterFormValues) => {
    if (!editingPrinter) return;
    updateMutation.mutate({ id: editingPrinter.id, data: { id: editingPrinter.id, ...data } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintersQueryKey() });
        setEditingPrinter(null);
        toast({ title: "Printer updated successfully" });
      },
      onError: () => toast({ title: "Failed to update printer", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this printer?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPrintersQueryKey() });
          toast({ title: "Printer deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete printer", variant: "destructive" })
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
        <h1 className="text-3xl font-bold tracking-tight">Printers</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Printer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Printer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friendly Name</FormLabel>
                    <FormControl><Input placeholder="E.g. Hot Station 1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Printer Name / IP</FormLabel>
                    <FormControl><Input placeholder="E.g. \\Server\EpsonTM" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printerType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Receipt</SelectItem>
                        <SelectItem value="1">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="printStationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select station" /></SelectTrigger>
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
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
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
              <TableHead>Name</TableHead>
              <TableHead>System Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Station</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading printers...</TableCell></TableRow>
            ) : printers?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No printers found</TableCell></TableRow>
            ) : (
              printers?.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell className="font-medium">{printer.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{printer.printerName}</TableCell>
                  <TableCell>
                    {printer.printerType === 0 ? (
                      <Badge variant="outline">Receipt</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Kitchen</Badge>
                    )}
                  </TableCell>
                  <TableCell>{printer.printStationName || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
            <DialogTitle>Edit Printer</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Friendly Name</FormLabel>
                  <FormControl><Input placeholder="E.g. Hot Station 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>System Printer Name / IP</FormLabel>
                  <FormControl><Input placeholder="E.g. \\Server\EpsonTM" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Receipt</SelectItem>
                      <SelectItem value="1">Kitchen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="printStationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Station</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select station" /></SelectTrigger>
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
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
