import asyncHandler from 'express-async-handler';

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

const checkPlanLimit = (feature) => asyncHandler(async (req, res, next) => {
  const userPlan = req.user.subscription?.plan || 'free';
  const limits = PLAN_LIMITS[userPlan];

  if (!limits) {
    res.status(400);
    throw new Error('Invalid subscription plan');
  }

  // Check feature access
  if (feature === 'createStudyRoom' && !limits.canCreateStudyRooms) {
    res.status(403);
    throw new Error('Upgrade to Pro plan to create study rooms');
  }

  if (feature === 'examCreator' && !limits.canUseExamCreator) {
    res.status(403);
    throw new Error('Upgrade to Pro plan to use exam creator');
  }

  if (feature === 'compareNotes' && !limits.canCompareNotes) {
    res.status(403);
    throw new Error('Upgrade to Pro plan to compare notes');
  }

  // Check AI credits
  if (feature === 'aiCredits') {
    const currentCredits = req.user.usage?.requests || 0;
    const customCredits = req.user.usage?.customCredits || 0;
    const totalAvailable = limits.aiCredits + customCredits;
    
    if (currentCredits >= totalAvailable) {
      res.status(403);
      throw new Error('AI credits limit reached. Upgrade your plan for more credits.');
    }
  }

  req.planLimits = limits;
  next();
});

const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

export { checkPlanLimit, getPlanLimits, PLAN_LIMITS };