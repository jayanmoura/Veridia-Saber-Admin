/**
 * Overview - Refactored version using extracted hook and view components.
 * 
 * Original: 1252 lines
 * Refactored: ~50 lines
 */
import { useOverviewStats } from '../../hooks';
import {
    GlobalAdminView,
    LocalAdminView,
    SeniorView,
    CatalogerView
} from '../../components/Overview';

export default function Overview() {
    const {
        isGlobalAdmin,
        isLocalAdmin,
        isSenior,
        stats,
        recentLogs,
        recentWork,
        pendingSpecies,
        projectData,
        localStats,
        recentLocalSpecies,
        loadingRecentSpecies,
        localFamilies,
        loadingFamilies,
        fetchLocalFamilies,
        loading,
        refetch
    } = useOverviewStats();

    // Render based on role
    if (isGlobalAdmin) {
        return (
            <GlobalAdminView
                stats={stats}
                recentLogs={recentLogs}
                loading={loading}
            />
        );
    }

    if (isLocalAdmin) {
        return (
            <LocalAdminView
                projectData={projectData}
                localStats={localStats}
                recentLocalSpecies={recentLocalSpecies}
                loadingRecentSpecies={loadingRecentSpecies}
                localFamilies={localFamilies}
                loadingFamilies={loadingFamilies}
                fetchLocalFamilies={fetchLocalFamilies}
                loading={loading}
                refetch={refetch}
            />
        );
    }

    if (isSenior) {
        return (
            <SeniorView
                stats={stats}
                recentWork={recentWork}
                pendingSpecies={pendingSpecies}
                loading={loading}
                refetch={refetch}
            />
        );
    }

    // Default: Cataloger / Consulente
    return (
        <CatalogerView
            stats={stats}
            loading={loading}
        />
    );
}
