const fs = require('fs');
const file = 'src/app/workspace/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/<ResultsView \s*scope=\{scopeResult\}\s*activeTab=\{activeTab\}\s*onTabChange=\{setActiveTab\}\s*\/>/m, `<ResultsView 
                      scope={scopeResult} 
                      activeTab={activeTab} 
                      onTabChange={setActiveTab} 
                      scopeId={id}
                      onScopeUpdate={(newScope) => setScopeResult(newScope)}
                    />`);

fs.writeFileSync(file, data);
