export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  teamLeaderId?: string | null;
  members: Record<string, Role>;
  createdAt: any; // Firestore Timestamp
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | null;
  viewerIds: string[]; // Denormalized Project.members keys for security pillar 8 compliance
  dueDate?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  updatedAt: any; // Firestore Timestamp
  subtasks?: SubTask[];
  tags?: string[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  text: string;
  createdAt: any;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  type: string;
  details: string;
  createdAt: any;
}
