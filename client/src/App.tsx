import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Plans from "@/pages/plans";
import CreatePlan from "@/pages/plans/create";
import Teachers from "@/pages/admin/teachers";
import Grades from "@/pages/admin/grades";
import Subjects from "@/pages/admin/subjects";
import PlanningWeeks from "@/pages/admin/planning-weeks";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminRoute } from "@/components/auth/admin-route";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />

          {/* Protected Routes */}
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/plans">
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          </Route>
          
          <Route path="/plans/create">
            <ProtectedRoute>
              <CreatePlan />
            </ProtectedRoute>
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/teachers">
            <AdminRoute>
              <Teachers />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/grades">
            <AdminRoute>
              <Grades />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/subjects">
            <AdminRoute>
              <Subjects />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/planning-weeks">
            <AdminRoute>
              <PlanningWeeks />
            </AdminRoute>
          </Route>
          
          {/* 404 Route */}
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
