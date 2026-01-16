// Re-export all hooks for simpler imports
export { useSpecies } from './useSpecies';
export type { Species, FamilyOption, SpeciesStats, UseSpeciesOptions, UseSpeciesReturn } from './useSpecies';

export { useFamilies } from './useFamilies';
export type { Family, FamilyStats, PendingFamily, UseFamiliesOptions, UseFamiliesReturn } from './useFamilies';

export { useProjects } from './useProjects';
export type { Project, ProjectStats, UseProjectsReturn } from './useProjects';

export { useSpeciesImages } from './useSpeciesImages';
export type { ExistingImage, UseSpeciesImagesOptions, UseSpeciesImagesReturn, UploadOptions } from './useSpeciesImages';

export { useSpeciesForm } from './useSpeciesForm';
export type {
    Species as SpeciesFormData,
    FamilyOption as FormFamilyOption,
    LocalOption,
    LocalData,
    UseSpeciesFormOptions,
    UseSpeciesFormReturn
} from './useSpeciesForm';

export { useProjectDetails } from './useProjectDetails';
export type {
    ProjectDetails,
    LinkedUser,
    LinkedSpecies,
    LinkedFamily,
    ModalSpecies,
    TabType,
    UseProjectDetailsOptions,
    UseProjectDetailsReturn
} from './useProjectDetails';

export { useOverviewStats } from './useOverviewStats';
export type {
    AuditLog,
    RecentSpecies,
    RecentFamily,
    RecentWorkItem,
    RecentLocalSpecies,
    LocalFamily,
    ProjectData,
    GlobalStats,
    LocalStats,
    UseOverviewStatsReturn
} from './useOverviewStats';

export { useSpeciesActions } from './useSpeciesActions';

export { useProjectActions } from './useProjectActions';

export { useFamilyActions } from './useFamilyActions';
