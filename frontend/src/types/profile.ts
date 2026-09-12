// CSVTU B.Tech CSE — Student Profile Types

export interface UnitProfile {
  number: number;
  title: string;
  docSlug?: string; // relative path hint for matching backend files
}

export interface SubjectProfile {
  id: string; // e.g. "mathematics_1"
  name: string; // e.g. "Mathematics-I"
  code?: string; // e.g. "MA-101"
  units: UnitProfile[];
  folderHint?: string; // backend folder name hint
}

export interface SemesterProfile {
  number: number; // 1–8
  status: 'completed' | 'active' | 'upcoming';
  subjects: SubjectProfile[];
  syllabusText?: string; // raw pasted syllabus
  syllabusSlug?: string; // backend syllabus file slug
}

export interface StudentProfile {
  name: string;
  university: string;
  degree: string; // e.g. "B.Tech"
  branch: string; // e.g. "Computer Science & Engineering"
  currentSemester: number; // 1–8
  rollNumber?: string;
  targetYear?: number;
  onboardingComplete: boolean;
  semesters: SemesterProfile[];
  createdAt: string;
  updatedAt: string;
}

// Default CSVTU CSE subjects mock data
export const CSVTU_CSE_SEMESTERS: SemesterProfile[] = [
  {
    number: 1,
    status: 'active',
    syllabusSlug: 'sem1/syllabus_sem1',
    subjects: [
      {
        id: 'mathematics_1', name: 'Mathematics-I', code: 'MA-101', folderHint: 'sem1/subjects/mathematics_1',
        units: [
          { number: 1, title: 'Matrices & Linear Algebra' },
          { number: 2, title: 'Differential Calculus' },
          { number: 3, title: 'Integral Calculus' },
          { number: 4, title: 'Fourier Series', docSlug: 'sem1/subjects/mathematics_1/unit_4_fourier_series' },
          { number: 5, title: 'Differential Equations', docSlug: 'sem1/subjects/mathematics_1/unit_5_differential_equations' },
        ]
      },
      {
        id: 'engineering_physics', name: 'Engineering Physics', code: 'PH-101', folderHint: 'sem1/subjects/engineering_physics',
        units: [
          { number: 1, title: 'Wave Optics' },
          { number: 2, title: 'Lasers & Fiber Optics' },
          { number: 3, title: 'Quantum Mechanics' },
          { number: 4, title: 'Superconductivity' },
          { number: 5, title: 'X-rays & Crystal Structure' },
        ]
      },
      {
        id: 'chemistry_1', name: 'Chemistry-I', code: 'CH-101', folderHint: 'sem1/subjects/chemistry_1',
        units: [
          { number: 1, title: 'Molecular Structure & Bonding' },
          { number: 2, title: 'Spectroscopic Techniques' },
          { number: 3, title: 'Electrochemistry' },
          { number: 4, title: 'Engineering Materials' },
          { number: 5, title: 'Water Technology' },
        ]
      },
      {
        id: 'basic_electrical', name: 'Basic Electrical Engineering', code: 'EE-101', folderHint: 'sem1/subjects/basic_electrical',
        units: [
          { number: 1, title: 'DC Circuits' },
          { number: 2, title: 'Magnetic Circuits & Transformers' },
          { number: 3, title: 'AC Circuits' },
          { number: 4, title: 'DC Machines' },
          { number: 5, title: 'Three-Phase Systems' },
        ]
      },
      {
        id: 'programming_c', name: 'Programming Fundamentals in C', code: 'CS-101', folderHint: 'sem1/subjects/programming_c',
        units: [
          { number: 1, title: 'Introduction to Programming' },
          { number: 2, title: 'Control Structures' },
          { number: 3, title: 'Functions & Strings', docSlug: 'sem1/subjects/programming_c/unit_3_strings' },
          { number: 4, title: 'Arrays & Pointers' },
          { number: 5, title: 'Structures, Unions & File Handling' },
        ]
      },
      {
        id: 'engineering_graphics', name: 'Engineering Graphics', code: 'ME-101', folderHint: 'sem1/subjects/engineering_graphics',
        units: [
          { number: 1, title: 'Drawing Instruments & Lines' },
          { number: 2, title: 'Geometrical Constructions & Curves' },
          { number: 3, title: 'Projections of Points & Lines' },
          { number: 4, title: 'Projections of Solids' },
          { number: 5, title: 'Sectional Views & Development' },
        ]
      },
    ],
  },
  {
    number: 2, status: 'upcoming', subjects: [
      { id: 'mathematics_2', name: 'Mathematics-II', code: 'MA-201', units: [
        { number: 1, title: 'Complex Analysis' }, { number: 2, title: 'Laplace Transforms' },
        { number: 3, title: 'Z-Transforms' }, { number: 4, title: 'Statistics & Probability' },
        { number: 5, title: 'Numerical Methods' },
      ]},
      { id: 'data_structures', name: 'Data Structures', code: 'CS-201', units: [
        { number: 1, title: 'Introduction to Data Structures' }, { number: 2, title: 'Stacks & Queues' },
        { number: 3, title: 'Linked Lists' }, { number: 4, title: 'Trees' }, { number: 5, title: 'Graphs & Sorting' },
      ]},
      { id: 'digital_electronics', name: 'Digital Electronics', code: 'EC-201', units: [
        { number: 1, title: 'Number Systems & Boolean Algebra' }, { number: 2, title: 'Logic Gates & Simplification' },
        { number: 3, title: 'Combinational Circuits' }, { number: 4, title: 'Sequential Circuits' }, { number: 5, title: 'Memory & PLDs' },
      ]},
      { id: 'basic_electronics', name: 'Basic Electronics', code: 'EC-202', units: [
        { number: 1, title: 'Semiconductor Diodes' }, { number: 2, title: 'Transistors' },
        { number: 3, title: 'Amplifiers' }, { number: 4, title: 'Oscillators' }, { number: 5, title: 'Op-Amps' },
      ]},
      { id: 'env_science', name: 'Environmental Sciences', code: 'ES-201', units: [
        { number: 1, title: 'Ecosystem' }, { number: 2, title: 'Natural Resources' },
        { number: 3, title: 'Biodiversity' }, { number: 4, title: 'Environmental Pollution' }, { number: 5, title: 'Social Issues & Environment' },
      ]},
    ]
  },
  {
    number: 3, status: 'upcoming', subjects: [
      { id: 'discrete_maths', name: 'Discrete Mathematics', code: 'CS-301', units: [
        { number: 1, title: 'Logic & Propositional Calculus' }, { number: 2, title: 'Set Theory & Relations' },
        { number: 3, title: 'Lattices & Boolean Algebra' }, { number: 4, title: 'Graph Theory' }, { number: 5, title: 'Combinatorics' },
      ]},
      { id: 'oop_java', name: 'Object Oriented Programming (Java)', code: 'CS-302', units: [
        { number: 1, title: 'Introduction to OOP & Java' }, { number: 2, title: 'Inheritance & Polymorphism' },
        { number: 3, title: 'Interfaces & Packages' }, { number: 4, title: 'Exception Handling & Multithreading' }, { number: 5, title: 'Collections & File I/O' },
      ]},
      { id: 'computer_org', name: 'Computer Organization', code: 'CS-303', units: [
        { number: 1, title: 'Data Representation' }, { number: 2, title: 'CPU Design & Instruction Set' },
        { number: 3, title: 'Memory Organization' }, { number: 4, title: 'I/O Interface' }, { number: 5, title: 'Pipelining' },
      ]},
      { id: 'dsa', name: 'Data Structures & Algorithms', code: 'CS-304', units: [
        { number: 1, title: 'Algorithm Analysis' }, { number: 2, title: 'Trees & Heaps' },
        { number: 3, title: 'Graphs & Shortest Path' }, { number: 4, title: 'Sorting & Searching' }, { number: 5, title: 'String Algorithms' },
      ]},
      { id: 'mathematics_3', name: 'Mathematics-III', code: 'MA-301', units: [
        { number: 1, title: 'Partial Differential Equations' }, { number: 2, title: 'Wave & Heat Equation' },
        { number: 3, title: 'Complex Integration' }, { number: 4, title: 'Residue Theorem' }, { number: 5, title: 'Conformal Mapping' },
      ]},
    ]
  },
  {
    number: 4, status: 'upcoming', subjects: [
      { id: 'operating_systems', name: 'Operating Systems', code: 'CS-401', units: [
        { number: 1, title: 'Process Management' }, { number: 2, title: 'Process Scheduling' },
        { number: 3, title: 'Memory Management' }, { number: 4, title: 'File Systems' }, { number: 5, title: 'Deadlocks & Synchronization' },
      ]},
      { id: 'dbms', name: 'Database Management Systems', code: 'CS-402', units: [
        { number: 1, title: 'ER Model & Relational Algebra' }, { number: 2, title: 'SQL' },
        { number: 3, title: 'Normalization' }, { number: 4, title: 'Transaction Processing' }, { number: 5, title: 'Concurrency & Recovery' },
      ]},
      { id: 'computer_networks', name: 'Computer Networks', code: 'CS-403', units: [
        { number: 1, title: 'Physical & Data Link Layer' }, { number: 2, title: 'Network Layer' },
        { number: 3, title: 'Transport Layer' }, { number: 4, title: 'Application Layer' }, { number: 5, title: 'Network Security' },
      ]},
      { id: 'microprocessors', name: 'Microprocessors & Interfacing', code: 'CS-404', units: [
        { number: 1, title: '8085 Architecture' }, { number: 2, title: '8085 Programming' },
        { number: 3, title: '8086 Architecture' }, { number: 4, title: 'Interfacing Devices' }, { number: 5, title: 'Serial Communication' },
      ]},
      { id: 'software_eng', name: 'Software Engineering', code: 'CS-405', units: [
        { number: 1, title: 'SDLC Models' }, { number: 2, title: 'Requirements Engineering' },
        { number: 3, title: 'Design & Architecture' }, { number: 4, title: 'Testing' }, { number: 5, title: 'Project Management' },
      ]},
    ]
  },
  {
    number: 5, status: 'upcoming', subjects: [
      { id: 'theory_of_computation', name: 'Theory of Computation', code: 'CS-501', units: [
        { number: 1, title: 'Finite Automata & Regular Expressions' }, { number: 2, title: 'Context Free Languages' },
        { number: 3, title: 'Push Down Automata' }, { number: 4, title: 'Turing Machines' }, { number: 5, title: 'Decidability & Complexity' },
      ]},
      { id: 'compiler_design', name: 'Compiler Design', code: 'CS-502', units: [
        { number: 1, title: 'Lexical Analysis' }, { number: 2, title: 'Parsing' },
        { number: 3, title: 'Semantic Analysis' }, { number: 4, title: 'Intermediate Code' }, { number: 5, title: 'Code Optimization & Generation' },
      ]},
      { id: 'artificial_intelligence', name: 'Artificial Intelligence', code: 'CS-503', units: [
        { number: 1, title: 'Problem Solving' }, { number: 2, title: 'Searching Techniques' },
        { number: 3, title: 'Knowledge Representation' }, { number: 4, title: 'Machine Learning Basics' }, { number: 5, title: 'Expert Systems' },
      ]},
      { id: 'web_tech', name: 'Web Technologies', code: 'CS-504', units: [
        { number: 1, title: 'HTML5 & CSS3' }, { number: 2, title: 'JavaScript' },
        { number: 3, title: 'Server Side Programming (PHP/Node)' }, { number: 4, title: 'React.js Basics' }, { number: 5, title: 'Web Security & RESTful APIs' },
      ]},
      { id: 'computer_graphics', name: 'Computer Graphics', code: 'CS-505', units: [
        { number: 1, title: 'Output Primitives' }, { number: 2, title: '2D Transformations' },
        { number: 3, title: '3D Transformations' }, { number: 4, title: 'Visible Surface Detection' }, { number: 5, title: 'Illumination & Color' },
      ]},
    ]
  },
  {
    number: 6, status: 'upcoming', subjects: [
      { id: 'machine_learning', name: 'Machine Learning', code: 'CS-601', units: [
        { number: 1, title: 'Introduction & Linear Regression' }, { number: 2, title: 'Classification (SVM, KNN, Naive Bayes)' },
        { number: 3, title: 'Decision Trees & Ensemble Methods' }, { number: 4, title: 'Neural Networks & Deep Learning' }, { number: 5, title: 'Unsupervised Learning' },
      ]},
      { id: 'cloud_computing', name: 'Cloud Computing', code: 'CS-602', units: [
        { number: 1, title: 'Cloud Fundamentals' }, { number: 2, title: 'Virtualization' },
        { number: 3, title: 'Cloud Service Models (IaaS, PaaS, SaaS)' }, { number: 4, title: 'Big Data & MapReduce' }, { number: 5, title: 'Cloud Security' },
      ]},
      { id: 'information_security', name: 'Information Security', code: 'CS-603', units: [
        { number: 1, title: 'Introduction to Cryptography' }, { number: 2, title: 'Symmetric Encryption' },
        { number: 3, title: 'Asymmetric Encryption & PKI' }, { number: 4, title: 'Authentication & Digital Signatures' }, { number: 5, title: 'Network Security Protocols' },
      ]},
      { id: 'mobile_computing', name: 'Mobile Computing', code: 'CS-604', units: [
        { number: 1, title: 'Mobile Communication' }, { number: 2, title: 'Wireless Networks (802.11)' },
        { number: 3, title: 'Mobile IP' }, { number: 4, title: 'Android Development' }, { number: 5, title: 'Mobile Security' },
      ]},
    ]
  },
  {
    number: 7, status: 'upcoming', subjects: [
      { id: 'distributed_systems', name: 'Distributed Systems', code: 'CS-701', units: [
        { number: 1, title: 'Architecture & Communication' }, { number: 2, title: 'Synchronization' },
        { number: 3, title: 'Distributed File Systems' }, { number: 4, title: 'Consistency & Replication' }, { number: 5, title: 'Distributed Transactions' },
      ]},
      { id: 'data_mining', name: 'Data Mining & Warehousing', code: 'CS-702', units: [
        { number: 1, title: 'Data Warehouse Architecture' }, { number: 2, title: 'OLAP' },
        { number: 3, title: 'Association Rules' }, { number: 4, title: 'Classification & Clustering' }, { number: 5, title: 'Web Mining' },
      ]},
    ]
  },
  {
    number: 8, status: 'upcoming', subjects: [
      { id: 'project', name: 'Major Project', code: 'CS-801', units: [
        { number: 1, title: 'Project Proposal' }, { number: 2, title: 'Literature Survey' },
        { number: 3, title: 'Design & Development' }, { number: 4, title: 'Testing & Evaluation' }, { number: 5, title: 'Final Presentation' },
      ]},
      { id: 'iot', name: 'Internet of Things', code: 'CS-802', units: [
        { number: 1, title: 'IoT Architecture & Protocols' }, { number: 2, title: 'Sensors & Actuators' },
        { number: 3, title: 'IoT Platforms (Raspberry Pi, Arduino)' }, { number: 4, title: 'IoT Applications' }, { number: 5, title: 'IoT Security' },
      ]},
    ]
  },
];
