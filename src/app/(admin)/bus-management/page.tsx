import { BusManagementTable } from "@/components/BusManagementTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BusManagementPage() {
  return (
    <div>
        <h1 className="text-2xl font-bold font-headline mb-2">Bus & Route Management</h1>
        <p className="text-muted-foreground mb-6">
          View, add, edit, and manage all buses and their assigned routes.
        </p>

        <Card>
            <CardContent className="pt-6">
                <BusManagementTable />
            </CardContent>
        </Card>
    </div>
  );
}
