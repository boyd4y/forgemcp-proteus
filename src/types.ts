import { ProteusInput } from "./config";

export interface ProteusContext extends ProteusInput {
  // Allow arbitrary keys for intermediate data
  [key: string]: any;

  // Standard intermediate/output keys
  outline?: any[];
  imagePrompts?: string[];
  content?: any;
  generatedImages?: string[];
}

export type StepType = 
  | "generate_text" 
  | "generate_json" 
  | "generate_images" 
  | "transform";

export interface Step {
  id: string;
  type: StepType;
  name: string;
  
  // For generate_* steps
  template?: string;
  outputKey?: string;
  inputMapping?: Record<string, string>;
  
  // For transform steps
  handlerId?: string; // ID of the registered processor function (for JSON config)
  handler?: (context: ProteusContext) => Promise<any> | any;
  
  // For generate_images
  imageCountKey?: string;
  promptSourceKey?: string;

  // Optional condition
  condition?: (context: ProteusContext) => boolean;
}

export interface Template {

  id: string;
  description: string;
  steps: Step[];
}
