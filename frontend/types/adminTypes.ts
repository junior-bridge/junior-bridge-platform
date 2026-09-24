
export type BugsByMonth = {
  month: string;
  year: number;
  bugs: number;
};

export type RoleDistribution = {
  testers: number;
  clients: number;
  admins: number;
};

export type TopTester = {
  rank: number;
  id: number;
  name: string;
  reputation: number;
};

export type AdminStats = {
  // Dashboard principal
  registered_users: number;
  active_projects: number;
  reported_bugs: number;
  active_testers: number;

  // Estadísticas
  resolved_bugs: number;
  resolution_rate: number;

  // Gráfico de bugs por mes
  bugs_by_month: BugsByMonth[];

  // Distribución de usuarios por rol
  role_distribution: RoleDistribution;

  // Ranking de testers
  top_testers: TopTester[];
};