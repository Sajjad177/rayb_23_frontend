/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Key, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// API fetch function for users list
const fetchUsers = async ({
  userType,
  sortBy,
  time,
}: {
  userType: string;
  sortBy: string;
  time: string;
}) => {
  const params = new URLSearchParams({
    ...(userType !== "all" && {
      userType: userType === "businessOwner" ? "businessOwner" : userType,
    }),
    ...(sortBy !== "latest" && { sortBy }),
    ...(time !== "all" && { time }),
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user?${params}`
  );
  if (!response.ok) throw new Error("Failed to fetch users");
  const data = await response.json();
  return data.data;
};

// API fetch function for single user
const fetchUserDetails = async (userId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/${userId}`
  );
  if (!response.ok) throw new Error("Failed to fetch user details");
  const data = await response.json();
  return data.data;
};

// API function to toggle user status (suspend/unsuspend)
const toggleUserStatus = async ({
  userId,
  token
}: {
  userId: string;
  token?: string;
}) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/toggle-status/${userId}`,
    {
      method: "PUT",
      headers,
    }
  );
  if (!response.ok) throw new Error("Failed to toggle user status");
  return response.json();
};

// API function to delete user
const deleteUser = async (userId: string, token?: string): Promise<void> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/delete-account/${userId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete user`);
  }

  return response.json();
};

export default function ManageUsersPage() {
  const [userType, setUserType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "suspend" | "unsuspend" | "delete" | "restore"
  >("suspend");
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", userType, sortBy, timeRange],
    queryFn: () => fetchUsers({ userType, sortBy, time: timeRange }),
  });

  const { data: userDetails, isLoading: isUserDetailsLoading } = useQuery({
    queryKey: ["userDetails", selectedUserId],
    queryFn: () => fetchUserDetails(selectedUserId!),
    enabled: !!selectedUserId && isViewModalOpen,
  });

  // Mutation for toggling user status (suspend/unsuspend)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      toggleUserStatus({ userId, token }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", userType, sortBy, timeRange] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      toast.success(data.message || `User updated successfully`);
      setIsStatusModalOpen(false);
      setSelectedUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to update user`);
    },
    onSettled: () => {
      // Ensure modal closes even if there's an error
      setTimeout(() => {
        if (toggleStatusMutation.isPending === false) {
          // Only proceed if mutation is not pending
        }
      }, 100);
    },
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId, token),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["users", userType, sortBy, timeRange] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      toast.success(data?.message || 'User deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
    onSettled: () => {
      // Ensure modal closes even if there's an error
      setTimeout(() => {
        if (deleteUserMutation.isPending === false) {
          // Only proceed if mutation is not pending
        }
      }, 100);
    },
  });

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (userId: string, isActive: boolean) => {
    setSelectedUserId(userId);
    setActionType(isActive ? "suspend" : "unsuspend");
    setIsStatusModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setSelectedUserId(userId);
    setActionType("delete");
    setIsDeleteModalOpen(true);
  };

  const handleRestoreUser = (userId: string) => {
    setSelectedUserId(userId);
    setActionType("restore");
    setIsDeleteModalOpen(true);
  };

  const confirmToggleStatus = () => {
    if (selectedUserId) {
      toggleStatusMutation.mutate({ userId: selectedUserId });
    }
  };

  const confirmDelete = () => {
    if (selectedUserId) {
      deleteUserMutation.mutate(selectedUserId);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <div className="grid gap-2">
        <h1 className="text-[28px] text-[#1D2020] font-bold">Manage Users</h1>
        <p className="text-base text-[#485150] font-normal mt-3">
          Monitor platform activity, manage submissions, and keep your community
          running smoothly.
        </p>
      </div>
      <div className="flex flex-col justify-between md:flex-row md:items-end">
        <div className="w-[30%]">
          <label
            htmlFor="user-type"
            className="text-base text-[#485150] font-medium"
          >
            User Type
          </label>
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger id="user-type" className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="businessOwner">Business Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[30%]">
          <label
            htmlFor="sort-by"
            className="text-base text-[#485150] font-medium"
          >
            Sort By
          </label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="w-full">
              <SelectValue placeholder="Latest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[30%]">
          <label
            htmlFor="time-range"
            className="text-base text-[#485150] font-medium"
          >
            Time Range
          </label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger id="time-range" className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="last-7">Last 7 Days</SelectItem>
              <SelectItem value="ast-30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Name
              </th>
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Email
              </th>
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Phone Number
              </th>
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Date join
              </th>
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Designation
              </th>
              <th className="h-12 px-4 text-left align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Status
              </th>
              <th className="h-12 px-4 text-right align-middle text-base text-[#252525] font-semibold [&:has([role=checkbox])]:pr-0">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {isLoading
              ? Array(8)
                  .fill(0)
                  .map((_, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted even:bg-muted/50"
                    >
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full" />
                        <Skeleton className="h-4 w-[150px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <Skeleton className="h-4 w-[200px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <Skeleton className="h-4 w-[120px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <Skeleton className="h-4 w-[100px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <Skeleton className="h-4 w-[120px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <Skeleton className="h-4 w-[80px]" />
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
              : // eslint-disable-next-line
                users?.map(
                  (user: {
                    _id: Key | null | undefined;
                    imageLink: string;
                    name: string;
                    email: string;
                    phone: string;
                    createdAt: string | number | Date;
                    userType: string;
                    isActive: boolean;
                    isDelete: boolean;
                  }) => (
                    <tr
                      key={user._id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted even:bg-muted/50"
                    >
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex items-center gap-3 text-base font-medium text-[#252525]">
                        <Avatar className="w-9 h-9 border">
                          <AvatarImage
                            src={user.imageLink || "/placeholder.svg"}
                            alt={
                              typeof user.name === "string"
                                ? user.name
                                : user.name
                                ? String(user.name)
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            {typeof user.name === "string" && user.name
                              ? user.name.charAt(0)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-base font-medium text-[#252525]">
                        {user.email}
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-base font-medium text-[#252525]">
                        {user.phone || "N/A"}
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-base font-medium text-[#252525]">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-base font-medium text-[#252525]">
                        {user.userType === "businessMan"
                          ? "Business"
                          : user.userType === "user"
                          ? "Customer"
                          : user?.userType?.charAt(0).toUpperCase() +
                            user?.userType?.slice(1)}
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-base font-medium text-[#252525]">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isDelete
                              ? "bg-gray-200 text-gray-800"
                              : user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isDelete
                            ? "Deleted"
                            : user.isActive
                              ? "Active"
                              : "Suspended"}
                        </span>
                      </td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right text-base font-medium text-[#252525]">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewUser(String(user._id))}
                            >
                              View Profile
                            </DropdownMenuItem>
                            {user.isDelete ? (
                              <DropdownMenuItem
                                onClick={() => handleRestoreUser(String(user._id))}
                                className="text-green-600"
                              >
                                Restore
                              </DropdownMenuItem>
                            ) : user.isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(String(user._id), user.isActive)}
                                className="text-red-600"
                              >
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(String(user._id), user.isActive)}
                                className="text-green-600"
                              >
                                Unsuspend
                              </DropdownMenuItem>
                            )}
                            {!user.isDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(String(user._id))}
                                className="text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                )}
          </tbody>
        </table>
      </div>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {isUserDetailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p>{userDetails.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p>{userDetails.email}</p>
              </div>
              <div>
                <Label>User Type</Label>
                <p>
                  {userDetails.userType === "businessOwner"
                    ? "Business Owner"
                    : "Customer"}
                </p>
              </div>
              <div>
                <Label>Bio</Label>
                <p>{userDetails.bio || "N/A"}</p>
              </div>
              <div>
                <Label>Address</Label>
                <p>{userDetails.address || "N/A"}</p>
              </div>
              <div>
                <Label>Verified</Label>
                <p>{userDetails.isVerified ? "Yes" : "No"}</p>
              </div>
              <div>
                <Label>Active Status</Label>
                <p>
                  {userDetails.isDelete
                    ? "Deleted"
                    : userDetails.isActive
                      ? "Active"
                      : "Suspended"}
                </p>
              </div>
              <div>
                <Label>Created At</Label>
                <p>
                  {new Date(userDetails.createdAt).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Unsuspend User Confirmation Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm User {actionType === "suspend" ? "Suspension" : "Unsuspension"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionType} this user?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "suspend" ? "destructive" : "default"}
              onClick={confirmToggleStatus}
              disabled={toggleStatusMutation.isPending}
              className={
                actionType === "unsuspend" 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : ""
              }
            >
              {toggleStatusMutation.isPending 
                ? `${actionType === "suspend" ? "Suspending..." : "Unsuspending..."}` 
                : actionType === "suspend" ? "Suspend" : "Unsuspend"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "restore"
                ? "Confirm User Restore"
                : "Confirm User Deletion"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {actionType === "restore"
                ? "Are you sure you want to restore this user account?"
                : "Are you sure you want to delete this user account?"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "restore" ? "default" : "destructive"}
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              className={
                actionType === "restore"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              {deleteUserMutation.isPending
                ? actionType === "restore"
                  ? "Restoring..."
                  : "Deleting..."
                : actionType === "restore"
                  ? "Restore"
                  : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
