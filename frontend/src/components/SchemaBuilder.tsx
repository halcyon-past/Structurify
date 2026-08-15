import { useState, useEffect } from "react";
import { Plus, Trash2, Code, LayoutList, Mail } from "lucide-react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

export type FieldType = "String" | "Integer" | "Float" | "Boolean" | "Date";

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
}

interface SchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  email: string;
  onEmailChange: (email: string) => void;
}

export function SchemaBuilder({ fields, onChange, onSubmit, isSubmitting, isSubmitDisabled, email, onEmailChange }: SchemaBuilderProps) {
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    // Only sync from 'fields' to 'jsonText' when entering JSON mode
    if (mode === "json") {
      setJsonText(JSON.stringify(fields, null, 2));
      setJsonError(null);
    }
  }, [mode, fields]);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Schema must be an array of objects");
      
      const validFields = parsed.map(f => {
        if (!f.name || typeof f.name !== 'string') throw new Error("Each field must have a string 'name'");
        if (!["String", "Integer", "Float", "Boolean", "Date"].includes(f.type)) throw new Error(`Invalid type '${f.type}' for field '${f.name}'`);
        return {
          name: f.name,
          type: f.type,
          required: Boolean(f.required)
        };
      });
      
      setJsonError(null);
      onChange(validFields);
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  };

  const addField = () => {
    onChange([...fields, { name: "", type: "String", required: false }]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: string | boolean) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    onChange(newFields);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Define Target Schema
        </h2>
        <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setMode("builder")}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 ${mode === "builder" ? "bg-white/10 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <LayoutList size={16} /> UI Builder
          </button>
          <button 
            onClick={() => setMode("json")}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 ${mode === "json" ? "bg-white/10 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Code size={16} /> JSON Editor
          </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto pr-2 custom-scrollbar" data-testid="schema-fields-container">
        {mode === "builder" ? (
          fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10 opacity-70">
              <LayoutList size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-300">Auto-Clean Mode Active</p>
              <p className="text-sm mt-2 text-center max-w-sm">No target schema provided. The pipeline will automatically retain all original columns and intelligently clean the messy data.</p>
              <button 
                onClick={addField}
                className="mt-4 flex items-center gap-1 text-sm bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 px-4 py-2 rounded-full font-medium transition-colors"
              >
                <Plus size={16} /> Add First Field
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 group hover:border-white/20 transition-all duration-300 hover:shadow-lg" data-testid="schema-row">
                  <input 
                    type="text" 
                    value={field.name}
                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                    placeholder="Field Name"
                    className="flex-grow bg-white/5 border border-transparent hover:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
                  />
                  <select 
                    value={field.type}
                    onChange={(e) => updateField(idx, 'type', e.target.value as FieldType)}
                    className="bg-white/5 border border-transparent hover:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="String" className="bg-gray-900 text-white">String</option>
                    <option value="Integer" className="bg-gray-900 text-white">Integer</option>
                    <option value="Float" className="bg-gray-900 text-white">Float</option>
                    <option value="Boolean" className="bg-gray-900 text-white">Boolean</option>
                    <option value="Date" className="bg-gray-900 text-white">Date</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200 transition-colors bg-white/5 px-3 py-2.5 rounded-lg border border-transparent hover:border-white/10">
                    <input 
                      type="checkbox" 
                      checked={field.required}
                      onChange={(e) => updateField(idx, 'required', e.target.checked)}
                      className="rounded border-gray-600 bg-black/50 text-accent-500 focus:ring-accent-500/50 focus:ring-offset-gray-900 w-4 h-4 cursor-pointer"
                    />
                    Req
                  </label>
                  <button 
                    onClick={() => removeField(idx)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2.5 bg-white/5 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20"
                    data-testid="remove-field"
                    title="Remove field"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addField}
                className="mt-2 flex items-center justify-center gap-2 text-sm border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-all duration-300"
              >
                <Plus size={16} /> Add Field
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col h-full gap-3">
            <div className="flex-grow w-full h-[200px] bg-black/40 border border-white/5 rounded-xl shadow-inner overflow-auto custom-scrollbar relative focus-within:ring-2 focus-within:ring-accent-500/50">
              <Editor
                value={jsonText}
                onValueChange={(code) => handleJsonChange(code)}
                highlight={(code) => highlight(code, languages.json, 'json')}
                padding={20}
                className="font-mono text-sm leading-relaxed min-h-full"
                style={{
                  fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                }}
              />
            </div>
            {jsonError && (
              <div className="bg-red-500/10 text-red-400 text-sm font-medium p-3 rounded-lg border border-red-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Error: {jsonError}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 relative">
        <div className="mb-6 relative group/email">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-hover/email:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-1 backdrop-blur-sm transition-all shadow-inner focus-within:ring-2 focus-within:ring-accent-500/50 focus-within:border-accent-500/50">
            <div className="pl-4 pr-2 text-gray-400 group-focus-within/email:text-accent-400 transition-colors">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter email for job completion notification..."
              className="w-full bg-transparent border-none px-2 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 transition-all"
            />
            {email && (
              <div className="pr-4 text-xs font-medium text-accent-400 animate-in fade-in flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse"></span>
                Ready
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitDisabled || (mode === "json" && !!jsonError)}
          className="relative w-full overflow-hidden rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-600 via-purple-600 to-blue-600"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center gap-2 py-4 text-white font-bold tracking-wide">
            {isSubmitting ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing Pipeline...</>
            ) : (
              "Compile Heterogeneous Data"
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
