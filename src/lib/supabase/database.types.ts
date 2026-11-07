export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          active: boolean;
          application_status: Database['public']['Enums']['application_status'];
          email: string;
          employee_number: string | null;
          full_name: string;
          id: string;
          identity_blocked: boolean;
          operation_generation: number;
          revoked_before: string;
          role: Database['public']['Enums']['account_role'];
          student_number: string | null;
          synthetic: boolean;
        };
        Insert: {
          active?: boolean;
          application_status?: Database['public']['Enums']['application_status'];
          email: string;
          employee_number?: string | null;
          full_name: string;
          id: string;
          identity_blocked?: boolean;
          operation_generation?: number;
          revoked_before?: string;
          role: Database['public']['Enums']['account_role'];
          student_number?: string | null;
          synthetic?: boolean;
        };
        Update: {
          active?: boolean;
          application_status?: Database['public']['Enums']['application_status'];
          email?: string;
          employee_number?: string | null;
          full_name?: string;
          id?: string;
          identity_blocked?: boolean;
          operation_generation?: number;
          revoked_before?: string;
          role?: Database['public']['Enums']['account_role'];
          student_number?: string | null;
          synthetic?: boolean;
        };
        Relationships: [];
      };
      course_revisions: {
        Row: {
          course_id: string;
          description: string;
          difficulty: string | null;
          estimated_hours: number | null;
          id: string;
          outcomes: string[];
          primary_topic: string | null;
          prior_knowledge: string;
          revision_number: number;
          state: string;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          course_id: string;
          description: string;
          difficulty?: string | null;
          estimated_hours?: number | null;
          id?: string;
          outcomes: string[];
          primary_topic?: string | null;
          prior_knowledge: string;
          revision_number?: number;
          state?: string;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          course_id?: string;
          description?: string;
          difficulty?: string | null;
          estimated_hours?: number | null;
          id?: string;
          outcomes?: string[];
          primary_topic?: string | null;
          prior_knowledge?: string;
          revision_number?: number;
          state?: string;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'course_revisions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'course_drafts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_revisions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      courses: {
        Row: {
          archived_at: string | null;
          id: string;
          owner_id: string;
          published_at: string | null;
        };
        Insert: {
          archived_at?: string | null;
          id: string;
          owner_id: string;
          published_at?: string | null;
        };
        Update: {
          archived_at?: string | null;
          id?: string;
          owner_id?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      course_drafts: {
        Row: {
          details: Json | null;
          id: string | null;
          owner_id: string | null;
          revision_id: string | null;
          updated_at: string | null;
          version: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      account_status: {
        Args: never;
        Returns: {
          active: boolean;
          application_status: Database['public']['Enums']['application_status'];
        }[];
      };
      admit_authentication: {
        Args: { identifier?: string; source_ip: unknown };
        Returns: string;
      };
      advance_email_operation: {
        Args: {
          capability_hash: string;
          full_name?: string;
          proof_id: string;
          step: string;
        };
        Returns: Json;
      };
      approve_demo_application: {
        Args: { project_ref: string; reason: string; target_id: string };
        Returns: Json;
      };
      assert_demo_project: { Args: { project_ref: string }; Returns: undefined };
      bootstrap_demo_administrator: {
        Args: {
          email: string;
          full_name: string;
          manifest_hash: string;
          project_ref: string;
        };
        Returns: Json;
      };
      claim_email_challenge: {
        Args: { capability_hash: string; challenge_hash: string };
        Returns: Json;
      };
      claim_mail_work: { Args: { batch_size?: number }; Returns: Json };
      create_course_draft: {
        Args: { course_id: string; details: Json };
        Returns: Json;
      };
      current_actor: {
        Args: never;
        Returns: {
          active: boolean;
          application_status: Database['public']['Enums']['application_status'];
          id: string;
          role: Database['public']['Enums']['account_role'];
        }[];
      };
      delete_course_draft: {
        Args: { course_id: string; expected_version: number };
        Returns: Json;
      };
      demo_setup_status: {
        Args: { manifest_hash: string; project_ref: string };
        Returns: Json;
      };
      finish_authentication: {
        Args: { attempt_id: string; succeeded: boolean };
        Returns: undefined;
      };
      finish_mail_work: {
        Args: { claim_id: string; delivered: boolean; work_id: string };
        Returns: undefined;
      };
      prepare_mail_work: {
        Args: { claim_id: string; work_id: string };
        Returns: boolean;
      };
      queue_generated_auth_email: {
        Args: {
          native_type: string;
          native_verifier: string;
          recipient: string;
          target_id: string;
        };
        Returns: Json;
      };
      reconcile_auth_mail: { Args: never; Returns: undefined };
      request_registration_verification: {
        Args: { email: string };
        Returns: string;
      };
      reserve_demo_application: {
        Args: {
          email: string;
          employee_number?: string;
          full_name: string;
          manifest_hash: string;
          project_ref: string;
          slot: string;
          student_number?: string;
        };
        Returns: Json;
      };
      reserve_registration: {
        Args: {
          capability_hash: string;
          email: string;
          employee_number?: string;
          full_name: string;
          role: Database['public']['Enums']['account_role'];
          student_number?: string;
        };
        Returns: Json;
      };
      reserve_staff_invitation: {
        Args: {
          email: string;
          full_name: string;
          manifest_hash: string;
          project_ref: string;
        };
        Returns: Json;
      };
      send_auth_email: { Args: { event: Json }; Returns: Json };
      update_course_draft: {
        Args: { course_id: string; details: Json; expected_version: number };
        Returns: Json;
      };
    };
    Enums: {
      account_role: 'student' | 'faculty' | 'program_head' | 'administrator';
      application_status: 'pending' | 'needs_correction' | 'approved' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_role: ['student', 'faculty', 'program_head', 'administrator'],
      application_status: ['pending', 'needs_correction', 'approved', 'rejected'],
    },
  },
} as const;
