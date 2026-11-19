export type Project = {
  id: string;
  name: string;
  category: string;
  status: string;
  client: string;
  description: string;
  license: string;
  img: string;
  /** The image's real pixel size. The card reserves this shape before the image loads, so nothing jumps */
  imgSize: [width: number, height: number];
  alt: string;
  url: string;
  /** same as img (the photos are graded red/black by scripts/grunge.mjs; originals in /images/projects) */
  grunge: string;
};

const RAW: Omit<Project, "grunge">[] = [
  {
    id: "synapse",
    name: "Synapse",
    category: "System / ML",
    status: "2025",
    client: "Experimental",
    description: ".",
    license: "Private",
    img: "/images/projects/grunge/synapse.webp",
    imgSize: [1400, 934],
    alt: "",
    url: "https://github.com/akshttdev/Synapse",
  },
  {
    id: "cal",
    name: "Cal",
    category: "Full Stack / Scheduling",
    status: "in progress",
    client: "Internal",
    description:
      "A full-stack Cal.com-style scheduling application built with Next.js, Express, Prisma, and PostgreSQL. Enables users to create event types, configure availability, and share public booking links with dynamic slot generation.",
    license: "Private",
    img: "/images/projects/grunge/cal.webp",
    imgSize: [1050, 1400],
    alt: "Cal scheduling application",
    url: "https://github.com/akshttdev/Cal",
  },
  {
    id: "torch",
    name: "Torch",
    category: "AI / RAG System",
    status: "in progress",
    client: "Personal",
    description:
      "A production-style Retrieval-Augmented Generation (RAG) system that acts as a PyTorch support engineer. Retrieves and generates grounded answers using PyTorch docs, source code, and GitHub issues with citation-backed responses.",
    license: "Private",
    img: "/images/projects/grunge/torch.webp",
    imgSize: [1400, 1050],
    alt: "Torch RAG system",
    url: "https://github.com/akshttdev/Torch",
  },
  {
    id: "knot",
    name: "Knot",
    category: "Distributed Systems",
    status: "2026",
    client: "Personal",
    description:
      "Distributed fault-tolerant key-value store written from scratch in C++20. Raft consensus with snapshots and membership changes, a custom LSM-tree storage engine, and a linearizability checker verified under chaos testing.",
    license: "MIT",
    img: "/images/projects/grunge/knot.webp",
    imgSize: [1120, 1400],
    alt: "Knot distributed key-value store",
    url: "https://github.com/akshttdev/knot",
  },

  {
    id: "burnout",
    name: "Burnout",
    category: "Machine Learning",
    status: "2025",
    client: "Demo / Hackathon",
    description:
      "Fastest lap predictions using XGBoost Regressor and minimal feature engineering. Ready for emergency deployment.",
    license: "MIT",
    img: "/images/projects/grunge/burnout.webp",
    imgSize: [1400, 1051],
    alt: "Burnout race predictor",
    url: "https://github.com/akshttdev/burnout",
  },
  {
    id: "agronest",
    name: "AgroNest Infuturum",
    category: "AgriTech / Web",
    status: "2025",
    client: "Hackathon",
    description:
      "Web platform aimed at futuristic agriculture planning and crop data visualization. Built with JavaScript.",
    license: "MIT",
    img: "/images/projects/grunge/agronest.webp",
    imgSize: [1142, 1400],
    alt: "AgroNest interface",
    url: "https://github.com/akshttdev/AgroNestInfuturum",
  },
  {
    id: "rps-robot",
    name: "Rock Paper Scissors PvRobot",
    category: "Web3/Game",
    status: "2024",
    client: "Fun",
    description:
      "A playful Move-based robot game to play rock-paper-scissors against a basic AI. Simple and fun.",
    license: "MIT",
    img: "/images/projects/grunge/rps-robot.webp",
    imgSize: [1400, 1069],
    alt: "PvRobot RPS",
    url: "https://github.com/akshttdev/RockPaperScissorPvRobot",
  },
];

export const projectsData: Project[] = RAW.map((p) => ({ ...p, grunge: p.img }));
