const fs = require('fs');
const file = 'src/components/results-view.tsx';
let data = fs.readFileSync(file, 'utf8');

// Completely remove any existing Chat UI block First
const badBlockRegex = /\s*\{\/\* Floating AI Chat Iteration \*\/\}[\s\S]*?<\/form>\s*<\/motion\.div>\s*<\/div>/g;
data = data.replace(badBlockRegex, '');

const chatUI = `

        {/* Floating AI Chat Iteration */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-auto lg:-translate-x-0 lg:right-10 z-[100] w-[400px] shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-[#222] rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
          >
            {isPatching && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Loader2 className="absolute inset-0 w-8 h-8 text-indigo-500 animate-spin opacity-50" />
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Refactoring Architecture...</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-neutral-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ask AI to adjust architecture
              </span>
            </div>
            {patchError && <div className="text-[11px] text-red-400 px-2 py-1 bg-red-400/10 rounded">{patchError}</div>}
            <form onSubmit={handleChatPatch} className="relative">
              <input
                disabled={isPatching}
                type="text"
                placeholder="e.g. 'Add Stripe integration' or 'Remove websockets'"
                className="w-full bg-[#0a0a0a] border border-[#333] focus:border-indigo-500/50 rounded-xl px-4 py-3 pb-8 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none transition-all disabled:opacity-50"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!chatMessage.trim() || isPatching}
                className="absolute right-2 bottom-2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                title="Send update request"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
`;

// Insert it properly INSIDE the motion.div return blocks
// Block 1: proposal
data = data.replace(
  /(<\/div>\s*<\/motion\.div>\s*)\}\)\}\s*<\/div>\s*<\/motion\.div>\s*\)\s*\})/g, 
  (match) => {
    // This regex might fail, let's just do a simpler search/replace on the closing tags.
    return match;
  }
);

// Actually, an easier way is to just wrap the return content completely.
data = data.replace(/(\s*return\s*\(\s*)(<motion\.div variants=\{containerState\} initial="hidden" animate="show" className="space-y-12 pb-20">[\s\S]*?)(      <\/motion\.div>\s*\);)/g, `$1<>\n$2${chatUI}\n$3\n</>\n);`);

data = data.replace(/(\s*return\s*\(\s*)(<motion\.div variants=\{containerState\} initial="hidden" animate="show" className="space-y-8 pb-20">[\s\S]*?)(      <\/motion\.div>\s*\);)/g, `$1<>\n$2${chatUI}\n$3\n</>\n);`);

data = data.replace(/(\s*return\s*\(\s*)(<motion\.div variants=\{containerState\} initial="hidden" animate="show" className="relative group pb-20 space-y-4">[\s\S]*?)(      <\/motion\.div>\s*\);)/g, `$1<>\n$2${chatUI}\n$3\n</>\n);`);

fs.writeFileSync(file, data);
