declare module "@shared/schema" {
  export interface User {
    id: number;
    username: string;
    fullName: string;
    isAdmin: boolean;
  }

  export interface UserAuth {
    username: string;
    password: string;
  }

  export interface Grade {
    id: number;
    name: string;
  }

  export interface Subject {
    id: number;
    name: string;
    type?: string;
  }

  export interface PlanningWeek {
    id: number;
    weekNumber: number;
    year: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }
}
