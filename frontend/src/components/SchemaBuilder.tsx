import { useState, useEffect } from "react";
import { Plus, Trash2, Code, LayoutList } from "lucide-react";

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
}

export function SchemaBuilder({ fields, onChange, onSubmit, isSubmitting, isSubmitDisabled }: SchemaBuilderProps) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">2. Define Target Schema</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setMode(mode === "builder" ? "json" : "builder")}
            className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {mode === "builder" ? <><Code size={16} /> JSON Editor</> : <><LayoutList size={16} /> UI Builder</>}
          </button>
          {mode === "builder" && (
            <button 
              onClick={addField}
              className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus size={16} /> Add Field
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-auto" data-testid="schema-fields-container">
        {mode === "builder" ? (
          fields.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No fields defined.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 group" data-testid="schema-row">
                  <input 
                    type="text" 
                    value={field.name}
                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                    placeholder="Field Name"
                    className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select 
                    value={field.type}
                    onChange={(e) => updateField(idx, 'type', e.target.value as FieldType)}
                    className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="String">String</option>
                    <option value="Integer">Integer</option>
                    <option value="Float">Float</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Date">Date</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm text-gray-600">
                    <input 
                      type="checkbox" 
                      checked={field.required}
                      onChange={(e) => updateField(idx, 'required', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Req
                  </label>
                  <button 
                    onClick={() => removeField(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    data-testid="remove-field"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col h-full gap-2">
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="flex-grow w-full h-[300px] p-4 bg-gray-900 text-green-400 border border-gray-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
              spellCheck={false}
              placeholder={`[
  {
    "name": "example",
    "type": "String",
    "required": true
  }
]`}
            />
            {jsonError && (
              <div className="text-red-500 text-sm font-medium px-1">
                JSON Error: {jsonError}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitDisabled || (mode === "json" && !!jsonError)}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isSubmitting ? "Processing..." : "Compile Heterogeneous Data"}
        </button>
      </div>
    </div>
  );
}
