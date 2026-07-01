export type FieldSchema = {
  key: string;
  label: string;
  type: "text" | "url" | "date";
  required?: boolean;
};

export type CustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  fieldSchema: FieldSchema[];
  order: number | null;
  items: CustomItem[];
};

export type CustomItem = {
  id: number;
  sectionId: number;
  data: Record<string, string>;
  order: number | null;
};

export type CustomSectionInput = {
  name: string;
  description?: string;
  icon?: string;
  fieldSchema: FieldSchema[];
};

export type CustomItemInput = {
  data: Record<string, string>;
};

export type BackendCustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  field_schema: FieldSchema[];
  order: number | null;
  user_id: number;
  items: BackendCustomItem[];
};

export type BackendCustomItem = {
  id: number;
  section_id: number;
  data: Record<string, string>;
  order: number | null;
};

export type BackendCustomSectionInput = {
  name: string;
  description?: string;
  icon?: string;
  field_schema: FieldSchema[];
};

export type BackendCustomItemInput = {
  data: Record<string, string>;
};
