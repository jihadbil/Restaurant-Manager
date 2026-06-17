import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUsers,
  useGetRoles,
  useUpdateUser,
  useDeleteUser,
  useChangeUserPassword,
  useUpdateUserRoles,
  getGetUsersQueryKey,
} from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Edit, Trash2, Key, Shield, UserPlus } from "lucide-react";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useGetUsers();
  const { data: rolesList } = useGetRoles();

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const changePassword = useChangeUserPassword();
  const updateRoles = useUpdateUserRoles();

  // Modals state
  const [editUser, setEditUser] = useState<any>(null);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [rolesUser, setRolesUser] = useState<any>(null);
  const [deleteUserObj, setDeleteUserObj] = useState<any>(null);

  // Forms state
  const [editForm, setEditForm] = useState({ userName: "", email: "", phoneNumber: "" });
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleEditOpen = (user: any) => {
    setEditForm({ userName: user.userName || "", email: user.email || "", phoneNumber: user.phoneNumber || "" });
    setEditUser(user);
  };

  const handleEditSubmit = () => {
    updateUser.mutate(
      { id: editUser.id, data: { ...editForm } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          toast({ title: "تم تحديث المستخدم بنجاح." });
          setEditUser(null);
        },
        onError: () => toast({ title: "فشل تحديث المستخدم.", variant: "destructive" }),
      }
    );
  };

  const handlePasswordOpen = (user: any) => {
    setPwdForm({ currentPassword: "", newPassword: "" });
    setPasswordUser(user);
  };

  const handlePasswordSubmit = () => {
    changePassword.mutate(
      { id: passwordUser.id, data: pwdForm },
      {
        onSuccess: () => {
          toast({ title: "تم تغيير كلمة المرور بنجاح." });
          setPasswordUser(null);
        },
        onError: () => toast({ title: "فشل تغيير كلمة المرور.", variant: "destructive" }),
      }
    );
  };

  const handleRolesOpen = (user: any) => {
    setSelectedRoles(user.roles || []);
    setRolesUser(user);
  };

  const handleRolesSubmit = () => {
    updateRoles.mutate(
      { id: rolesUser.id, data: { roles: selectedRoles } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          toast({ title: "تم تحديث الأدوار بنجاح." });
          setRolesUser(null);
        },
        onError: () => toast({ title: "فشل تحديث الأدوار.", variant: "destructive" }),
      }
    );
  };

  const handleDeleteSubmit = () => {
    deleteUser.mutate(
      { id: deleteUserObj.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          toast({ title: "تم حذف المستخدم بنجاح." });
          setDeleteUserObj(null);
        },
        onError: () => toast({ title: "فشل حذف المستخدم.", variant: "destructive" }),
      }
    );
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "cashier": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">المستخدمون</h1>
        <Button variant="default" disabled>
          <UserPlus className="ms-2 h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead className="w-[80px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا يوجد مستخدمون
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.userName || "N/A"}</TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role: string) => (
                        <Badge key={role} variant={getRoleColor(role) as any}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditOpen(user)}>
                          <Edit className="ms-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRolesOpen(user)}>
                          <Shield className="ms-2 h-4 w-4" /> إدارة الأدوار
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePasswordOpen(user)}>
                          <Key className="ms-2 h-4 w-4" /> تغيير كلمة المرور
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteUserObj(user)} className="text-destructive focus:text-destructive">
                          <Trash2 className="ms-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المستخدم</Label>
              <Input
                value={editForm.userName}
                onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button onClick={handleEditSubmit} disabled={updateUser.isPending}>
              {updateUser.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <Input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordUser(null)}>إلغاء</Button>
            <Button onClick={handlePasswordSubmit} disabled={changePassword.isPending}>
              {changePassword.isPending ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={!!rolesUser} onOpenChange={(open) => !open && setRolesUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إدارة الأدوار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rolesList?.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoles([...selectedRoles, role]);
                    } else {
                      setSelectedRoles(selectedRoles.filter((r) => r !== role));
                    }
                  }}
                />
                <Label htmlFor={`role-${role}`} className="ps-2">{role}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesUser(null)}>إلغاء</Button>
            <Button onClick={handleRolesSubmit} disabled={updateRoles.isPending}>
              {updateRoles.isPending ? "جارٍ الحفظ..." : "حفظ الأدوار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserObj} onOpenChange={(open) => !open && setDeleteUserObj(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيؤدي ذلك إلى حذف حساب المستخدم نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserObj(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmit} className="bg-destructive text-destructive-foreground">
              {deleteUser.isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
