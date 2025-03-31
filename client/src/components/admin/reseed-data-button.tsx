import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export function ReseedDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleReseed = async () => {
    try {
      setIsLoading(true);
      
      // Make POST request to reseed endpoint
      await apiRequest(
        'POST',
        '/api/admin/reseed-demo-data',
        {}
      );
      
      // Invalidate cache to refresh data from backend
      await queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/planning-weeks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/weekly-plans'] });
      
      toast({
        title: "Success",
        description: "Demo data has been reset successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to reset demo data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleReseed} 
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reseeding Data...
        </>
      ) : (
        'Reseed Demo Data'
      )}
    </Button>
  );
}