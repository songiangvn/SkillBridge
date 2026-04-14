export type SkillBridgeUser = {
  id: string;
  name: string;
  role: "Learner" | "Tutor" | "Both";
  avatarUrl: string;
  headline: string;
  canTeach: string[];
  wantsToLearn: string[];
  availability: string;
  goal: string;
  mode: "Online" | "In person" | "Hybrid";
  rating?: number;
  hourlyRate?: string;
};

export type LearningResource = {
  id: string;
  title: string;
  subject: string;
  level: string;
  verifiedBy: string;
  image: string;
};

const SuggestedUsers: SkillBridgeUser[] = [
  {
    id: "user-1",
    name: "Maya Tran",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=85&w=1600&auto=format&fit=crop",
    headline: "Frontend mentor practicing spoken English with peers",
    canTeach: ["React Native", "UI basics"],
    wantsToLearn: ["English speaking", "Public speaking"],
    availability: "Tue Thu evenings",
    goal: "Ship one polished portfolio app in 6 weeks",
    mode: "Online",
    rating: 4.8,
  },
  {
    id: "user-2",
    name: "Daniel Kim",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=85&w=1600&auto=format&fit=crop",
    headline: "Math coach helping students prep for exams",
    canTeach: ["Algebra", "Calculus"],
    wantsToLearn: ["Product design"],
    availability: "Weekends",
    goal: "Trade structured lessons for design feedback",
    mode: "Hybrid",
    rating: 4.9,
    hourlyRate: "$18/hr",
  },
  {
    id: "user-3",
    name: "Ari Park",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1600&auto=format&fit=crop",
    headline: "Product designer practicing coding through pair sessions",
    canTeach: ["Wireframing", "UX writing"],
    wantsToLearn: ["TypeScript", "React Native"],
    availability: "Tue Thu mornings",
    goal: "Build one MVP and improve technical confidence",
    mode: "Online",
    rating: 4.6,
  },
  {
    id: "user-4",
    name: "Lina Park",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop",
    headline: "Korean tutor trading language lessons for coding help",
    canTeach: ["Korean", "Study planning"],
    wantsToLearn: ["JavaScript", "Node.js"],
    availability: "Saturday afternoons",
    goal: "Keep two focused exchange sessions each week",
    mode: "Online",
    rating: 4.7,
  },
  {
    id: "user-5",
    name: "Noah Brooks",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=85&w=1600&auto=format&fit=crop",
    headline: "Guitar tutor open to creative skill swaps",
    canTeach: ["Guitar", "Music theory"],
    wantsToLearn: ["Video editing", "Branding"],
    availability: "Sunday evenings",
    goal: "Trade music sessions for creator workflow support",
    mode: "In person",
    rating: 4.5,
    hourlyRate: "$15/hr",
  },
  {
    id: "user-6",
    name: "Sara Ahmed",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=85&w=1600&auto=format&fit=crop",
    headline: "IELTS mentor learning SQL for analytics projects",
    canTeach: ["IELTS speaking", "Essay feedback"],
    wantsToLearn: ["SQL", "Data visualization"],
    availability: "Mon Wed evenings",
    goal: "Run weekly accountability sessions",
    mode: "Online",
    rating: 4.8,
  },
  {
    id: "user-7",
    name: "Diego Santos",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=85&w=1600&auto=format&fit=crop",
    headline: "Junior PM improving coding and system design basics",
    canTeach: ["Roadmapping", "Stakeholder communication"],
    wantsToLearn: ["Python", "System design"],
    availability: "Fri nights",
    goal: "Build a side project with better architecture",
    mode: "Hybrid",
    rating: 4.2,
  },
  {
    id: "user-8",
    name: "Hana Ito",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=85&w=1600&auto=format&fit=crop",
    headline: "Japanese language tutor with structured lesson plans",
    canTeach: ["Japanese N5-N3", "Pronunciation"],
    wantsToLearn: ["UI animation"],
    availability: "Weekday mornings",
    goal: "Offer goal-based language exchange sessions",
    mode: "Online",
    rating: 4.9,
    hourlyRate: "$20/hr",
  },
  {
    id: "user-9",
    name: "Omar Malik",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=85&w=1600&auto=format&fit=crop",
    headline: "Backend engineer mentoring APIs and learning storytelling",
    canTeach: ["Node.js", "REST API"],
    wantsToLearn: ["Storytelling", "Pitching"],
    availability: "Tue nights",
    goal: "Improve demo communication while mentoring backend",
    mode: "Online",
    rating: 4.7,
  },
  {
    id: "user-10",
    name: "Grace Liu",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=85&w=1600&auto=format&fit=crop",
    headline: "Medical student learning coding for research automation",
    canTeach: ["Biology basics", "Note systems"],
    wantsToLearn: ["Python", "Pandas"],
    availability: "Weekend mornings",
    goal: "Automate one research workflow in a month",
    mode: "Online",
    rating: 4.4,
  },
  {
    id: "user-11",
    name: "Kevin Moore",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=85&w=1600&auto=format&fit=crop",
    headline: "SAT math coach with fast doubt-solving sessions",
    canTeach: ["SAT math", "Exam strategy"],
    wantsToLearn: ["Content marketing"],
    availability: "Evenings daily",
    goal: "Exchange tutoring for growth strategy support",
    mode: "Hybrid",
    rating: 4.8,
    hourlyRate: "$22/hr",
  },
  {
    id: "user-12",
    name: "Anya Petrova",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=85&w=1600&auto=format&fit=crop",
    headline: "Data analyst helping Excel and learning React",
    canTeach: ["Excel", "Dashboard basics"],
    wantsToLearn: ["React", "Frontend architecture"],
    availability: "Mon Thu nights",
    goal: "Complete one dashboard redesign with React",
    mode: "Online",
    rating: 4.6,
  },
  {
    id: "user-13",
    name: "Minh Le",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=85&w=1600&auto=format&fit=crop",
    headline: "Content creator learning motion design workflow",
    canTeach: ["Short-form scripting", "Creator branding"],
    wantsToLearn: ["After Effects", "Motion design"],
    availability: "Weekends",
    goal: "Deliver one polished video every week",
    mode: "In person",
    rating: 4.3,
  },
  {
    id: "user-14",
    name: "Rina Ghosh",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=85&w=1600&auto=format&fit=crop",
    headline: "Chemistry tutor focused on concept-first learning",
    canTeach: ["Organic chemistry", "Lab reports"],
    wantsToLearn: ["No-code automation"],
    availability: "Tue Fri afternoons",
    goal: "Trade chemistry support for workflow automation tips",
    mode: "Online",
    rating: 4.7,
    hourlyRate: "$19/hr",
  },
  {
    id: "user-15",
    name: "Ethan Walker",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=85&w=1600&auto=format&fit=crop",
    headline: "DevOps engineer mentoring CI/CD and learning design",
    canTeach: ["CI/CD", "Docker basics"],
    wantsToLearn: ["Design systems", "Visual hierarchy"],
    availability: "Late evenings",
    goal: "Improve cross-functional product collaboration",
    mode: "Hybrid",
    rating: 4.6,
  },
  {
    id: "user-16",
    name: "Yuna Choi",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1600&auto=format&fit=crop",
    headline: "Junior marketer learning SQL and dashboard thinking",
    canTeach: ["Campaign planning", "Social analytics"],
    wantsToLearn: ["SQL", "Looker Studio"],
    availability: "Wed evenings",
    goal: "Own a complete growth report pipeline",
    mode: "Online",
    rating: 4.1,
  },
  {
    id: "user-17",
    name: "Leo Costa",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1545996124-0501ebae84d0?q=85&w=1600&auto=format&fit=crop",
    headline: "Spanish tutor with practical conversational curriculum",
    canTeach: ["Spanish conversation", "Pronunciation"],
    wantsToLearn: ["Product analytics"],
    availability: "Morning weekdays",
    goal: "Exchange language support for analytics mentorship",
    mode: "Online",
    rating: 4.8,
    hourlyRate: "$17/hr",
  },
  {
    id: "user-18",
    name: "Nina Rossi",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=85&w=1600&auto=format&fit=crop",
    headline: "UI designer teaching Figma and learning backend basics",
    canTeach: ["Figma", "Design critique"],
    wantsToLearn: ["APIs", "Database modeling"],
    availability: "Thu Sat",
    goal: "Bridge design decisions with backend constraints",
    mode: "Online",
    rating: 4.7,
  },
  {
    id: "user-19",
    name: "Aman Verma",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?q=85&w=1600&auto=format&fit=crop",
    headline: "Civil engineer pivoting into software development",
    canTeach: ["Project estimation", "Technical writing"],
    wantsToLearn: ["JavaScript", "Git workflow"],
    availability: "Night weekdays",
    goal: "Become job-ready for junior frontend roles",
    mode: "Hybrid",
    rating: 4.2,
  },
  {
    id: "user-20",
    name: "Sophie Miller",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?q=85&w=1600&auto=format&fit=crop",
    headline: "Statistics tutor for beginners and exam prep",
    canTeach: ["Statistics", "Probability"],
    wantsToLearn: ["Video storytelling"],
    availability: "Tue Thu afternoons",
    goal: "Blend teaching with creator skill growth",
    mode: "Online",
    rating: 4.9,
    hourlyRate: "$21/hr",
  },
  {
    id: "user-21",
    name: "Victor Nguyen",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=85&w=1600&auto=format&fit=crop",
    headline: "Mobile engineer sharing debugging habits and learning AI",
    canTeach: ["React Native", "Debugging"],
    wantsToLearn: ["LLM prompting", "RAG basics"],
    availability: "Mon Fri nights",
    goal: "Apply AI features into mobile products",
    mode: "Online",
    rating: 4.8,
  },
  {
    id: "user-22",
    name: "Emma Silva",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=85&w=1600&auto=format&fit=crop",
    headline: "HR specialist learning product operations",
    canTeach: ["Interview prep", "People ops"],
    wantsToLearn: ["Product metrics", "Experiment design"],
    availability: "Weekend afternoons",
    goal: "Transition into product operations role",
    mode: "Online",
    rating: 4.0,
  },
  {
    id: "user-23",
    name: "Pavel Novak",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=85&w=1600&auto=format&fit=crop",
    headline: "Physics tutor explaining hard topics with simple models",
    canTeach: ["Physics", "Problem solving"],
    wantsToLearn: ["Digital illustration"],
    availability: "Daily evenings",
    goal: "Swap conceptual tutoring for visual storytelling practice",
    mode: "In person",
    rating: 4.6,
    hourlyRate: "$16/hr",
  },
  {
    id: "user-24",
    name: "Clara Sun",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?q=85&w=1600&auto=format&fit=crop",
    headline: "No-code builder teaching automation and learning code",
    canTeach: ["Zapier", "No-code MVP"],
    wantsToLearn: ["TypeScript", "Clean architecture"],
    availability: "Mon Wed Fri",
    goal: "Move from no-code MVPs to scalable apps",
    mode: "Hybrid",
    rating: 4.5,
  },
  {
    id: "user-25",
    name: "Jonas Reed",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=85&w=1600&auto=format&fit=crop",
    headline: "Photographer learning social strategy for growth",
    canTeach: ["Photo editing", "Lighting basics"],
    wantsToLearn: ["Social growth", "Ad creatives"],
    availability: "Sat Sun mornings",
    goal: "Grow portfolio leads through better marketing",
    mode: "In person",
    rating: 4.1,
  },
  {
    id: "user-26",
    name: "Fatima Khan",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=85&w=1600&auto=format&fit=crop",
    headline: "Biology mentor helping with exam prep and concept maps",
    canTeach: ["Biology", "Study strategies"],
    wantsToLearn: ["Canva design"],
    availability: "Weeknights",
    goal: "Create better visual teaching material",
    mode: "Online",
    rating: 4.8,
    hourlyRate: "$18/hr",
  },
  {
    id: "user-27",
    name: "Adrian Cole",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=85&w=1600&auto=format&fit=crop",
    headline: "Sales lead teaching negotiation while learning SQL",
    canTeach: ["Negotiation", "Cold outreach"],
    wantsToLearn: ["SQL", "Data storytelling"],
    availability: "Tue Thu nights",
    goal: "Use data to run better sales decisions",
    mode: "Online",
    rating: 4.4,
  },
  {
    id: "user-28",
    name: "Isabella Costa",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=85&w=1600&auto=format&fit=crop",
    headline: "Junior designer learning React for better handoff",
    canTeach: ["Color systems", "Typography"],
    wantsToLearn: ["React", "Component architecture"],
    availability: "Mon Thu afternoons",
    goal: "Design and ship one coded UI kit",
    mode: "Hybrid",
    rating: 4.3,
  },
  {
    id: "user-29",
    name: "Mark Jensen",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=85&w=1600&auto=format&fit=crop",
    headline: "Finance tutor focused on practical money fundamentals",
    canTeach: ["Personal finance", "Spreadsheet modeling"],
    wantsToLearn: ["Public speaking"],
    availability: "Weekend evenings",
    goal: "Teach actionable finance while improving speaking confidence",
    mode: "Online",
    rating: 4.7,
    hourlyRate: "$20/hr",
  },
  {
    id: "user-30",
    name: "Lara Ibrahim",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1526510747491-58f928ec870f?q=85&w=1600&auto=format&fit=crop",
    headline: "Community manager sharing growth tactics and learning AI",
    canTeach: ["Community growth", "Engagement strategy"],
    wantsToLearn: ["Prompt engineering", "AI workflows"],
    availability: "Flexible nights",
    goal: "Design AI-assisted community operations",
    mode: "Online",
    rating: 4.6,
  },
];

const matchwithgoalData: SkillBridgeUser[] = SuggestedUsers.slice(0, 3);

const RECOMMENDATION_USER: SkillBridgeUser[] = SuggestedUsers.slice(3, 9);

const TUTOR_MARKETPLACE: SkillBridgeUser[] = SuggestedUsers.filter(
  (user) => user.role === "Tutor" || user.role === "Both"
).slice(0, 10);

const LEARNING_RESOURCES: LearningResource[] = [
  {
    id: "resource-1",
    title: "React Native MVP checklist",
    subject: "Mobile development",
    level: "Beginner",
    verifiedBy: "SkillBridge mentors",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "resource-2",
    title: "30-day English speaking prompts",
    subject: "Language learning",
    level: "Beginner",
    verifiedBy: "Community tutors",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop",
  },
  {
    id: "resource-3",
    title: "Algebra exam practice set",
    subject: "Mathematics",
    level: "Intermediate",
    verifiedBy: "Tutor review",
    image:
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=2074&auto=format&fit=crop",
  },
  {
    id: "resource-4",
    title: "SQL queries for beginners",
    subject: "Data",
    level: "Beginner",
    verifiedBy: "SkillBridge data mentors",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "resource-5",
    title: "Interview confidence playbook",
    subject: "Career",
    level: "Intermediate",
    verifiedBy: "Community moderators",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop",
  },
];

const DEFAULT_QUESTIONS = [
  {
    id: "q-1",
    title: "How should I structure a 30-day React Native study plan?",
    tag: "Mobile development",
    replies: 8,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
  {
    id: "q-2",
    title: "Looking for an English speaking partner twice a week",
    tag: "Language exchange",
    replies: 5,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
  {
    id: "q-3",
    title: "Can someone review my algebra practice answers?",
    tag: "Mathematics",
    replies: 3,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
];

export {
  SuggestedUsers,
  RECOMMENDATION_USER,
  matchwithgoalData,
  TUTOR_MARKETPLACE,
  LEARNING_RESOURCES,
  DEFAULT_QUESTIONS,
};
