import { MainLayout } from "../components/NavBar/MainLayout";
import { Outlet } from "react-router-dom";
import { PrintProvider } from "../components/Print/PrintProvider";
import { PrintSettingsModal } from "../components/Print/PrintSettingsModal";
import { PrintPreview } from "../components/Print/PrintPreview";
import "../components/Print/print.css";

export function Root() {
    return (
        <PrintProvider>
            <MainLayout>
                <Outlet />
            </MainLayout>
            <PrintSettingsModal />
            <PrintPreview />
        </PrintProvider>
    );
}