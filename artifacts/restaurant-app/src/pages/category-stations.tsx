import { useGetCategories, useGetPrintStations, useLinkCategoryPrintStation, useUnlinkCategoryPrintStation, useGetPrintStationsByCategory, getGetPrintStationsByCategoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Subcomponent for each category's station mapping
function CategoryStationRow({ category, stations }: { category: any, stations: any[] }) {
  const { data: linkedStations, isLoading } = useGetPrintStationsByCategory(category.id, {
    query: { enabled: !!category.id, queryKey: getGetPrintStationsByCategoryQueryKey(category.id) }
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const linkMutation = useLinkCategoryPrintStation();
  const unlinkMutation = useUnlinkCategoryPrintStation();

  const [selectedStationId, setSelectedStationId] = useState<string>("");

  const handleLink = () => {
    if (!selectedStationId) return;
    linkMutation.mutate({ data: { categoryId: category.id, printStationId: parseInt(selectedStationId, 10) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintStationsByCategoryQueryKey(category.id) });
        setSelectedStationId("");
        toast({ title: "تم الربط بنجاح" });
      },
      onError: () => toast({ title: "فشل الربط", variant: "destructive" })
    });
  };

  const handleUnlink = (stationId: number) => {
    unlinkMutation.mutate({ categoryId: category.id, printStationId: stationId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPrintStationsByCategoryQueryKey(category.id) });
        toast({ title: "تم إلغاء الربط بنجاح" });
      },
      onError: () => toast({ title: "فشل إلغاء الربط", variant: "destructive" })
    });
  };

  // Filter out already linked stations from the dropdown
  const availableStations = stations.filter(s => !(linkedStations?.some((ls: any) => ls.id === s.id)));

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md bg-card space-y-4 md:space-y-0">
      <div className="w-1/3">
        <div className="font-semibold text-lg">{category.name}</div>
      </div>
      
      <div className="w-1/3 flex flex-wrap gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : linkedStations?.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">لا توجد محطات</span>
        ) : (
          linkedStations?.map((station: any) => (
            <Badge key={station.id} variant="secondary" className="flex items-center gap-1 py-1">
              {station.name}
              <Trash2 
                className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive me-1" 
                onClick={() => handleUnlink(station.id)}
              />
            </Badge>
          ))
        )}
      </div>

      <div className="w-1/3 flex justify-end items-center gap-2">
        <Select value={selectedStationId} onValueChange={setSelectedStationId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="إضافة إلى محطة..." />
          </SelectTrigger>
          <SelectContent>
            {availableStations.map(s => (
              <SelectItem key={s.id} value={s.id!.toString()}>{s.name}</SelectItem>
            ))}
            {availableStations.length === 0 && (
              <SelectItem value="none" disabled>جميعها مرتبطة</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={handleLink} 
          disabled={!selectedStationId || selectedStationId === "none" || linkMutation.isPending}
        >
          {linkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function CategoryStations() {
  const { data: categories, isLoading: loadingCats } = useGetCategories();
  const { data: stations, isLoading: loadingStations } = useGetPrintStations();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">توجيه الفئات</h1>
        <p className="text-muted-foreground mt-2">
          اربط فئات المنتجات بمحطات الطباعة (مثل إرسال 'المشروبات' إلى طابعة 'البار').
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قواعد التوجيه</CardTitle>
          <CardDescription>
            عند إرسال الطلب للمطبخ، تُطبع العناصر في كل المحطات المرتبطة بفئتها.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(loadingCats || loadingStations) ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد فئات. أنشئ فئات أولاً.</div>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:flex justify-between px-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="w-1/3">الفئة</div>
                <div className="w-1/3">المحطات المرتبطة</div>
                <div className="w-1/3 text-right">إضافة توجيه</div>
              </div>
              {categories?.map(category => (
                <CategoryStationRow 
                  key={category.id} 
                  category={category} 
                  stations={stations || []} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
