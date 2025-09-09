import { useAuth } from './useAuth';

const PLAN_LIMITS = {
  free: {
    subjects: 2,
    notesPerSubject: 3,
    aiCredits: 25,
    canCreateStudyRooms: false,
    canUseExamCreator: false,
    canCompareNotes: false
  },
  pro: {
    subjects: 8,
    notesPerSubject: 10,
    aiCredits: 100,
    canCreateStudyRooms: true,
    canUseExamCreator: true,
    canCompareNotes: true
  },
  premium: {
    subjects: -1, // unlimited
    notesPerSubject: 25,
    aiCredits: 300,
    canCreateStudyRooms: true,
    canUseExamCreator: true,
    canCompareNotes: true
  },
  ultra: {
    subjects: -1, // unlimited
    notesPerSubject: -1, // unlimited
    aiCredits: 1000,
    canCreateStudyRooms: true,
    canUseExamCreator: true,
    canCompareNotes: true
  }
};

export const usePlanLimits = () => {
  const { user } = useAuth();
  const userPlan = user?.subscription?.plan || 'free';
  const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  const checkFeatureAccess = (feature: string) => {
    switch (feature) {
      case 'createStudyRoom':
        return limits.canCreateStudyRooms;
      case 'examCreator':
        return limits.canUseExamCreator;
      case 'compareNotes':
        return limits.canCompareNotes;
      default:
        return true;
    }
  };

  const getUpgradeMessage = (feature: string) => {
    switch (feature) {
      case 'createStudyRoom':
        return 'Upgrade to Pro plan to create study rooms';
      case 'examCreator':
        return 'Upgrade to Pro plan to use exam creator';
      case 'compareNotes':
        return 'Upgrade to Pro plan to compare notes';
      default:
        return 'Upgrade your plan to access this feature';
    }
  };

  return {
    limits,
    userPlan,
    checkFeatureAccess,
    getUpgradeMessage
  };
};