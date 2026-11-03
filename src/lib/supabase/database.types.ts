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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
      current_actor: {
        Args: never;
        Returns: {
          active: boolean;
          application_status: Database['public']['Enums']['application_status'];
          id: string;
          role: Database['public']['Enums']['account_role'];
        }[];
      };
      demo_setup_status: {
        Args: { manifest_hash: string; project_ref: string };
        Returns: Json;
      };
      finish_mail_work: {
        Args: { claim_id: string; delivered: boolean; work_id: string };
        Returns: undefined;
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
