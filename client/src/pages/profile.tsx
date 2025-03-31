import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Shield, User as UserIcon, KeyRound } from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(3, { message: "Full name is required (min 3 characters)" })
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required (min 6 characters)" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your new password" })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile update form
  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || ""
    }
  });

  // Password update form
  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: UpdateProfileFormValues) => {
      return await apiRequest("PATCH", `/api/users/${user?.id}`, formData);
    },
    onSuccess: async () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (formData: UpdatePasswordFormValues) => {
      return await apiRequest("PATCH", `/api/users/${user?.id}/password`, formData);
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
      setActiveTab("profile");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    }
  });

  // Submit handlers
  const onProfileSubmit = (data: UpdateProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: UpdatePasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  return (
    <PageWrapper 
      title="My Profile" 
      subtitle="Manage your account information and security settings"
      icon={<UserIcon className="w-5 h-5" />}
    >
      <div className="container mx-auto py-6 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how it appears in the application
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...profileForm}>
                  <form 
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)} 
                    className="space-y-6"
                  >
                    {/* Username (non-editable) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Username
                      </label>
                      <div className="relative">
                        <Input
                          disabled
                          value={user?.username || ""}
                          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                        />
                        <div className="absolute right-3 top-2.5 text-xs bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          Cannot change
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Your username is used for login and cannot be changed
                      </p>
                    </div>
                    
                    {/* User role (non-editable) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Role
                      </label>
                      <div className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-500 dark:text-slate-400">
                        {user?.isAdmin ? (
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-primary" />
                            <span>Administrator</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
                            <span>Teacher</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Full Name (editable) */}
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : "Update Profile"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Password Settings</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...passwordForm}>
                  <form 
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} 
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Enter your current password" 
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Enter your new password" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Confirm your new password" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={
                        updatePasswordMutation.isPending || 
                        !passwordForm.formState.isDirty ||
                        Object.keys(passwordForm.formState.errors).length > 0
                      }
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : "Change Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex flex-col items-start border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-6 py-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password Requirements:</h4>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Minimum 6 characters long</li>
                  <li>Include both uppercase and lowercase characters for better security</li>
                  <li>Include at least one number or special character</li>
                </ul>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}