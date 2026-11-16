export interface MasterTracker {
  id: string;
  created_by: string;
  created_on: string;
  last_updated_by: string;
  last_updated_on: string;
  is_active: boolean;
  code: string;
  parent_code: string | null;
  description: string;
  action_type: string;
  module_flow: string;
  is_using_notification: boolean;
  is_public: boolean;
  icon: string;
  order: number;
  mandays: number;
  is_parallel: boolean;
}

export interface RequestHeader {
  id: string;
  created_by: string;
  created_on: string;
  last_updated_by: string;
  last_updated_on: string;
  is_active: boolean;
  project_code: string;
  receiving_status: string;
  total_fee: number;
  received_date: string | null;
  partner_id: string;
  company_name?: string;
  last_status: string;
  analysis_wip_date: string | null;
  analysis_completed_date: string | null;
  lead_time: number;
}

export interface TransactionTracking {
  id: string;
  created_by: string;
  created_on: string;
  last_updated_by: string;
  last_updated_on: string;
  is_active: boolean;
  tracker_id: string;
  request_id: string;
  value: string;
  partner_id: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  module: string;
  endpoint?: string;
  details?: string;
  statusCode: number;
}
