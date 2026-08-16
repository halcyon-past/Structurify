import re

with open("frontend/src/app/admin/page.tsx", "r") as f:
    content = f.read()

settings_tab = """          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Server className="w-6 h-6 text-purple-400"/> 
                    System Configuration
                  </h3>
                  <button 
                    onClick={() => localSettings && saveSystemSettings(localSettings)}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    Save Changes
                  </button>
                </div>
                
                {localSettings ? (
                  <div className="space-y-8 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Gemini LLM Model</label>
                        <p className="text-sm text-gray-500 mb-2">Select the underlying Gemini model used by the ETL worker for data transformation.</p>
                        <select 
                          value={localSettings.llm_model || 'gemini-2.5-flash'}
                          onChange={(e) => setLocalSettings({...localSettings, llm_model: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Accuracy)</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash (Legacy)</option>
                          <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Max Rows Per Chunk</label>
                        <p className="text-sm text-gray-500 mb-2">The absolute maximum number of rows a worker will send to Gemini in a single prompt.</p>
                        <input 
                          type="number"
                          value={localSettings.max_rows_per_chunk || 500}
                          onChange={(e) => setLocalSettings({...localSettings, max_rows_per_chunk: parseInt(e.target.value) || 500})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Target Cells Per Chunk</label>
                        <p className="text-sm text-gray-500 mb-2">Target cell threshold (rows × columns). Used to dynamically scale down chunk size for wide CSVs.</p>
                        <input 
                          type="number"
                          value={localSettings.target_cells_per_chunk || 5000}
                          onChange={(e) => setLocalSettings({...localSettings, target_cells_per_chunk: parseInt(e.target.value) || 5000})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <hr className="border-white/10" />
                    
                    <h4 className="text-lg font-bold text-white mb-4">Prompt Management</h4>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Auto-Clean System Prompt</label>
                        <textarea 
                          rows={6}
                          value={localSettings.prompt_auto_clean_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_auto_clean_system: e.target.value})}
                          placeholder="You are a strict data transformation engine..."
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Auto-Clean User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_auto_clean_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_auto_clean_user: e.target.value})}
                          placeholder="Clean the following CSV data... \n\n{chunk_data}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Schema Map System Prompt</label>
                        <textarea 
                          rows={6}
                          value={localSettings.prompt_schema_map_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_schema_map_system: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Schema Map User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_schema_map_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_schema_map_user: e.target.value})}
                          placeholder="Map the following CSV data... \n\n{chunk_data}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Metadata System Prompt</label>
                        <textarea 
                          rows={4}
                          value={localSettings.prompt_metadata_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_metadata_system: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Metadata User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_metadata_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_metadata_user: e.target.value})}
                          placeholder="Schema: {schema}\nStats: {stats}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">Loading settings...</div>
                )}
              </div>
            </div>
          )}"""

content = re.sub(
    r'\{activeTab === "settings" && \(\s*<div.*?</div>\s*</div>\s*\)\}',
    settings_tab,
    content,
    flags=re.DOTALL
)

with open("frontend/src/app/admin/page.tsx", "w") as f:
    f.write(content)
