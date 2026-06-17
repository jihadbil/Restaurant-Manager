import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  useGetComprehensiveReport,
  useGetBestSellingProducts,
  useGetBestSellingCategories,
  useGetDailySales,
  useGetPaymentMethodsReport,
  useGetCancelledOrders,
} from "@workspace/api-client-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function Reports() {
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [endDateStr, setEndDateStr] = useState<string>("");

  const [activeParams, setActiveParams] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const handleApply = () => {
    setActiveParams({
      startDate: startDateStr ? new Date(startDateStr).toISOString() : undefined,
      endDate: endDateStr ? new Date(endDateStr).toISOString() : undefined,
    });
  };

  const handleThisMonth = () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    setStartDateStr(format(start, "yyyy-MM-dd"));
    setEndDateStr(format(end, "yyyy-MM-dd"));
    
    setActiveParams({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  const { data: compReport, isLoading: isCompLoading } = useGetComprehensiveReport(activeParams);
  const { data: dailySales, isLoading: isDailyLoading } = useGetDailySales(activeParams);
  const { data: products, isLoading: isProductsLoading } = useGetBestSellingProducts(activeParams);
  const { data: categories, isLoading: isCategoriesLoading } = useGetBestSellingCategories(activeParams);
  const { data: paymentMethods, isLoading: isPaymentMethodsLoading } = useGetPaymentMethodsReport(activeParams);
  const { data: cancelledOrders, isLoading: isCancelledLoading } = useGetCancelledOrders(activeParams);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const COLORS = ["#f59e0b", "#78716c", "#22c55e", "#ef4444", "#3b82f6", "#8b5cf6", "#d946ef"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-3xl font-bold tracking-tight">التقارير والإحصائيات</h1>
        
        <div className="flex items-end gap-2 bg-card p-3 rounded-lg border">
          <div className="space-y-1">
            <Label>تاريخ البداية</Label>
            <Input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>تاريخ النهاية</Label>
            <Input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} />
          </div>
          <Button onClick={handleApply}>تطبيق</Button>
          <Button variant="outline" onClick={handleThisMonth}>هذا الشهر</Button>
        </div>
      </div>

      {isCompLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : compReport ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">إجمالي الإيرادات</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(compReport.totalSales || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">إجمالي الأرباح</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(compReport.totalProfit || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">إجمالي التكاليف</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(compReport.totalCost || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">إجمالي الطلبات</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatNumber(compReport.totalOrdersCount || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">متوسط قيمة الطلب</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(compReport.averageOrderValue || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">الطلبات الملغاة</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatNumber(compReport.cancelledOrdersCount || 0)}</div></CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="payment">طرق الدفع</TabsTrigger>
          <TabsTrigger value="cancelled">الطلبات الملغاة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>المبيعات اليومية</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {isDailyLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : dailySales && dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySales.map(d => ({ ...d, formattedDate: format(new Date(d.date || ""), "MMM d") }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="totalSales" name="المبيعات" stroke="#f59e0b" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="totalProfit" name="الأرباح" stroke="#22c55e" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>توزيع حالات الطلبات</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {compReport?.orderStatusSummary && compReport.orderStatusSummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={compReport.orderStatusSummary} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={(entry) => entry.status}>
                        {compReport.orderStatusSummary.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>توزيع أنواع الطلبات</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {compReport?.orderTypeSummary && compReport.orderTypeSummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={compReport.orderTypeSummary} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={(entry) => entry.type}>
                        {compReport.orderTypeSummary.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>الأكثر مبيعاً (منتجات)</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {isProductsLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : products && products.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value: number, name: string) => name === 'الإيرادات' ? formatCurrency(value) : value} />
                    <Legend />
                    <Bar dataKey="quantitySold" name="الكمية المباعة" fill="#f59e0b" />
                    <Bar dataKey="totalRevenue" name="الإيرادات" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المنتج</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead className="text-right">الكمية المباعة</TableHead>
                    <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                    <TableHead className="text-right">إجمالي التكاليف</TableHead>
                    <TableHead className="text-right">إجمالي الأرباح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell>{p.productId}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.quantitySold || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.totalRevenue || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.totalCost || 0)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(p.totalProfit || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {!products?.length && !isProductsLoading && (
                    <TableRow><TableCell colSpan={6} className="text-center py-4">لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>الأكثر مبيعاً (فئات)</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {isCategoriesLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : categories && categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value: number, name: string) => name === 'الإيرادات' ? formatCurrency(value) : value} />
                    <Legend />
                    <Bar dataKey="quantitySold" name="الكمية المباعة" fill="#f59e0b" />
                    <Bar dataKey="totalRevenue" name="الإيرادات" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة</TableHead>
                    <TableHead className="text-right">الكمية المباعة</TableHead>
                    <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                    <TableHead className="text-right">إجمالي التكاليف</TableHead>
                    <TableHead className="text-right">إجمالي الأرباح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((c) => (
                    <TableRow key={c.categoryId}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.quantitySold || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.totalRevenue || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.totalCost || 0)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(c.totalProfit || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {!categories?.length && !isCategoriesLoading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-4">لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>المبيعات حسب طريقة الدفع</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {isPaymentMethodsLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : paymentMethods && paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethods} dataKey="totalSales" nameKey="paymentMethodName" cx="50%" cy="50%" outerRadius={150} label={(entry) => `${entry.paymentMethodName}: ${formatCurrency(entry.totalSales)}`}>
                      {paymentMethods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead className="text-right">إجمالي الطلبات</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods?.map((pm) => (
                    <TableRow key={pm.paymentMethodId}>
                      <TableCell>{pm.paymentMethodName}</TableCell>
                      <TableCell className="text-right">{formatNumber(pm.totalOrders || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pm.totalSales || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {!paymentMethods?.length && !isPaymentMethodsLoading && (
                    <TableRow><TableCell colSpan={3} className="text-center py-4">لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>الطلبات الملغاة</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isCancelledLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>طلب #</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الكاشير</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead>الملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledOrders?.map((co) => (
                      <TableRow key={co.orderId}>
                        <TableCell>#{co.orderNumber}</TableCell>
                        <TableCell>{co.date ? format(new Date(co.date), "MMM d, yyyy h:mm a") : "-"}</TableCell>
                        <TableCell>{co.userName}</TableCell>
                        <TableCell className="text-right text-red-500 font-medium">{formatCurrency(co.total || 0)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={co.notes || ""}>{co.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {!cancelledOrders?.length && (
                      <TableRow><TableCell colSpan={5} className="text-center py-4">لا توجد طلبات ملغاة</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
