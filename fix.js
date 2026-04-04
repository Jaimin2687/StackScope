const fs = require('fs');
const path = '/Users/jaimin/StackScope/src/components/results-view.tsx';
let data = fs.readFileSync(path, 'utf8');

// The file is truncated at `              {(Array.is`
// Let's replace anything from `  if (activeTab === "tech_stack") {` onwards

const spliceIndex = data.indexOf('  if (activeTab === "tech_stack") {');
if (spliceIndex !== -1) {
  data = data.substring(0, spliceIndex);
  
  data += `  if (activeTab === "tech_stack") {
    return (
      <motion.div variants={containerState} initial="hidden" animate="show" className="space-y-8">
        {Object.entries(scope.tech_stack).map(([category, items]) => (
          <motion.div key={category} variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {category.replace("_", " ")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(items) ? items : [items]).map((tech: any, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-full border border-[#333] bg-[#111] text-[13px] font-medium text-neutral-300">
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (activeTab === "sql_schema") {
    return (
      <motion.div variants={containerState} initial="hidden" animate="show" className="relative group pb-20 space-y-4">
        
        {/* 1-Click Provisioning Mock */}
        <motion.div variants={itemState} className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center p-4 border border-[#222] bg-[#0a0a0a] rounded-lg">                                                                                                      
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Database Provisioning</h3>
            <p className="text-xs text-neutral-500">Deploy this schema directly to your connected Supabase project.</p>
          </div>
          <div className="flex items-center gap-2">
            {!hasConfig && (
              <button 
                onClick={() => setShowConfigModal(true)}
                className="p-2 rounded-md hover:bg-[#222] text-neutral-500 hover:text-white transition-colors border border-[#333]"
                title="Configure Database"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleDeploy}
              disabled={deployStatus !== "idle"}
              className={\`flex items-center gap-2 px-4 py-2 rounded-md justify-center text-sm font-medium transition-all \${
                deployStatus === "idle" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20" :
                deployStatus === "deploying" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 cursor-wait" :
                "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
              }\`}
            >
              {deployStatus === "idle" && <><Rocket className="w-4 h-4" /> 1-Click Deploy</>}
              {deployStatus === "deploying" && (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /> Executing SQL...</>                                                    
              )}
              {deployStatus === "success" && <><CheckCircle2 className="w-4 h-4" /> Deployed Successfully</>}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemState} className="relative rounded-md border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => copyRef(scope.sql_schema)}
              className="p-2 bg-[#222] border border-[#333] rounded-md text-neutral-400 hover:text-white transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="px-4 py-2 border-b border-[#222] bg-[#111] flex items-center justify-between">
            <span className="text-[12px] font-mono text-neutral-500">schema.sql</span>
          </div>
          <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono text-neutral-300 whitespace-pre-wrap break-words">                                                                                                                                        
            <code>{scope.sql_schema}</code>
          </pre>
        </motion.div>

        {/* Missing Config Modal */}
        <AnimatePresence>
          {showConfigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-md p-6 relative"
              >
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-medium text-white mb-2">Configure Target Database</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  To use 1-Click Deployment, you need to link your own Supabase project credentials in your settings.
                </p>
                <div className="flex gap-3 justify-end mt-8">
                  <button 
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <Link href="/settings">
                    <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors">
                      Go to Settings
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}
`;

  fs.writeFileSync(path, data, 'utf8');
}
