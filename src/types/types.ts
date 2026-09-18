export type defaultValueT = {
  [key: string]: string | number | boolean | undefined;
};
export type createAdminT = {
  name: string;
  email: string;
  username: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
  permission_type_ids: number[];
};
export type updateAdminT = createAdminT & {
  id: string;
};

export type Tadmin = {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  status: "inactive" | "active";
};
export type AdminPermissions = {
  id: number;
  admin_id: number;
  permission_type_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  permission_type: {
    id: number;
    permission_group_id: number;
    name: string;
    label: string;
    created_at: string;
    updated_at: string;
    group: {
      id: number;
      name: string;
      label: string;
      created_at: string;
      updated_at: string;
    };
  };
};

export type AdminApiResponse = {
  response: {
    status: string;
    message: string;
  };
  data: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    username: string;
    status: string;
    force_reset_password: boolean;
    last_logined: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    permissions: AdminPermissions[];
  }[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};

export type TLink = {
  first: string;
  last: string;
  prev: string;
  next: string | null;
};
export type TMeta = {
  current_page: number;
  from: number;
  last_page: number;
  total_pages?: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
};
export type AdminModel = {
  data: Tadmin[];
  link: TLink;
  meta: TMeta;
};

export type createAdminResponseT = {
  response: {
    status: string;
    message: string;
  };
  data: {
    id: number;
    name: string;
    email: string;
    username: string;
    phone_number: string;
    created_at: string;
    updated_at: string;
  };
};

export type PermissionType = {
  id: number;
  permission_group_id: number;
  name: string;
  label: string;
  created_at: string;
  updated_at: string;
};

export type PermissionGroup = {
  id: number;
  name: string;
  label: string;
  created_at: string;
  updated_at: string;
  permission_types: PermissionType[];
};

export type PermissionsApiResponse = {
  response: {
    status: string;
    message: string;
  };
  data: PermissionGroup[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};
export type StepOneT = {
  is_single: number;
  email: string;
  phone: string;
  address: string;
  max_purchased_price: number;
  employment_type: string;
  employment_duration: string;
  basic_income: number;
  cash_benefits: number;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
};
export type StepTwoT = {
  partner_employment_type: string;
  partner_employment_duration: string;
  partner_basic_income: number;
  partner_cash_benefits: number;
  professional_type: string;
  is_in_restricted_postcode: number;
  card_limit: number;
  average_expenses: number;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
};
export type StepThreeT = {
  deposit_type: string;
  deposit_amount: number;
  is_preferred_lender: number;
  preferred_lender: string;
  no_of_dependents: number;
  dependents_ages: string;
  monthly_repayments: number;
  credit_defaults_amount: number;
  guarantor_name: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
};
export type ProfileT = {
  id: number;
  tracking_token: string;
  user_id: number;
  status: "complete" | "partial";
  step_one: StepOneT;
  step_two: StepTwoT;
  step_three: StepThreeT;
  created_at?: string;
  updated_at?: string;
};
export type Tuser = {
  id: number;
  name: string;
  email: string;
  username: string;
  phone_number: string;
  status: "inactive" | "active";
  email_verified_at: string;
  profile_status: "complete" | "partial" | null;
  profile: ProfileT | null;
};
export type UserDetailT = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  username: string;
  status: "active" | "inactive";
  email_verified_at: string;
  is_verified: boolean;
  profile_status: "complete" | "partial" | null;
  profile: ProfileT | null;
};

export type UserModel = {
  data: UserDetailT[];
  link: TLink;
  meta: TMeta;
};

export type StepOneResT = {
  message: string;
  tracking_token: string;
  status: "partial" | "complete";
};

export type ServiceByIdT = {
  id: number;
  name: string;
  type: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  };
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};
export type ServiceModel = {
  data: ServiceByIdT[];
  link: TLink;
  meta: TMeta;
};

export type ProfessionalByIdT = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  title: string | null;
  phone: string | null;
  office_phone: string | null;
  organization: string | null;
  state: string | null;
  address: string | null;
  service: ServiceByIdT | null;
  description: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};
export type ProfessionalResponseT = {
  data: ProfessionalByIdT[];
  link: TLink;
  meta: TMeta;
};
export type QuestionByIdT = {
  id: number;
  name: string;
  question_count: number;
  type: string;
  status: "active" | "inactive";
  questions: {
    id: number;
    title: string;
    type: string;
    answers: {
      id: number;
      text: string;
    }[];
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
  }[];
  created_at: string;
  updated_at: string;
};

export type QuestionResponseT = {
  data: QuestionByIdT[];
  link: TLink;
  meta: TMeta;
};
export type createQuestionT = {
  service_id: number;
  _method?: string;
  questions: {
    id?: number;
    title: string;
    answers: {
      text: string;
    }[];
  }[];
};

export type WorkflowByIdT = {
  id: number;
  name: string;
  workflow_count: number;
  workflows: {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }[];
  created_at: string;
  updated_at: string;
};

export type WorkflowResponseT = {
  data: WorkflowByIdT[];
  link: TLink;
  meta: TMeta;
};
export type createWorkflowT = {
  service_id: number;
  _method?: string;
  workflows: {
    id?: number;
    name: string;
  }[];
};
export type ServiceByIdWithWorkFlows = ServiceByIdT & {
  workflows: {
    id: number;
    service_id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }[];
};
export type ServiceRequestByIdT = {
  id: number;
  service: ServiceByIdWithWorkFlows;
  user: {
    id: number;
    name: string;
    email: string;
  };
  professional: ProfessionalByIdT;
  workflow: {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
  answers: {
    id: number;
    question: QuestionByIdT;
    answer: string;
  }[];
  created_at: string;
  updated_at: string;
};
export type ServiceRequestResponseT = {
  data: ServiceRequestByIdT[];
  link: TLink;
  meta: TMeta;
};

export type AdminProfileResponseT = {
  data: {
    id: number;
    name: string;
    email: string;
    status: string;
    role: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
  };
};

export type ProfessionalProfileResponseT = {
  data: {
    id: number;
    name: string;
    email: string;
    status: string;
    title: string;
    phone: string;
    office_phone: string;
    organization: string;
    state: string;
    address: string;
    website: string;
    service: {
      id: number;
      name: string;
      type: string;
      categories: {
        id: number;
        name: string;
        slug: string;
      };
      status: string;
      created_at: string;
      updated_at: string;
    };
    description: string;
    note: string;
    created_at: string;
    updated_at: string;
  };
};
export type ProfessionalProfileCreateT = {
  name: string;
  email: string;
  title: string;
  phone: string;
  office_phone: string;
  organization: string;
  website: string;
  state: string;
  address: string;
  description: string;
  note: string;
};
