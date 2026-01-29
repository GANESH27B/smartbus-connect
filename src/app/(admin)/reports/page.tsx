import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                    <BarChart3 className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>This feature is coming soon.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Detailed reports on on-time performance, busiest routes, and usage trends will be available here. You'll be able to export data to Excel and PDF.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
