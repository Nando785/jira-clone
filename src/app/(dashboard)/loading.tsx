
import { Loader } from "lucide-react";
const DashboardLoading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="h-full animate-spin text-muted-foreground" />
        </div>
    );
};

export default DashboardLoading;
