interface ResumeData {
  text: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    techStack: string[];
  }>;
  metadata: {
    fileName: string;
    fileSize: number;
    uploadDate: string;
  };
}

export async function parseResume(file: File): Promise<ResumeData> {
  const fileName = file.name;
  const fileSize = file.size;
  const uploadDate = new Date().toISOString();

  let text = '';

  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("PDF Parsing Server Error:", errText);
        throw new Error(`PDF Parsing failed: ${response.statusText}`);
    }

    const data = await response.json();
    text = data.text || '';
  } else if (file.type === 'application/json') {
    const content = await file.text();
    const jsonData = JSON.parse(content);
    text = JSON.stringify(jsonData, null, 2);
  } else if (file.type === 'text/plain') {
    text = await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload PDF, JSON, or TXT file.');
  }

  const skills = extractSkills(text);
  const projects = extractProjects(text);

  return {
    text,
    skills,
    projects,
    metadata: {
      fileName,
      fileSize,
      uploadDate,
    },
  };
}

function extractSkills(text: string): string[] {
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'Git', 'CI/CD', 'REST', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'Data Science',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Next.js', 'Gatsby', 'Webpack', 'Vite',
  ];

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  skillKeywords.forEach((skill) => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

function extractProjects(text: string): Array<{ name: string; description: string; techStack: string[] }> {
  const projects: Array<{ name: string; description: string; techStack: string[] }> = [];

  const projectSectionMatch = text.match(/projects?[\s\S]*?(?=\n\n[A-Z]|$)/i);
  if (!projectSectionMatch) return projects;

  const projectSection = projectSectionMatch[0];
  const projectLines = projectSection.split('\n').filter((line) => line.trim());

  let currentProject: { name: string; description: string; techStack: string[] } | null = null;

  projectLines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.match(/^[A-Z][a-zA-Z\s]+$/)) {
      if (currentProject !== null) {
        projects.push(currentProject);
      }
      currentProject = { name: trimmedLine, description: '', techStack: [] };
    } else if (currentProject !== null && trimmedLine) {
      if (currentProject.description) {
        currentProject.description += ' ' + trimmedLine;
      } else {
        currentProject.description = trimmedLine;
      }

      const skills = extractSkills(trimmedLine);
      currentProject.techStack.push(...skills);
    }
  });

  if (currentProject !== null) {
    projects.push(currentProject);
  }

  return projects.slice(0, 5);
}
