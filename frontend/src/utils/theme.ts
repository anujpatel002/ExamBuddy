// Theme utility functions and constants

export const themeClasses = {
  // Background classes
  bgPrimary: 'theme-bg-primary',
  bgSecondary: 'theme-bg-secondary', 
  bgTertiary: 'theme-bg-tertiary',
  
  // Text classes
  textPrimary: 'theme-text-primary',
  textSecondary: 'theme-text-secondary',
  textMuted: 'theme-text-muted',
  
  // Border classes
  border: 'theme-border',
  
  // Component classes
  glassCard: 'glass-card',
  glassInput: 'glass-input',
  glassIcon: 'glass-icon-container',
  
  // Button classes
  btnPrimary: 'btn-primary',
  btnSecondary: 'btn-secondary',
  
  // Layout classes
  navbar: 'navbar',
  sidebar: 'sidebar',
  sidebarItem: 'sidebar-item',
  modal: 'modal',
  card: 'card',
  
  // Specific component classes
  dashboardCard: 'dashboard-card',
  questionCard: 'question-card',
  studyRoom: 'study-room',
  notebookPanel: 'notebook-panel',
  mindmapNode: 'mindmap-node',
  flashcard: 'flashcard',
  profileSection: 'profile-section',
  pricingCard: 'pricing-card',
  authContainer: 'auth-container',
  authCard: 'auth-card',
  summaryContent: 'summary-content'
};

export const getThemeClass = (component: keyof typeof themeClasses): string => {
  return themeClasses[component];
};

// Helper function to combine theme classes
export const combineThemeClasses = (...classes: (keyof typeof themeClasses)[]): string => {
  return classes.map(cls => themeClasses[cls]).join(' ');
};

// Common theme combinations
export const commonThemes = {
  cardWithText: `${themeClasses.glassCard} ${themeClasses.textPrimary}`,
  inputField: `${themeClasses.glassInput} ${themeClasses.textPrimary}`,
  buttonPrimary: `${themeClasses.btnPrimary}`,
  buttonSecondary: `${themeClasses.btnSecondary} ${themeClasses.textPrimary}`,
  modalContainer: `${themeClasses.modal} ${themeClasses.textPrimary}`,
  pageContainer: `${themeClasses.bgPrimary} ${themeClasses.textPrimary}`,
  sectionHeader: `${themeClasses.textPrimary}`,
  sectionSubtext: `${themeClasses.textSecondary}`,
  mutedText: `${themeClasses.textMuted}`
};